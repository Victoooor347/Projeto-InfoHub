import bcrypt from "bcryptjs";
import { pool } from "../config/db";
import { ETAPAS_PADRAO } from "./etapasPadrao";

async function hash(senha: string) {
  return bcrypt.hash(senha, 10);
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ---------- cursos ----------
    const cursosNomes = [
      "Sistemas de Informação",
      "Direito",
      "Administração",
      "Gastronomia",
      "Ciências Contábeis",
      "Ontopsicologia",
      "Hotelaria",
      "Pedagogia",
    ];
    const cursoIds: Record<string, number> = {};
    for (const nome of cursosNomes) {
      const r = await client.query<{ id_curso: number }>(
        `INSERT INTO cursos (nome) VALUES ($1) RETURNING id_curso`,
        [nome]
      );
      cursoIds[nome] = r.rows[0].id_curso;
    }

    // ---------- etapas ----------
    // Não são mais criadas de uma vez, globalmente: cada equipe ganha sua
    // própria cópia das 6 etapas padrão no momento em que é criada (ver
    // bloco "equipes" abaixo). etapaIdsPorEquipe[equipeKey][i] guarda o
    // id_etapa da i-ésima etapa padrão (0 = "Envio da ideia", ..., 5 =
    // "Encontro 4") dentro da jornada daquela equipe específica.
    const etapaIdsPorEquipe: Record<string, number[]> = {};

    async function criarEtapasPadraoDaEquipe(id_equipe: number): Promise<number[]> {
      const ids: number[] = [];
      for (let i = 0; i < ETAPAS_PADRAO.length; i++) {
        const { nome, descricao } = ETAPAS_PADRAO[i];
        const r = await client.query<{ id_etapa: number }>(
          `INSERT INTO etapa (id_equipe, ordem, nome, descricao, padrao) VALUES ($1,$2,$3,$4,TRUE) RETURNING id_etapa`,
          [id_equipe, i + 1, nome, descricao]
        );
        ids.push(r.rows[0].id_etapa);
      }
      return ids;
    }

    // ---------- status_tarefa (ordem importa: 1 Pendente ... 6 Reprovada/Ajustar) ----------
    const statusList = ["Pendente", "Em andamento", "Entregue", "Atrasada", "Aprovada", "Reprovada/Ajustar"];
    const statusIds: Record<string, number> = {};
    for (const descricao of statusList) {
      const r = await client.query<{ id_status: number }>(
        `INSERT INTO status_tarefa (descricao) VALUES ($1) RETURNING id_status`,
        [descricao]
      );
      statusIds[descricao] = r.rows[0].id_status;
    }

    // ---------- usuarios ----------
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
      { key: "renata", nome: "Renata Bock", telefone: "(55) 99911-2233", email: "renata.bock@infohub.amf.br", senha: "admin123", perfil: "admin", curso: null, semestre: null },
      { key: "diego", nome: "Prof. Diego Casagrande", telefone: "(55) 99922-3344", email: "diego.casagrande@infohub.amf.br", senha: "mentor123", perfil: "mentor", curso: null, semestre: null },
      { key: "luiza", nome: "Profa. Luiza Andreatta", telefone: "(55) 99933-4455", email: "luiza.andreatta@infohub.amf.br", senha: "mentor123", perfil: "mentor", curso: null, semestre: null },
      { key: "bruno", nome: "Bruno Kellermann", telefone: "(55) 99944-1111", email: "bruno.kellermann@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Sistemas de Informação", semestre: 5 },
      { key: "camila", nome: "Camila Restelatto", telefone: "(55) 99944-2222", email: "camila.restelatto@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Sistemas de Informação", semestre: 5 },
      { key: "eduardo", nome: "Eduardo Piovesan", telefone: "(55) 99944-3333", email: "eduardo.piovesan@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Administração", semestre: 3 },
      { key: "fernanda", nome: "Fernanda Locatelli", telefone: "(55) 99944-4444", email: "fernanda.locatelli@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Gastronomia", semestre: 2 },
      { key: "gustavo", nome: "Gustavo Herédia", telefone: "(55) 99944-5555", email: "gustavo.heredia@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Administração", semestre: 3 },
      { key: "helena", nome: "Helena Zortéa", telefone: "(55) 99944-6666", email: "helena.zortea@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Direito", semestre: 6 },
      { key: "igor", nome: "Igor Salbego", telefone: "(55) 99944-7777", email: "igor.salbego@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Sistemas de Informação", semestre: 4 },
      { key: "juliana", nome: "Juliana Fontanive", telefone: "(55) 99944-8888", email: "juliana.fontanive@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Pedagogia", semestre: 2 },
      { key: "kaue", nome: "Kauê Brustolin", telefone: "(55) 99944-9999", email: "kaue.brustolin@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Ciências Contábeis", semestre: 7 },
      { key: "larissa", nome: "Larissa Beux", telefone: "(55) 99944-1010", email: "larissa.beux@aluno.amf.br", senha: "aluno123", perfil: "aluno", curso: "Hotelaria", semestre: 3 },
    ];
    const usuarioIds: Record<string, number> = {};
    for (const u of usuariosSeed) {
      const senha_hash = await hash(u.senha);
      const id_curso = u.curso ? cursoIds[u.curso] : null;
      const r = await client.query<{ id_usuario: number }>(
        `INSERT INTO usuario (nome, telefone, email, senha_hash, perfil, id_curso, semestre)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_usuario`,
        [u.nome, u.telefone, u.email, senha_hash, u.perfil, id_curso, u.semestre]
      );
      usuarioIds[u.key] = r.rows[0].id_usuario;
    }

    // ---------- equipes ----------
    type NovaEquipe = {
      key: string;
      nome_equipe: string;
      nome_ideia: string;
      descricao_ideia: string;
      area_ideia: string;
      estagio_ideia: string;
      como_conheceu: string | null;
      link_pitch: string | null;
      etapaIdx: number; // 0-based -> etapaIds[etapaIdx]
      pronto: boolean;
    };
    const equipesSeed: NovaEquipe[] = [
      { key: "ecorota", nome_equipe: "EcoRota", nome_ideia: "EcoRota – logística reversa de resíduos recicláveis", descricao_ideia: "Aplicativo que conecta cooperativas de reciclagem a pequenos comércios para coleta programada de resíduos, otimizando rotas e reduzindo custo de logística.", area_ideia: "Meio Ambiente", estagio_ideia: "Validação", como_conheceu: "Eventos", link_pitch: null, etapaIdx: 4, pronto: false },
      { key: "saborlocal", nome_equipe: "SaborLocal", nome_ideia: "SaborLocal – marketplace de produtores da Serra Gaúcha", descricao_ideia: "Plataforma que conecta pequenos produtores rurais diretamente a restaurantes e consumidores finais, com curadoria de produtos regionais.", area_ideia: "Serviços", estagio_ideia: "Prototipagem", como_conheceu: "Amigos", link_pitch: null, etapaIdx: 5, pronto: false },
      { key: "menteativa", nome_equipe: "MenteAtiva", nome_ideia: "MenteAtiva – trilhas de saúde mental para universitários", descricao_ideia: "Plataforma com trilhas guiadas de bem-estar emocional e acesso facilitado a apoio psicológico dentro do campus.", area_ideia: "Saúde", estagio_ideia: "Apenas ideia", como_conheceu: "Redes sociais", link_pitch: null, etapaIdx: 2, pronto: false },
      { key: "estudaja", nome_equipe: "EstudaJá", nome_ideia: "EstudaJá – monitoria entre pares por assinatura", descricao_ideia: "Marketplace de monitorias acadêmicas entre alunos veteranos e calouros, com sistema de reputação e agenda integrada.", area_ideia: "Educação", estagio_ideia: "Validação", como_conheceu: "Outros", link_pitch: null, etapaIdx: 1, pronto: false },
      { key: "hospedafacil", nome_equipe: "HospedaFácil", nome_ideia: "HospedaFácil – gestão simplificada para pousadas familiares", descricao_ideia: "Sistema leve de gestão de reservas e check-in para pousadas de pequeno porte da região, sem as taxas de grandes plataformas.", area_ideia: "Tecnologia", estagio_ideia: "Lançamento", como_conheceu: "Eventos", link_pitch: "https://youtube.com/watch?v=hospedafacil-pitch", etapaIdx: 5, pronto: true },
      { key: "petcare", nome_equipe: "PetCare RS", nome_ideia: "PetCare RS – rede de cuidadores de pets sob demanda", descricao_ideia: "App que conecta tutores de pets a cuidadores avaliados na vizinhança, para passeios, hospedagem e visitas rápidas.", area_ideia: "Serviços", estagio_ideia: "Prototipagem", como_conheceu: "Redes sociais", link_pitch: null, etapaIdx: 3, pronto: false },
      { key: "contabilize", nome_equipe: "Contabilize", nome_ideia: "Contabilize – automação fiscal para microempreendedores", descricao_ideia: "Ferramenta que automatiza emissão de notas e apuração de impostos para MEIs da região, com alertas de vencimento.", area_ideia: "Tecnologia", estagio_ideia: "Validação", como_conheceu: "Amigos", link_pitch: null, etapaIdx: 0, pronto: false },
    ];
    const equipeIds: Record<string, number> = {};
    for (const eq of equipesSeed) {
      // 1) cria a equipe sem id_etapa_atual ainda (quebra a referência circular com etapa)
      const r = await client.query<{ id_equipe: number }>(
        `INSERT INTO equipe (nome_equipe, nome_ideia, descricao_ideia, area_ideia, estagio_ideia, como_conheceu, link_pitch, pronto_para_inovamf)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_equipe`,
        [
          eq.nome_equipe,
          eq.nome_ideia,
          eq.descricao_ideia,
          eq.area_ideia,
          eq.estagio_ideia,
          eq.como_conheceu,
          eq.link_pitch,
          eq.pronto,
        ]
      );
      const id_equipe = r.rows[0].id_equipe;
      equipeIds[eq.key] = id_equipe;

      // 2) cria a cópia das 6 etapas padrão já pertencendo a essa equipe
      const idsEtapasDestaEquipe = await criarEtapasPadraoDaEquipe(id_equipe);
      etapaIdsPorEquipe[eq.key] = idsEtapasDestaEquipe;

      // 3) só agora dá pra apontar id_etapa_atual pra etapa certa (dentro da jornada dela)
      await client.query(`UPDATE equipe SET id_etapa_atual = $1 WHERE id_equipe = $2`, [
        idsEtapasDestaEquipe[eq.etapaIdx],
        id_equipe,
      ]);
    }

    // ---------- equipe_usuario ----------
    const membros: [string, string, "lider" | "integrante"][] = [
      ["ecorota", "bruno", "lider"],
      ["ecorota", "camila", "integrante"],
      ["saborlocal", "fernanda", "lider"],
      ["menteativa", "helena", "lider"],
      ["menteativa", "juliana", "integrante"],
      ["estudaja", "igor", "lider"],
      ["estudaja", "kaue", "integrante"],
      ["hospedafacil", "larissa", "lider"],
      ["petcare", "eduardo", "lider"],
      ["petcare", "gustavo", "integrante"],
      ["contabilize", "kaue", "lider"],
    ];
    for (const [equipeKey, usuarioKey, papel] of membros) {
      await client.query(
        `INSERT INTO equipe_usuario (id_equipe, id_usuario, papel) VALUES ($1,$2,$3)`,
        [equipeIds[equipeKey], usuarioIds[usuarioKey], papel]
      );
    }

    // ---------- equipe_mentor ----------
    const mentores: [string, string][] = [
      ["ecorota", "diego"],
      ["ecorota", "luiza"],
      ["saborlocal", "luiza"],
      ["menteativa", "diego"],
      ["hospedafacil", "luiza"],
      ["petcare", "diego"],
    ];
    for (const [equipeKey, usuarioKey] of mentores) {
      await client.query(`INSERT INTO equipe_mentor (id_equipe, id_usuario) VALUES ($1,$2)`, [
        equipeIds[equipeKey],
        usuarioIds[usuarioKey],
      ]);
    }
    // mantém equipe.id_mentor (compatibilidade) apontando pro primeiro mentor de cada equipe
    for (const [equipeKey, usuarioKey] of mentores) {
      await client.query(
        `UPDATE equipe SET id_mentor = $1 WHERE id_equipe = $2 AND id_mentor IS NULL`,
        [usuarioIds[usuarioKey], equipeIds[equipeKey]]
      );
    }

    // ---------- tarefas ----------
    function daysFromToday(offset: number): string {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return d.toISOString().slice(0, 10);
    }
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
      { key: "t1", titulo: "Enviar Business Model Canvas", descricao: "Preencher e enviar o Canvas em PDF conforme modelo apresentado no Encontro 3.", offsetDias: -2, equipe: "ecorota", etapaIdx: 4, status: "Atrasada" },
      { key: "t2", titulo: "Ajustar Value Proposition Design", descricao: "Revisar o VPD incluindo dores e ganhos validados na última mentoria.", offsetDias: 3, equipe: "ecorota", etapaIdx: 3, status: "Em andamento" },
      { key: "t3", titulo: "Gravar Pitch Vídeo", descricao: "Gravar pitch de até 3 minutos e enviar o link do YouTube (não listado).", offsetDias: 5, equipe: "saborlocal", etapaIdx: 5, status: "Entregue" },
      { key: "t4", titulo: "Conferência de documentos finais", descricao: "Confirmar dados de todos os integrantes da equipe para inscrição no InovAMF.", offsetDias: 1, equipe: "saborlocal", etapaIdx: 5, status: "Em andamento" },
      { key: "t5", titulo: "Definir problema, público-alvo e solução", descricao: "Preencher o quadro de definição de problema apresentado no Encontro 1.", offsetDias: -1, equipe: "menteativa", etapaIdx: 2, status: "Atrasada" },
      { key: "t6", titulo: "Agendar 1º encontro", descricao: "Aguardando confirmação de disponibilidade da equipe para o primeiro encontro.", offsetDias: 4, equipe: "estudaja", etapaIdx: 1, status: "Pendente" },
      { key: "t7", titulo: "Enviar Value Proposition Design", descricao: "Construir o VPD com base no mapa de valor discutido em mentoria.", offsetDias: 6, equipe: "petcare", etapaIdx: 3, status: "Pendente" },
      { key: "t8", titulo: "Revisão geral pré-inscrição", descricao: "Checklist final antes do encaminhamento ao InovAMF.", offsetDias: -5, equipe: "hospedafacil", etapaIdx: 5, status: "Aprovada" },
      { key: "t9", titulo: "Enviar Business Model Canvas", descricao: "Preencher e enviar o Canvas em PDF conforme modelo apresentado no Encontro 3.", offsetDias: -8, equipe: "hospedafacil", etapaIdx: 4, status: "Aprovada" },
      { key: "t10", titulo: "Cadastro completo da ideia", descricao: "Confirmar preenchimento de todos os campos obrigatórios do formulário inicial.", offsetDias: 2, equipe: "contabilize", etapaIdx: 0, status: "Em andamento" },
    ];
    const tarefaIds: Record<string, number> = {};
    for (const t of tarefasSeed) {
      const r = await client.query<{ id_tarefa: number }>(
        `INSERT INTO tarefa (titulo, descricao, data_limite, id_equipe, id_etapa, id_status)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id_tarefa`,
        [
          t.titulo,
          t.descricao,
          daysFromToday(t.offsetDias),
          equipeIds[t.equipe],
          etapaIdsPorEquipe[t.equipe][t.etapaIdx],
          statusIds[t.status],
        ]
      );
      tarefaIds[t.key] = r.rows[0].id_tarefa;
    }

    // ---------- entregaveis ----------
    const entregaveis: [string, string, string, string][] = [
      ["t3", "fernanda", "/mock-files/saborlocal-pitch.txt", "link"],
      ["t9", "larissa", "/mock-files/hospedafacil-canvas.pdf", "pdf"],
      ["t8", "larissa", "/mock-files/hospedafacil-checklist.pdf", "pdf"],
    ];
    for (const [tarefaKey, usuarioKey, url, tipo] of entregaveis) {
      await client.query(
        `INSERT INTO entregavel (arquivo_url, tipo, id_tarefa, id_usuario) VALUES ($1,$2,$3,$4)`,
        [url, tipo, tarefaIds[tarefaKey], usuarioIds[usuarioKey]]
      );
    }

    // ---------- anotacoes ----------
    const anotacoes: [string, string, string, number][] = [
      ["diego", "ecorota", "Equipe engajada, mas precisa amadurecer a proposta de valor para pequenos comércios antes do próximo encontro.", 3],
      ["luiza", "saborlocal", "Pitch gravado ficou muito bom, apenas ajustar áudio nos primeiros 10 segundos.", 5],
      ["diego", "menteativa", "Ainda em fase de ideação, sugerido aprofundar entrevistas com público universitário.", 2],
    ];
    for (const [usuarioKey, equipeKey, descricao, etapaIdx] of anotacoes) {
      await client.query(
        `INSERT INTO anotacoes (descricao, id_usuario, id_equipe, id_etapa) VALUES ($1,$2,$3,$4)`,
        [descricao, usuarioIds[usuarioKey], equipeIds[equipeKey], etapaIdsPorEquipe[equipeKey][etapaIdx]]
      );
    }

    // ---------- lembretes ----------
    const lembretes: [string, number, boolean][] = [
      ["t1", -2, true],
      ["t2", 2, false],
      ["t4", 0, true],
      ["t5", -1, true],
      ["t6", 4, false],
      ["t10", 1, false],
    ];
    for (const [tarefaKey, offset, enviado] of lembretes) {
      await client.query(
        `INSERT INTO lembrete (data_programada, enviado, id_tarefa) VALUES ($1,$2,$3)`,
        [daysFromToday(offset), enviado, tarefaIds[tarefaKey]]
      );
    }

    await client.query("COMMIT");
    console.log("Seed concluído com sucesso.");
    console.log("\nContas de demonstração (mesma senha usada no frontend mock):");
    console.log("  admin  -> renata.bock@infohub.amf.br      / admin123");
    console.log("  mentor -> diego.casagrande@infohub.amf.br / mentor123");
    console.log("  aluno  -> bruno.kellermann@aluno.amf.br   / aluno123  (líder)");
    console.log("  aluno  -> camila.restelatto@aluno.amf.br  / aluno123  (integrante)");
  } catch (err) {
    await client.query("ROLLBACK");
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
