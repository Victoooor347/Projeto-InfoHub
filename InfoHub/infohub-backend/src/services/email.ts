import nodemailer from "nodemailer";
import { env } from "../config/env";

/**
 * Envio de e-mail via SMTP (Gmail, Brevo, Mailtrap, o SMTP da faculdade...).
 *
 * Três modos, decididos pelas variáveis de ambiente:
 *  - "enviado"  → SMTP configurado; vai para os destinatários reais;
 *  - "teste"    → SMTP configurado + EMAIL_TESTE_PARA; tudo vai para esse
 *                 endereço (os destinatários reais aparecem no assunto);
 *  - "simulado" → sem SMTP; nada sai, o conteúdo é impresso no log.
 */
export type ModoEnvio = "enviado" | "teste" | "simulado";

export const emailConfigurado = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const transporter = emailConfigurado
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // 465 = TLS direto; 587 = STARTTLS
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

export interface Email {
  para: string[];
  assunto: string;
  texto: string;
  html: string;
}

export async function enviarEmail(email: Email): Promise<ModoEnvio> {
  if (email.para.length === 0) throw new Error("E-mail sem destinatários");

  if (!transporter) {
    console.log(
      `[email simulado] Para: ${email.para.join(", ")}\n  Assunto: ${email.assunto}\n  ${email.texto.replace(/\n/g, "\n  ")}`
    );
    return "simulado";
  }

  const remetente = env.EMAIL_FROM ?? `InfoHub <${env.SMTP_USER}>`;

  if (env.EMAIL_TESTE_PARA) {
    await transporter.sendMail({
      from: remetente,
      to: env.EMAIL_TESTE_PARA,
      subject: `[TESTE → ${email.para.join(", ")}] ${email.assunto}`,
      text: email.texto,
      html: email.html,
    });
    return "teste";
  }

  // cada integrante vê só o próprio endereço (bcc), não o dos colegas
  await transporter.sendMail({
    from: remetente,
    to: remetente,
    bcc: email.para,
    subject: email.assunto,
    text: email.texto,
    html: email.html,
  });
  return "enviado";
}

/** Escapa texto do banco antes de colocar no HTML do e-mail. */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
