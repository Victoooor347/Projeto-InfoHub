import type {
  Curso,
  Usuario,
  Etapa,
  Equipe,
  EquipeUsuario,
  StatusTarefa,
  Tarefa,
  Entregavel,
  Anotacao,
  Lembrete,
  EquipeMentor,
} from "../types";

export const cursos: Curso[] = [
  { id_curso: 1, nome: "Sistemas de Informação" },
  { id_curso: 2, nome: "Direito" },
  { id_curso: 3, nome: "Administração" },
  { id_curso: 4, nome: "Gastronomia" },
  { id_curso: 5, nome: "Ciências Contábeis" },
  { id_curso: 6, nome: "Ontopsicologia" },
  { id_curso: 7, nome: "Hotelaria" },
  { id_curso: 8, nome: "Pedagogia" },
];

export const etapas: Etapa[] = [
  {
    id_etapa: 1,
    nome: "Envio da ideia",
    descricao: "Aluno preenche o formulário inicial contando a ideia.",
  },
  {
    id_etapa: 2,
    nome: "Contato com a equipe",
    descricao: "Equipe InfoHub analisa a proposta e agenda o 1º encontro.",
  },
  {
    id_etapa: 3,
    nome: "Encontro 1 – Entendendo a ideia",
    descricao: "Mentor e aluno definem problema, público-alvo e solução inicial.",
  },
  {
    id_etapa: 4,
    nome: "Encontro 2 – Proposta de valor",
    descricao: "Construção do Value Proposition Design.",
  },
  {
    id_etapa: 5,
    nome: "Encontro 3 – Modelo de negócio",
    descricao: "Construção do Business Model Canvas.",
  },
  {
    id_etapa: 6,
    nome: "Encontro 4 – Pitch e inscrição",
    descricao: "Revisão geral, gravação do Pitch Vídeo e conferência de documentos.",
  },
];

export const statusTarefa: StatusTarefa[] = [
  { id_status: 1, descricao: "Pendente" },
  { id_status: 2, descricao: "Em andamento" },
  { id_status: 3, descricao: "Entregue" },
  { id_status: 4, descricao: "Atrasada" },
  { id_status: 5, descricao: "Aprovada" },
  { id_status: 6, descricao: "Reprovada/Ajustar" },
];

export const usuarios: Usuario[] = [
  // Admins / coordenação
  {
    id_usuario: 1,
    nome: "Renata Bock",
    telefone: "(55) 99911-2233",
    email: "renata.bock@infohub.amf.br",
    senha: "admin123",
    perfil: "admin",
    id_curso: null,
    semestre: null,
  },
  // Mentores
  {
    id_usuario: 2,
    nome: "Prof. Diego Casagrande",
    telefone: "(55) 99922-3344",
    email: "diego.casagrande@infohub.amf.br",
    senha: "mentor123",
    perfil: "mentor",
    id_curso: null,
    semestre: null,
  },
  {
    id_usuario: 3,
    nome: "Profa. Luiza Andreatta",
    telefone: "(55) 99933-4455",
    email: "luiza.andreatta@infohub.amf.br",
    senha: "mentor123",
    perfil: "mentor",
    id_curso: null,
    semestre: null,
  },
  // Alunos
  {
    id_usuario: 4,
    nome: "Bruno Kellermann",
    telefone: "(55) 99944-1111",
    email: "bruno.kellermann@aluno.amf.br",
    senha: "aluno123",
    perfil: "aluno",
    id_curso: 1,
    semestre: 5,
  },
  {
    id_usuario: 5,
    nome: "Camila Restelatto",
    telefone: "(55) 99944-2222",
    email: "camila.restelatto@aluno.amf.br",
    senha: "aluno123",
    perfil: "aluno",
    id_curso: 1,
    semestre: 5,
  },
  {
    id_usuario: 6,
    nome: "Eduardo Piovesan",
    telefone: "(55) 99944-3333",
    email: "eduardo.piovesan@aluno.amf.br",
    senha: "aluno123",
    perfil: "aluno",
    id_curso: 3,
    semestre: 3,
  },
  {
    id_usuario: 7,
    nome: "Fernanda Locatelli",
    telefone: "(55) 99944-4444",
    email: "fernanda.locatelli@aluno.amf.br",
    senha: "aluno123",
    perfil: "aluno",
    id_curso: 4,
    semestre: 2,
  },
  {
    id_usuario: 8,
    nome: "Gustavo Herédia",
    telefone: "(55) 99944-5555",
    email: "gustavo.heredia@aluno.amf.br",
    senha: "aluno123",
    perfil: "aluno",
    id_curso: 3,
    semestre: 3,
  },
  {
    id_usuario: 9,
    nome: "Helena Zortéa",
    telefone: "(55) 99944-6666",
    email: "helena.zortea@aluno.amf.br",
    senha: "aluno123",
    perfil: "aluno",
    id_curso: 2,
    semestre: 6,
  },
  {
    id_usuario: 10,
    nome: "Igor Salbego",
    telefone: "(55) 99944-7777",
    email: "igor.salbego@aluno.amf.br",
    senha: "aluno123",
    perfil: "aluno",
    id_curso: 1,
    semestre: 4,
  },
  {
    id_usuario: 11,
    nome: "Juliana Fontanive",
    telefone: "(55) 99944-8888",
    email: "juliana.fontanive@aluno.amf.br",
    senha: "aluno123",
    perfil: "aluno",
    id_curso: 8,
    semestre: 2,
  },
  {
    id_usuario: 12,
    nome: "Kauê Brustolin",
    telefone: "(55) 99944-9999",
    email: "kaue.brustolin@aluno.amf.br",
    senha: "aluno123",
    perfil: "aluno",
    id_curso: 5,
    semestre: 7,
  },
  {
    id_usuario: 13,
    nome: "Larissa Beux",
    telefone: "(55) 99944-1010",
    email: "larissa.beux@aluno.amf.br",
    senha: "aluno123",
    perfil: "aluno",
    id_curso: 7,
    semestre: 3,
  },
];

export const equipes: Equipe[] = [
  {
    id_equipe: 1,
    nome_equipe: "EcoRota",
    nome_ideia: "EcoRota – logística reversa de resíduos recicláveis",
    descricao_ideia:
      "Aplicativo que conecta cooperativas de reciclagem a pequenos comércios para coleta programada de resíduos, otimizando rotas e reduzindo custo de logística.",
    area_ideia: "Meio Ambiente",
    estagio_ideia: "Validação",
    como_conheceu: "Eventos",
    link_pitch: null,
    id_mentor: 2,
    id_etapa_atual: 5,
  },
  {
    id_equipe: 2,
    nome_equipe: "SaborLocal",
    nome_ideia: "SaborLocal – marketplace de produtores da Serra Gaúcha",
    descricao_ideia:
      "Plataforma que conecta pequenos produtores rurais diretamente a restaurantes e consumidores finais, com curadoria de produtos regionais.",
    area_ideia: "Serviços",
    estagio_ideia: "Prototipagem",
    como_conheceu: "Amigos",
    link_pitch: null,
    id_mentor: 3,
    id_etapa_atual: 6,
  },
  {
    id_equipe: 3,
    nome_equipe: "MenteAtiva",
    nome_ideia: "MenteAtiva – trilhas de saúde mental para universitários",
    descricao_ideia:
      "Plataforma com trilhas guiadas de bem-estar emocional e acesso facilitado a apoio psicológico dentro do campus.",
    area_ideia: "Saúde",
    estagio_ideia: "Apenas ideia",
    como_conheceu: "Redes sociais",
    link_pitch: null,
    id_mentor: 2,
    id_etapa_atual: 3,
  },
  {
    id_equipe: 4,
    nome_equipe: "EstudaJá",
    nome_ideia: "EstudaJá – monitoria entre pares por assinatura",
    descricao_ideia:
      "Marketplace de monitorias acadêmicas entre alunos veteranos e calouros, com sistema de reputação e agenda integrada.",
    area_ideia: "Educação",
    estagio_ideia: "Validação",
    como_conheceu: "Outros",
    link_pitch: null,
    id_mentor: null,
    id_etapa_atual: 2,
  },
  {
    id_equipe: 5,
    nome_equipe: "HospedaFácil",
    nome_ideia: "HospedaFácil – gestão simplificada para pousadas familiares",
    descricao_ideia:
      "Sistema leve de gestão de reservas e check-in para pousadas de pequeno porte da região, sem as taxas de grandes plataformas.",
    area_ideia: "Tecnologia",
    estagio_ideia: "Lançamento",
    como_conheceu: "Eventos",
    link_pitch: "https://youtube.com/watch?v=hospedafacil-pitch",
    id_mentor: 3,
    id_etapa_atual: 6,
    pronto_para_inovamf: true,
  },
  {
    id_equipe: 6,
    nome_equipe: "PetCare RS",
    nome_ideia: "PetCare RS – rede de cuidadores de pets sob demanda",
    descricao_ideia:
      "App que conecta tutores de pets a cuidadores avaliados na vizinhança, para passeios, hospedagem e visitas rápidas.",
    area_ideia: "Serviços",
    estagio_ideia: "Prototipagem",
    como_conheceu: "Redes sociais",
    link_pitch: null,
    id_mentor: 2,
    id_etapa_atual: 4,
  },
  {
    id_equipe: 7,
    nome_equipe: "Contabilize",
    nome_ideia: "Contabilize – automação fiscal para microempreendedores",
    descricao_ideia:
      "Ferramenta que automatiza emissão de notas e apuração de impostos para MEIs da região, com alertas de vencimento.",
    area_ideia: "Tecnologia",
    estagio_ideia: "Validação",
    como_conheceu: "Amigos",
    link_pitch: null,
    id_mentor: null,
    id_etapa_atual: 1,
  },
];

export const equipeUsuarios: EquipeUsuario[] = [
  { id_equipe_usuario: 1, id_equipe: 1, id_usuario: 4, papel: "lider" },
  { id_equipe_usuario: 2, id_equipe: 1, id_usuario: 5, papel: "integrante" },
  { id_equipe_usuario: 3, id_equipe: 2, id_usuario: 7, papel: "lider" },
  { id_equipe_usuario: 4, id_equipe: 3, id_usuario: 9, papel: "lider" },
  { id_equipe_usuario: 5, id_equipe: 3, id_usuario: 11, papel: "integrante" },
  { id_equipe_usuario: 6, id_equipe: 4, id_usuario: 10, papel: "lider" },
  { id_equipe_usuario: 7, id_equipe: 4, id_usuario: 12, papel: "integrante" },
  { id_equipe_usuario: 8, id_equipe: 5, id_usuario: 13, papel: "lider" },
  { id_equipe_usuario: 9, id_equipe: 6, id_usuario: 6, papel: "lider" },
  { id_equipe_usuario: 10, id_equipe: 6, id_usuario: 8, papel: "integrante" },
  { id_equipe_usuario: 11, id_equipe: 7, id_usuario: 12, papel: "lider" },
];

const today = new Date();
function daysFromToday(offset: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
function daysFromTodayDateTime(offset: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

export const tarefas: Tarefa[] = [
  {
    id_tarefa: 1,
    titulo: "Enviar Business Model Canvas",
    descricao: "Preencher e enviar o Canvas em PDF conforme modelo apresentado no Encontro 3.",
    data_limite: daysFromToday(-2),
    id_equipe: 1,
    id_etapa: 5,
    id_status: 4,
  },
  {
    id_tarefa: 2,
    titulo: "Ajustar Value Proposition Design",
    descricao: "Revisar o VPD incluindo dores e ganhos validados na última mentoria.",
    data_limite: daysFromToday(3),
    id_equipe: 1,
    id_etapa: 4,
    id_status: 2,
  },
  {
    id_tarefa: 3,
    titulo: "Gravar Pitch Vídeo",
    descricao: "Gravar pitch de até 3 minutos e enviar o link do YouTube (não listado).",
    data_limite: daysFromToday(5),
    id_equipe: 2,
    id_etapa: 6,
    id_status: 3,
  },
  {
    id_tarefa: 4,
    titulo: "Conferência de documentos finais",
    descricao: "Confirmar dados de todos os integrantes da equipe para inscrição no InovAMF.",
    data_limite: daysFromToday(1),
    id_equipe: 2,
    id_etapa: 6,
    id_status: 2,
  },
  {
    id_tarefa: 5,
    titulo: "Definir problema, público-alvo e solução",
    descricao: "Preencher o quadro de definição de problema apresentado no Encontro 1.",
    data_limite: daysFromToday(-1),
    id_equipe: 3,
    id_etapa: 3,
    id_status: 4,
  },
  {
    id_tarefa: 6,
    titulo: "Agendar 1º encontro",
    descricao: "Aguardando confirmação de disponibilidade da equipe para o primeiro encontro.",
    data_limite: daysFromToday(4),
    id_equipe: 4,
    id_etapa: 2,
    id_status: 1,
  },
  {
    id_tarefa: 7,
    titulo: "Enviar Value Proposition Design",
    descricao: "Construir o VPD com base no mapa de valor discutido em mentoria.",
    data_limite: daysFromToday(6),
    id_equipe: 6,
    id_etapa: 4,
    id_status: 1,
  },
  {
    id_tarefa: 8,
    titulo: "Revisão geral pré-inscrição",
    descricao: "Checklist final antes do encaminhamento ao InovAMF.",
    data_limite: daysFromToday(-5),
    id_equipe: 5,
    id_etapa: 6,
    id_status: 5,
  },
  {
    id_tarefa: 9,
    titulo: "Enviar Business Model Canvas",
    descricao: "Preencher e enviar o Canvas em PDF conforme modelo apresentado no Encontro 3.",
    data_limite: daysFromToday(-8),
    id_equipe: 5,
    id_etapa: 5,
    id_status: 5,
  },
  {
    id_tarefa: 10,
    titulo: "Cadastro completo da ideia",
    descricao: "Confirmar preenchimento de todos os campos obrigatórios do formulário inicial.",
    data_limite: daysFromToday(2),
    id_equipe: 7,
    id_etapa: 1,
    id_status: 2,
  },
];

export const entregaveis: Entregavel[] = [
  {
    id_entregavel: 1,
    arquivo_url: "/mock-files/saborlocal-pitch.txt",
    tipo: "link",
    data_envio: daysFromTodayDateTime(-1),
    id_tarefa: 3,
    id_usuario: 7,
  },
  {
    id_entregavel: 2,
    arquivo_url: "/mock-files/hospedafacil-canvas.pdf",
    tipo: "pdf",
    data_envio: daysFromTodayDateTime(-9),
    id_tarefa: 9,
    id_usuario: 13,
  },
  {
    id_entregavel: 3,
    arquivo_url: "/mock-files/hospedafacil-checklist.pdf",
    tipo: "pdf",
    data_envio: daysFromTodayDateTime(-6),
    id_tarefa: 8,
    id_usuario: 13,
  },
];

export const anotacoes: Anotacao[] = [
  {
    id_anotacao: 1,
    descricao:
      "Equipe engajada, mas precisa amadurecer a proposta de valor para pequenos comércios antes do próximo encontro.",
    data_registro: daysFromTodayDateTime(-3),
    id_usuario: 2,
    id_equipe: 1,
    id_etapa: 4,
  },
  {
    id_anotacao: 2,
    descricao: "Pitch gravado ficou muito bom, apenas ajustar áudio nos primeiros 10 segundos.",
    data_registro: daysFromTodayDateTime(-1),
    id_usuario: 3,
    id_equipe: 2,
    id_etapa: 6,
  },
  {
    id_anotacao: 3,
    descricao: "Ainda em fase de ideação, sugerido aprofundar entrevistas com público universitário.",
    data_registro: daysFromTodayDateTime(-4),
    id_usuario: 2,
    id_equipe: 3,
    id_etapa: 3,
  },
];

export const lembretes: Lembrete[] = [
  { id_lembrete: 1, data_programada: daysFromToday(-2), enviado: true, id_tarefa: 1 },
  { id_lembrete: 2, data_programada: daysFromToday(2), enviado: false, id_tarefa: 2 },
  { id_lembrete: 3, data_programada: daysFromToday(0), enviado: true, id_tarefa: 4 },
  { id_lembrete: 4, data_programada: daysFromToday(-1), enviado: true, id_tarefa: 5 },
  { id_lembrete: 5, data_programada: daysFromToday(4), enviado: false, id_tarefa: 6 },
  { id_lembrete: 6, data_programada: daysFromToday(1), enviado: false, id_tarefa: 10 },
];

// Uma equipe pode ter mais de um mentor (esclarecido com o cliente).
// A equipe EcoRota, por exemplo, tem acompanhamento duplo do Prof. Diego e da Profa. Luiza.
export const equipeMentores: EquipeMentor[] = [
  { id_equipe: 1, id_usuario: 2 },
  { id_equipe: 1, id_usuario: 3 },
  { id_equipe: 2, id_usuario: 3 },
  { id_equipe: 3, id_usuario: 2 },
  { id_equipe: 5, id_usuario: 3 },
  { id_equipe: 6, id_usuario: 2 },
];
