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
import { tarefasRouter } from "./modules/tarefas/tarefas.routes";
import { entregaveisRouter } from "./modules/entregaveis/entregaveis.routes";
import { anotacoesRouter } from "./modules/anotacoes/anotacoes.routes";
import { lembretesRouter } from "./modules/lembretes/lembretes.routes";
import { inscricaoRouter } from "./modules/inscricao/inscricao.routes";

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/cursos", cursosRouter);
app.use("/api/etapas", etapasRouter);
app.use("/api/status-tarefas", statusTarefasRouter);
app.use("/api/equipes", equipesRouter);
app.use("/api/equipe-usuarios", equipeUsuariosRouter);
app.use("/api/tarefas", tarefasRouter);
app.use("/api/entregaveis", entregaveisRouter);
app.use("/api/anotacoes", anotacoesRouter);
app.use("/api/lembretes", lembretesRouter);
app.use("/api/inscricao", inscricaoRouter);

// 404 — sem path (evita o bug de wildcard "*"/"/*" do path-to-regexp no Express 5)
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

// error handler central sempre por último
app.use(errorHandler);
