import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { usuariosRouter } from "./modules/usuarios/usuarios.routes";
import { cursosRouter } from "./modules/cursos/cursos.routes";
import { etapasRouter } from "./modules/etapas/etapas.routes";
import { statusTarefasRouter } from "./modules/statusTarefas/statusTarefas.routes";
import { equipesRouter } from "./modules/equipes/equipes.routes";
import { equipeUsuariosRouter } from "./modules/equipeUsuarios/equipeUsuarios.routes";
import { equipeMentoresRouter } from "./modules/equipeMentores/equipeMentores.routes";
import { tarefasRouter } from "./modules/tarefas/tarefas.routes";
import { entregaveisRouter } from "./modules/entregaveis/entregaveis.routes";
import { anotacoesRouter } from "./modules/anotacoes/anotacoes.routes";
import { lembretesRouter } from "./modules/lembretes/lembretes.routes";
import { inscricaoRouter } from "./modules/inscricao/inscricao.routes";
import { arquivosRouter } from "./modules/arquivos/arquivos.routes";

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
// 10 MB: comporta um arquivo de até 5 MB em base64 (≈ +33%) no envio de entregáveis
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/cursos", cursosRouter);
// GET /api/etapas agora lista TODA etapa de TODA equipe (cada linha já
// identificada por id_equipe) — não é mais o catálogo global ambíguo de
// antes. Só admin/mentor (mesmo padrão de /equipe-usuarios). Aluno usa
// GET /equipes/:id/etapas para a própria equipe.
app.use("/api/etapas", etapasRouter);
app.use("/api/status-tarefas", statusTarefasRouter);
app.use("/api/equipes", equipesRouter);
app.use("/api/equipe-usuarios", equipeUsuariosRouter);
app.use("/api/equipe-mentores", equipeMentoresRouter);
app.use("/api/tarefas", tarefasRouter);
app.use("/api/entregaveis", entregaveisRouter);
app.use("/api/anotacoes", anotacoesRouter);
app.use("/api/lembretes", lembretesRouter);
app.use("/api/inscricao", inscricaoRouter);
app.use("/api/arquivos", arquivosRouter);

// ---------- frontend (React já compilado) ----------
// Deploy único: o build do Vite (infohub-frontend/dist) é servido por este
// mesmo Express. Funciona tanto em src/ (tsx) quanto em dist/ (node), porque
// os dois ficam um nível abaixo de infohub-backend/.
const FRONTEND_DIST = path.resolve(__dirname, "../../infohub-frontend/dist");

if (fs.existsSync(path.join(FRONTEND_DIST, "index.html"))) {
  app.use(express.static(FRONTEND_DIST));

  // SPA: qualquer GET que não seja da API (ex.: F5 em /admin/equipes) devolve
  // o index.html e o React Router resolve a tela. Sem wildcard "*" por causa
  // do path-to-regexp do Express 5.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/") || req.path === "/health") return next();
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
} else {
  console.warn(`Build do frontend não encontrado em ${FRONTEND_DIST} — servindo só a API.`);
}

// 404 — sem path (evita o bug de wildcard "*"/"/*" do path-to-regexp no Express 5)
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

// error handler central sempre por último
app.use(errorHandler);
