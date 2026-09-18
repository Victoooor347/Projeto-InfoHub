import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { USUARIO_COLUNAS_PUBLICAS, type Usuario } from "../usuarios/usuarios.types";
import type { Equipe } from "../equipes/equipes.types";
import { ETAPAS_PADRAO } from "../../db/etapasPadrao";
import type { InscricaoInput } from "./inscricao.schemas";

/**
 * RF-02/RF-05: aluno preenche o formulário inicial → cria a própria conta
 * (líder), a equipe entra automaticamente na Etapa 1, e os colegas
 * informados (só e-mail + curso, sem RA) são vinculados:
 *  - se o e-mail já existe no sistema, a pessoa é adicionada direto na
 *    equipe, sem precisar "aceitar" nada (esclarecido com o cliente);
 *  - se não existe, a conta já é criada agora com uma senha provisória
 *    ALEATÓRIA (diferente para cada colega). Essas senhas voltam na resposta
 *    para o líder repassar aos colegas — enquanto não houver serviço de
 *    e-mail, é o único jeito seguro de eles logarem.
 *  - só contas de ALUNO podem ser vinculadas como colega: a rota é pública,
 *    então sem essa trava qualquer um poderia enfiar o e-mail de um
 *    admin/mentor dentro de uma equipe.
 * E-mails são sempre gravados em minúsculas.
 * Tudo roda numa única transação: ou tudo é criado, ou nada é.
 */
export interface ColegaCriado {
  nome: string;
  email: string;
  senha_provisoria: string;
}

/** Senha provisória legível (sem caracteres ambíguos como 0/O, 1/l). */
function gerarSenhaProvisoria(tamanho = 10): string {
  const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(tamanho);
  let senha = "";
  for (let i = 0; i < tamanho; i++) senha += alfabeto[bytes[i] % alfabeto.length];
  return senha;
}

export async function registrarCadastroInicial(input: InscricaoInput) {
  const emailLider = input.email.trim().toLowerCase();
  const colegasCriados: ColegaCriado[] = [];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existente = await client.query(`SELECT 1 FROM usuario WHERE lower(email) = $1`, [emailLider]);
    if (existente.rowCount) {
      throw AppError.conflict("Já existe uma conta com esse e-mail");
    }

    const senha_hash = await bcrypt.hash(input.senha, 10);
    const liderR = await client.query<Usuario>(
      `INSERT INTO usuario (nome, telefone, email, senha_hash, perfil, id_curso, semestre)
       VALUES ($1,$2,$3,$4,'aluno',$5,$6)
       RETURNING ${USUARIO_COLUNAS_PUBLICAS}`,
      [input.nome_lider, input.telefone, emailLider, senha_hash, input.id_curso, input.semestre]
    );
    const lider = liderR.rows[0];

    // 1) cria a equipe sem id_etapa_atual ainda (etapa é por-equipe agora,
    //    e a etapa só pode existir depois que a equipe existe — mesma
    //    referência circular resolvida no schema.sql e no seed.ts)
    const equipeR = await client.query<Equipe>(
      `INSERT INTO equipe (nome_equipe, nome_ideia, descricao_ideia, area_ideia, estagio_ideia, como_conheceu)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        input.nome_equipe,
        input.nome_ideia,
        input.descricao_ideia,
        input.area_ideia,
        input.estagio_ideia,
        input.como_conheceu ?? null,
      ]
    );
    let equipe = equipeR.rows[0];

    // 2) copia as 6 etapas padrão já pertencendo a essa equipe (ordem 1 a 6)
    let idPrimeiraEtapa: number | null = null;
    for (let i = 0; i < ETAPAS_PADRAO.length; i++) {
      const { nome, descricao } = ETAPAS_PADRAO[i];
      const etapaR = await client.query<{ id_etapa: number }>(
        `INSERT INTO etapa (id_equipe, ordem, nome, descricao, padrao) VALUES ($1,$2,$3,$4,TRUE) RETURNING id_etapa`,
        [equipe.id_equipe, i + 1, nome, descricao]
      );
      if (i === 0) idPrimeiraEtapa = etapaR.rows[0].id_etapa;
    }

    // 3) só agora fecha id_etapa_atual apontando pra Etapa 1 (ordem 1) DELA
    const equipeAtualizadaR = await client.query<Equipe>(
      `UPDATE equipe SET id_etapa_atual = $1 WHERE id_equipe = $2 RETURNING *`,
      [idPrimeiraEtapa, equipe.id_equipe]
    );
    equipe = equipeAtualizadaR.rows[0];

    await client.query(
      `INSERT INTO equipe_usuario (id_equipe, id_usuario, papel) VALUES ($1,$2,'lider')`,
      [equipe.id_equipe, lider.id_usuario]
    );

    for (const colega of input.colegas) {
      const emailColega = colega.email.trim().toLowerCase();
      if (!emailColega || emailColega === emailLider) continue;

      const colegaExistente = await client.query<{ id_usuario: number; perfil: string }>(
        `SELECT id_usuario, perfil FROM usuario WHERE lower(email) = $1`,
        [emailColega]
      );

      let idColega: number;
      if (colegaExistente.rows[0]) {
        if (colegaExistente.rows[0].perfil !== "aluno") {
          throw AppError.conflict(`O e-mail ${emailColega} não pertence a um aluno e não pode entrar na equipe`);
        }
        idColega = colegaExistente.rows[0].id_usuario;
      } else {
        const senhaProvisoria = gerarSenhaProvisoria();
        const nomeColega = colega.nome?.trim() || emailColega.split("@")[0];
        const novoColegaR = await client.query<{ id_usuario: number }>(
          `INSERT INTO usuario (nome, telefone, email, senha_hash, perfil, id_curso)
           VALUES ($1, NULL, $2, $3, 'aluno', $4) RETURNING id_usuario`,
          [nomeColega, emailColega, await bcrypt.hash(senhaProvisoria, 10), colega.id_curso]
        );
        idColega = novoColegaR.rows[0].id_usuario;
        colegasCriados.push({ nome: nomeColega, email: emailColega, senha_provisoria: senhaProvisoria });
      }

      // ON CONFLICT: se o colega aparecer duas vezes na lista, ignora silenciosamente
      await client.query(
        `INSERT INTO equipe_usuario (id_equipe, id_usuario, papel) VALUES ($1,$2,'integrante')
         ON CONFLICT (id_equipe, id_usuario) DO NOTHING`,
        [equipe.id_equipe, idColega]
      );
    }

    await client.query("COMMIT");
    return { usuario: lider, equipe, colegasCriados };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
