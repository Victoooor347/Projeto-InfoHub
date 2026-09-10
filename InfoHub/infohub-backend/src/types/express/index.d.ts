import "express";

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id_usuario: number;
        nome: string;
        email: string;
        perfil: "aluno" | "mentor" | "admin";
      };
    }
  }
}
