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
 *  - se não existe, a conta já é criada agora (senha provisória) para que
 *    a pessoa também consiga logar depois.
 * Tudo roda numa única transação: ou tudo é criado, ou nada é.
 */
export async function registrarCadastroInicial(input: InscricaoInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existente = await client.query(`SELECT 1 FROM usuario WHERE email = $1`, [input.email]);
    if (existente.rowCount) {
      throw AppError.conflict("Já existe uma conta com esse e-mail");
    }

    const senha_hash = await bcrypt.hash(input.senha, 10);
    const liderR = await client.query<Usuario>(
      `INSERT INTO usuario (nome, telefone, email, senha_hash, perfil, id_curso, semestre)
       VALUES ($1,$2,$3,$4,'aluno',$5,$6)
       RETURNING ${USUARIO_COLUNAS_PUBLICAS}`,
      [input.nome_lider, input.telefone, input.email, senha_hash, input.id_curso, input.semestre]
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
      if (!colega.email.trim()) continue;

      const colegaExistente = await client.query<{ id_usuario: number }>(
        `SELECT id_usuario FROM usuario WHERE email = $1`,
        [colega.email.trim()]
      );

      let idColega: number;
      if (colegaExistente.rows[0]) {
        idColega = colegaExistente.rows[0].id_usuario;
      } else {
        const senhaProvisoria = await bcrypt.hash("trocar123", 10);
        const novoColegaR = await client.query<{ id_usuario: number }>(
          `INSERT INTO usuario (nome, telefone, email, senha_hash, perfil, id_curso)
           VALUES ($1, NULL, $2, $3, 'aluno', $4) RETURNING id_usuario`,
          [colega.nome?.trim() || colega.email.split("@")[0], colega.email.trim(), senhaProvisoria, colega.id_curso]
        );
        idColega = novoColegaR.rows[0].id_usuario;
      }

      // ON CONFLICT: se o colega já estiver nessa equipe por algum motivo, ignora silenciosamente
      await client.query(
        `INSERT INTO equipe_usuario (id_equipe, id_usuario, papel) VALUES ($1,$2,'integrante')
         ON CONFLICT (id_equipe, id_usuario) DO NOTHING`,
        [equipe.id_equipe, idColega]
      );
    }

    await client.query("COMMIT");
    return { usuario: lider, equipe };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
