import bcrypt from "bcryptjs";
import { DB_SCHEMA, pool } from "../config/db";
import { ETAPAS_PADRAO } from "./etapasPadrao";

/**
 * Cenário de demonstração do G1 — roda em TODO deploy (comando pós-deploy
 * `npm run db:setup` = migrate + seed) e deixa o banco sempre no mesmo estado:
 *
 *  - 3 equipes, cada uma com 3 integrantes, sendo 1 líder por equipe;
 *  - 1 administrador e 4 mentores:
 *      Diego  → mentora EcoRota e SaborLocal (2 equipes)
 *      Luiza  → mentora MenteAtiva (a terceira)
 *      Marcos e Patrícia → cadastrados, ainda sem equipe
 *  - EcoRota e SaborLocal: Etapa 1 APROVADA, cursando a Etapa 2;
 *  - MenteAtiva: tarefa com PRAZO ATRASADO.
 *
 * O seed APAGA os dados de demonstração antes de inserir de novo (só no
 * schema da dupla — nunca no public). Ou seja: o que for criado pelo
 * sistema durante os testes some no próximo deploy. Cursos e status de
 * tarefa não são apagados (vêm do schema.sql).
 */

async function hash(senha: string) {
  return bcrypt.hash(senha, 10);
}

/** Data (AAAA-MM-DD) deslocada N dias a partir de hoje. */
function diasAPartirDeHoje(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  if (!DB_SCHEMA || DB_SCHEMA === "public") {
    throw new Error(
      "Recusado: a DATABASE_URL não tem ?schema=<schema-da-dupla>. O seed limpa as tabelas antes de " +
        "inserir, e sem schema próprio isso atingiria o schema public, que é compartilhado."
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ---------- limpa o cenário anterior ----------
    // Nomes sem prefixo → resolvem só no schema da dupla (search_path, ver config/db.ts).
    await client.query(`
      TRUNCATE lembrete, anotacoes, entregavel, arquivo, tarefa, equipe_mentor, equipe_usuario, etapa, equipe, usuario
      RESTART IDENTITY CASCADE
    `);

    // ---------- dados de referência (criados pelo schema.sql) ----------
    const cursoIds: Record<string, number> = {};
    const cursosR = await client.query<{ id_curso: number; nome: string }>(`SELECT id_curso, nome FROM cursos`);
    for (const row of cursosR.rows) cursoIds[row.nome] = row.id_curso;
    if (cursosR.rowCount === 0) throw new Error("Tabela cursos vazia — rode `db:migrate` antes do seed.");

    const statusIds: Record<string, number> = {};
    const statusR = await client.query<{ id_status: number; descricao: string }>(
      `SELECT id_status, descricao FROM status_tarefa`
    );
    for (const row of statusR.rows) statusIds[row.descricao] = row.id_status;

    // ---------- usuários: 1 admin, 4 mentores, 9 alunos ----------
    type NovoUsuario = {
      key: string;
      nome: string;
      telefone: string | null;
      email: string;
      senha: string;
      perfil: "admin" | "mentor" | "aluno";
      curso: string | null;
      semestre: number | null;
    };
    const usuariosSeed: NovoUsuario[] = [
      // administrador
      { key: "renata", nome: "Renata Bock", telefone: "(55) 99911-2233", email: "renata.bock@infohub.amf.br", senha: "admin123", perfil: "admin", curso: null, semestre: null },
      // 4 mentores
      { key: "diego", nome: "Prof. Diego Casagrande", telefone: "(55) 99922-3344", email: "diego.casagrande@infohub.amf.br", senha: "mentor123", perfil: "mentor", curso: null, semestre: null },
      { key: "luiza", nome: "Profa. Luiza Andreatta", telefone: "(55) 99933-4455", email: "luiza.andreatta@infohub.amf.br", senha: "mentor123", perfil: "mentor", curso: null, semestre: null },
      { key: "marcos", nome: "Prof. Marcos Tonet", telefone: "(55) 99955-6677", email: "marcos.tonet@infohub.amf.br", senha: "mentor123", perfil: "mentor", curso: null, semestre: null },
      { key: "patricia", nome: "Profa. Patrícia Dalla Costa", telefone: "(55) 99966-7788", email: "patricia.dallacosta@infohub.amf.br", senha: "mentor123", perfil: "mentor", curso: null, semestre: null },
      // EcoRota
      { key: "bruno", nome: "Bruno Kellermann", telefone: "(55) 99944-1111", email: "bruno.kellermann@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Sistemas de Informação", semestre: 5 },
      { key: "camila", nome: "Camila Restelatto", telefone: "(55) 99944-2222", email: "camila.restelatto@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Sistemas de Informação", semestre: 5 },
      { key: "eduardo", nome: "Eduardo Piovesan", telefone: "(55) 99944-3333", email: "eduardo.piovesan@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Administração", semestre: 3 },
      // SaborLocal
      { key: "fernanda", nome: "Fernanda Locatelli", telefone: "(55) 99944-4444", email: "fernanda.locatelli@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Gastronomia", semestre: 2 },
      { key: "gustavo", nome: "Gustavo Herédia", telefone: "(55) 99944-5555", email: "gustavo.heredia@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Administração", semestre: 3 },
      { key: "larissa", nome: "Larissa Beux", telefone: "(55) 99944-1010", email: "larissa.beux@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Hotelaria", semestre: 3 },
      // MenteAtiva
      { key: "helena", nome: "Helena Zortéa", telefone: "(55) 99944-6666", email: "helena.zortea@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Direito", semestre: 6 },
      { key: "juliana", nome: "Juliana Fontanive", telefone: "(55) 99944-8888", email: "juliana.fontanive@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Pedagogia", semestre: 2 },
      { key: "igor", nome: "Igor Salbego", telefone: "(55) 99944-7777", email: "igor.salbego@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Sistemas de Informação", semestre: 4 },
    ];
    const usuarioIds: Record<string, number> = {};
    for (const u of usuariosSeed) {
      const r = await client.query<{ id_usuario: number }>(
        `INSERT INTO usuario (nome, telefone, email, senha_hash, perfil, id_curso, semestre)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_usuario`,
        [u.nome, u.telefone, u.email, await hash(u.senha), u.perfil, u.curso ? cursoIds[u.curso] : null, u.semestre]
      );
      usuarioIds[u.key] = r.rows[0].id_usuario;
    }

    // ---------- 3 equipes ----------
    // etapaIdx: 0 = Etapa 1 "Envio da ideia", 1 = Etapa 2 "Contato com a equipe", ...
    type NovaEquipe = {
      key: string;
      nome_equipe: string;
      nome_ideia: string;
      descricao_ideia: string;
      area_ideia: string;
      estagio_ideia: string;
      como_conheceu: string | null;
      etapaIdx: number;
    };
    const equipesSeed: NovaEquipe[] = [
      { key: "ecorota", nome_equipe: "EcoRota", nome_ideia: "EcoRota – logística reversa de resíduos recicláveis", descricao_ideia: "Aplicativo que conecta cooperativas de reciclagem a pequenos comércios para coleta programada de resíduos, otimizando rotas e reduzindo custo de logística.", area_ideia: "Meio Ambiente", estagio_ideia: "Validação", como_conheceu: "Eventos", etapaIdx: 1 },
      { key: "saborlocal", nome_equipe: "SaborLocal", nome_ideia: "SaborLocal – marketplace de produtores da Serra Gaúcha", descricao_ideia: "Plataforma que conecta pequenos produtores rurais diretamente a restaurantes e consumidores finais, com curadoria de produtos regionais.", area_ideia: "Serviços", estagio_ideia: "Prototipagem", como_conheceu: "Amigos", etapaIdx: 1 },
      { key: "menteativa", nome_equipe: "MenteAtiva", nome_ideia: "MenteAtiva – trilhas de bem-estar para universitários", descricao_ideia: "Plataforma com trilhas guiadas de bem-estar emocional e acesso facilitado a apoio psicológico dentro do campus.", area_ideia: "Saúde", estagio_ideia: "Apenas ideia", como_conheceu: "Redes sociais", etapaIdx: 0 },
    ];
    const equipeIds: Record<string, number> = {};
    const etapaIdsPorEquipe: Record<string, number[]> = {};
    for (const eq of equipesSeed) {
      // 1) equipe sem id_etapa_atual (quebra a referência circular com etapa)
      const r = await client.query<{ id_equipe: number }>(
        `INSERT INTO equipe (nome_equipe, nome_ideia, descricao_ideia, area_ideia, estagio_ideia, como_conheceu)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_equipe`,
        [eq.nome_equipe, eq.nome_ideia, eq.descricao_ideia, eq.area_ideia, eq.estagio_ideia, eq.como_conheceu]
      );
      const id_equipe = r.rows[0].id_equipe;
      equipeIds[eq.key] = id_equipe;

      // 2) cópia das 6 etapas padrão, já pertencendo a essa equipe
      const ids: number[] = [];
      for (let i = 0; i < ETAPAS_PADRAO.length; i++) {
        const { nome, descricao } = ETAPAS_PADRAO[i];
        const e = await client.query<{ id_etapa: number }>(
          `INSERT INTO etapa (id_equipe, ordem, nome, descricao, padrao) VALUES ($1,$2,$3,$4,TRUE) RETURNING id_etapa`,
          [id_equipe, i + 1, nome, descricao]
        );
        ids.push(e.rows[0].id_etapa);
      }
      etapaIdsPorEquipe[eq.key] = ids;

      // 3) aponta a etapa atual
      await client.query(`UPDATE equipe SET id_etapa_atual = $1 WHERE id_equipe = $2`, [ids[eq.etapaIdx], id_equipe]);
    }

    // ---------- integrantes: 3 por equipe, 1 líder ----------
    const membros: [string, string, "lider" | "integrante"][] = [
      ["ecorota", "bruno", "lider"],
      ["ecorota", "camila", "integrante"],
      ["ecorota", "eduardo", "integrante"],
      ["saborlocal", "fernanda", "lider"],
      ["saborlocal", "gustavo", "integrante"],
      ["saborlocal", "larissa", "integrante"],
      ["menteativa", "helena", "lider"],
      ["menteativa", "juliana", "integrante"],
      ["menteativa", "igor", "integrante"],
    ];
    for (const [equipeKey, usuarioKey, papel] of membros) {
      await client.query(`INSERT INTO equipe_usuario (id_equipe, id_usuario, papel) VALUES ($1,$2,$3)`, [
        equipeIds[equipeKey],
        usuarioIds[usuarioKey],
        papel,
      ]);
    }

    // ---------- mentoria: Diego → 2 equipes; Luiza → a terceira ----------
    const mentorias: [string, string][] = [
      ["ecorota", "diego"],
      ["saborlocal", "diego"],
      ["menteativa", "luiza"],
    ];
    for (const [equipeKey, usuarioKey] of mentorias) {
      await client.query(`INSERT INTO equipe_mentor (id_equipe, id_usuario) VALUES ($1,$2)`, [
        equipeIds[equipeKey],
        usuarioIds[usuarioKey],
      ]);
      // equipe.id_mentor (compatibilidade) = mentor principal
      await client.query(`UPDATE equipe SET id_mentor = $1 WHERE id_equipe = $2 AND id_mentor IS NULL`, [
        usuarioIds[usuarioKey],
        equipeIds[equipeKey],
      ]);
    }

    // ---------- tarefas ----------
    type NovaTarefa = {
      key: string;
      titulo: string;
      descricao: string;
      offsetDias: number;
      equipe: string;
      etapaIdx: number;
      status: string;
    };
    const tarefasSeed: NovaTarefa[] = [
      // EcoRota: Etapa 1 aprovada, cursando a Etapa 2
      { key: "eco1", titulo: "Cadastro completo da ideia", descricao: "Revisar e completar todos os campos do formulário inicial da ideia.", offsetDias: -6, equipe: "ecorota", etapaIdx: 0, status: "Aprovada" },
      { key: "eco2", titulo: "Confirmar disponibilidade para o 1º encontro", descricao: "Informar à equipe InfoHub os melhores dias e horários para o primeiro encontro.", offsetDias: 4, equipe: "ecorota", etapaIdx: 1, status: "Em andamento" },
      // SaborLocal: Etapa 1 aprovada, cursando a Etapa 2
      { key: "sab1", titulo: "Cadastro completo da ideia", descricao: "Revisar e completar todos os campos do formulário inicial da ideia.", offsetDias: -5, equipe: "saborlocal", etapaIdx: 0, status: "Aprovada" },
      { key: "sab2", titulo: "Confirmar disponibilidade para o 1º encontro", descricao: "Informar à equipe InfoHub os melhores dias e horários para o primeiro encontro.", offsetDias: 6, equipe: "saborlocal", etapaIdx: 1, status: "Pendente" },
      // MenteAtiva: tarefa com prazo ATRASADO (venceu há 3 dias, sem entrega)
      { key: "men1", titulo: "Cadastro completo da ideia", descricao: "Revisar e completar todos os campos do formulário inicial da ideia.", offsetDias: -3, equipe: "menteativa", etapaIdx: 0, status: "Atrasada" },
    ];
    const tarefaIds: Record<string, number> = {};
    for (const t of tarefasSeed) {
      const r = await client.query<{ id_tarefa: number }>(
        `INSERT INTO tarefa (titulo, descricao, data_limite, id_equipe, id_etapa, id_status)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_tarefa`,
        [t.titulo, t.descricao, diasAPartirDeHoje(t.offsetDias), equipeIds[t.equipe], etapaIdsPorEquipe[t.equipe][t.etapaIdx], statusIds[t.status]]
      );
      tarefaIds[t.key] = r.rows[0].id_tarefa;
    }

    // ---------- entregáveis (das tarefas aprovadas, enviados pelos líderes) ----------
    const entregaveis: [string, string, string, string][] = [
      ["eco1", "bruno", "https://drive.google.com/file/d/ecorota-cadastro-ideia", "link"],
      ["sab1", "fernanda", "https://drive.google.com/file/d/saborlocal-cadastro-ideia", "link"],
    ];
    for (const [tarefaKey, usuarioKey, url, tipo] of entregaveis) {
      await client.query(`INSERT INTO entregavel (arquivo_url, tipo, id_tarefa, id_usuario) VALUES ($1,$2,$3,$4)`, [
        url,
        tipo,
        tarefaIds[tarefaKey],
        usuarioIds[usuarioKey],
      ]);
    }

    // ---------- anotações dos mentores ----------
    const anotacoes: [string, string, string, number][] = [
      ["diego", "ecorota", "Etapa 1 aprovada: ideia bem descrita e público-alvo claro. Seguir para o agendamento do 1º encontro.", 0],
      ["diego", "saborlocal", "Etapa 1 aprovada. Sugestão: levantar quantos produtores já demonstraram interesse.", 0],
      ["luiza", "menteativa", "Cadastro da ideia ainda incompleto e com prazo vencido. Cobrar a equipe.", 0],
    ];
    for (const [usuarioKey, equipeKey, descricao, etapaIdx] of anotacoes) {
      await client.query(`INSERT INTO anotacoes (descricao, id_usuario, id_equipe, id_etapa) VALUES ($1,$2,$3,$4)`, [
        descricao,
        usuarioIds[usuarioKey],
        equipeIds[equipeKey],
        etapaIdsPorEquipe[equipeKey][etapaIdx],
      ]);
    }

    // ---------- lembretes ----------
    const lembretes: [string, number, boolean][] = [
      ["men1", -4, true], // avisado 1 dia antes do prazo, e mesmo assim atrasou
      ["eco2", 3, false],
      ["sab2", 5, false],
    ];
    for (const [tarefaKey, offset, enviado] of lembretes) {
      await client.query(`INSERT INTO lembrete (data_programada, enviado, id_tarefa) VALUES ($1,$2,$3)`, [
        diasAPartirDeHoje(offset),
        enviado,
        tarefaIds[tarefaKey],
      ]);
    }

    await client.query("COMMIT");

    console.log(`Seed concluído no schema "${DB_SCHEMA}".`);
    console.log("  3 equipes (3 integrantes cada, 1 líder) | 1 admin | 4 mentores");
    console.log("  EcoRota e SaborLocal: Etapa 1 aprovada, cursando a Etapa 2");
    console.log("  MenteAtiva: tarefa com prazo atrasado");
    console.log("\nContas de demonstração:");
    console.log("  admin  -> renata.bock@infohub.amf.br           / admin123");
    console.log("  mentor -> diego.casagrande@infohub.amf.br      / mentor123  (EcoRota + SaborLocal)");
    console.log("  mentor -> luiza.andreatta@infohub.amf.br       / mentor123  (MenteAtiva)");
    console.log("  líder  -> bruno.kellermann@aluno.amf.br        / aluno123   (EcoRota)");
    console.log("  líder  -> helena.zortea@aluno.amf.br           / aluno123   (MenteAtiva, com atraso)");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Falha no seed, rollback feito.");
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
