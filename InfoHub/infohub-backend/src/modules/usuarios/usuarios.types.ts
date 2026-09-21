export type Perfil = "aluno" | "mentor" | "admin";

export interface Usuario {
  id_usuario: number;
  nome: string;
  telefone: string | null;
  email: string;
  perfil: Perfil;
  id_curso: number | null;
  semestre: number | null;
  ativo: boolean;
  criado_em: string;
  /** Senha provisória: o usuário é obrigado a trocar no próximo acesso. */
  deve_trocar_senha: boolean;
}

/** Mesma forma que Usuario, mas nunca inclui senha_hash — usar para toda resposta HTTP. */
export const USUARIO_COLUNAS_PUBLICAS = `
  id_usuario, nome, telefone, email, perfil, id_curso, semestre, ativo, criado_em, deve_trocar_senha
`;
