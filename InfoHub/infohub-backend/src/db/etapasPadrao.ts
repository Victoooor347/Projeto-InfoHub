/**
 * As 6 etapas padrão da jornada InfoHub -> InovAMF, descritas na cartilha
 * do programa. Isso NÃO é mais uma tabela global no banco (ver
 * src/db/schema.sql, seção 7 das "Decisões de modelagem") — é só o molde
 * usado toda vez que uma equipe nova é criada, pra copiar essas 6 linhas
 * já com `id_equipe` preenchido. Depois disso, cada equipe é dona da sua
 * própria cópia e pode estendê-la (o mentor da equipe pode acrescentar
 * etapas extras, com `ordem` 7 em diante).
 */
export const ETAPAS_PADRAO: { nome: string; descricao: string }[] = [
  { nome: "Envio da ideia", descricao: "Aluno preenche o formulário inicial contando a ideia." },
  { nome: "Contato com a equipe", descricao: "Equipe InfoHub analisa a proposta e agenda o 1º encontro." },
  {
    nome: "Encontro 1 – Entendendo a ideia",
    descricao: "Mentor e aluno definem problema, público-alvo e solução inicial.",
  },
  { nome: "Encontro 2 – Proposta de valor", descricao: "Construção do Value Proposition Design." },
  { nome: "Encontro 3 – Modelo de negócio", descricao: "Construção do Business Model Canvas." },
  {
    nome: "Encontro 4 – Pitch e inscrição",
    descricao: "Revisão geral, gravação do Pitch Vídeo e conferência de documentos.",
  },
];
