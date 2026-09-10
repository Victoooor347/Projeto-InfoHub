# InfoHub → InovAMF — Frontend

Frontend do **Sistema de Acompanhamento da Jornada do Empreendedor**, feito com **React + TypeScript + Vite + Tailwind CSS v4**, com dados **mockados** (nenhum backend real é necessário para rodar).

Os dados mock foram criados a partir das tabelas do `banco.sql` enviado (cursos, usuario, etapa, equipe, equipe_usuario, status_tarefa, tarefa, entregavel, anotacoes, lembrete), então a estrutura de tipos do frontend (`src/types/index.ts`) já reflete o schema do banco — quando o backend real existir, basta trocar o `DataContext` por chamadas de API mantendo os mesmos tipos.

## Como rodar o projeto

Pré-requisitos: **Node.js 18+** (recomendado 20+) e **npm**.

```bash
# 1. instalar dependências
npm install

# 2. rodar em modo desenvolvimento
npm run dev
```

Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`).

Outros comandos úteis:

```bash
npm run build      # gera a versão de produção em /dist
npm run preview    # serve a versão de produção localmente
```

## Login (dados mockados)

Na tela de login existe um bloco **"Acesso rápido de demonstração"** com botões prontos. Se preferir digitar manualmente, use:

| Perfil | E-mail | Senha |
|---|---|---|
| Administradora | `renata.bock@infohub.amf.br` | `admin123` |
| Mentor | `diego.casagrande@infohub.amf.br` | `mentor123` |
| Aluno (líder de equipe) | `bruno.kellermann@aluno.amf.br` | `aluno123` |
| Aluna (integrante, sem permissão de envio) | `camila.restelatto@aluno.amf.br` | `aluno123` |

Você também pode clicar em **"Inscrever minha equipe"** na tela de login para simular o fluxo de um aluno novo preenchendo o formulário inicial (isso cria a conta e a equipe automaticamente, como pede o requisito RF-02).

Todas as outras contas de alunos/mentores estão em `src/data/mockData.ts`, todas com a senha `aluno123` (alunos) ou `mentor123` (mentores).

## Estrutura do projeto

```
src/
  types/           tipos TypeScript espelhando o banco.sql
  data/mockData.ts dados mock (seed) de todas as tabelas
  store/           "backend" em memória (DataContext) + autenticação (AuthContext)
  utils/           funções auxiliares (formatação de datas, status, joins entre tabelas)
  components/      componentes reutilizáveis (StageRail, StatusBadge, Kit de UI, etc.)
  layouts/         casca de navegação do admin e do aluno
  pages/
    LoginPage.tsx
    InscricaoPage.tsx        formulário inicial (Etapa 1 / RF-02 a RF-05)
    admin/
      AdminDashboardPage.tsx     visão geral e KPIs (RF-22)
      AdminEquipesPage.tsx       funil/kanban com busca e filtros (RF-06, RF-07)
      AdminEquipeDetalhePage.tsx detalhe da equipe: tarefas, entregáveis, anotações (RF-08 a RF-20)
      AdminTarefasPage.tsx       lista de tarefas com filtros
      AdminRelatoriosPage.tsx    relatório consolidado + exportação CSV (RF-23, RF-24)
    aluno/
      AlunoDashboardPage.tsx     "minha jornada" com o funil visual
      AlunoTarefasPage.tsx       lista de tarefas do aluno (RF-13)
      AlunoTarefaDetalhePage.tsx envio de entregável + histórico de versões (RF-14, RF-16)
```

## O que já está funcionando (só frontend, sem backend)

- Login mockado por perfil (`admin`, `mentor`, `aluno`), com proteção de rotas por perfil.
- Formulário de inscrição inicial, criando conta + equipe automaticamente.
- Painel do administrador: funil kanban das 6 etapas, busca/filtros, avançar/retroceder etapa de uma equipe, criar tarefas, aprovar/reprovar entregas, registrar anotações internas, disparar lembrete manual.
- Dashboard com indicadores gerais e relatório exportável em CSV.
- Área do aluno: acompanhar a etapa atual da equipe (mesmo em mais de uma equipe), ver tarefas pendentes/atrasadas/aprovadas, enviar entregável por arquivo ou link (ex.: pitch no YouTube), com histórico de versões.

Como pedido, **todos os dados vivem em memória** (Context API) — ao dar refresh na página, os dados voltam ao estado inicial do mock. Isso é intencional nesta primeira entrega ("só preciso do frontend funcionando"); quando o backend estiver pronto, os `fetch`/`axios` substituem as funções de `src/store/DataContext.tsx` mantendo a mesma interface usada pelas páginas.

## Marca

Os arquivos de logo enviados pela equipe do InfoHub estão em `public/brand/` (`infohub-horizontal.png`, `infohub-stacked.png` e `infohub-icon.png`, este último recortado a partir do lockup oficial). O componente `src/components/Logo.tsx` usa essas artes originais — em vez de um logotipo recriado — e combina o ícone real do bulbo com um wordmark tipográfico em branco nos fundos escuros (sidebar do admin, hero da tela de login), já que o PNG oficial foi desenhado para fundo claro. Na tela de login, o lockup oficial em cores também aparece dentro de um cartão branco sobre o hero navy, como um "selo" da marca.

## Perguntas em aberto do documento de requisitos — respostas confirmadas

As perguntas da seção 9 do PDF de requisitos foram respondidas pelo cliente (quadro branco + conversa) e já estão implementadas no frontend:

| # | Pergunta | Resposta | Como foi implementado |
|---|---|---|---|
| Q1 | Cada integrante tem login próprio? | **Líder e integrante com regras diferentes** | Ambos podem logar (`papel` em `equipe_usuario`), mas só o **líder** consegue enviar entregáveis de uma tarefa — o integrante vê a tela em modo leitura com um aviso (`AlunoTarefaDetalhePage`). O dashboard do aluno também mostra um selo "Você é líder" / "Você é integrante". |
| Q2 | Mentor tem perfil próprio? | **Perfil próprio** | `perfil = 'mentor'`, com acesso equivalente ao admin (ver Q abaixo sobre escopo do mentor). |
| Q3 | Pitch vídeo por upload ou link? | **Link para o YouTube** | Campo `link_pitch`, sem upload de arquivo de vídeo. |
| Q4 | Aluno pode estar em mais de uma equipe? | **Sim** | `AlunoDashboardPage` lista todas as equipes do usuário logado. |
| Q5 | Existe número máximo de integrantes? | **Não** | Campo repetível no formulário de inscrição, sem limite. |
| Q6 | Existe etapa pós-InovAMF? | **Não** | O funil termina na Etapa 6 ("Pronta para o InovAMF"); não há status posterior. |
| Q7 | Qual serviço de e-mail? | **Resend (com Gmail)** | Ainda não há envio real de e-mail nesta v1 (só frontend), mas o dashboard do admin já sinaliza isso ("E-mails via Gmail + Resend") para lembrar a decisão na hora de implementar o backend. |

## Outras regras esclarecidas em conversa (além do PDF)

- **Só o mentor pode alterar o prazo de uma tarefa.** No detalhe da equipe (`AdminEquipeDetalhePage`), o botão de editar prazo só aparece para quem está logado como mentor; para admin aparece um cadeado.
- **Não é preciso RA do aluno no cadastro da equipe — só e-mail e curso.** O formulário de inscrição (`InscricaoPage`) pede e-mail (obrigatório) e curso de cada colega, nome é opcional.
- **Um aluno já cadastrado é adicionado automaticamente a uma nova equipe, sem precisar aceitar convite.** Se o e-mail informado já existe no sistema, a pessoa é vinculada direto à nova equipe; se não existe, a conta dela já é criada (com senha provisória) no mesmo cadastro.
- **Uma equipe pode ter mais de um mentor.** Isso não está no `banco.sql` original (que só tem `equipe.id_mentor` como FK única) — modelei uma extensão só no frontend (`EquipeMentor`, tipo `N:N` entre equipe e usuário) para representar isso, documentada no código como algo que precisa virar uma tabela `equipe_mentor` no banco real. O card "Mentores" no detalhe da equipe já permite adicionar/remover mais de um mentor.
- **O mentor não é restrito a "suas" equipes — a mentoria vale para todo o sistema.** Por isso `AdminLayout` é compartilhado entre `admin` e `mentor`: ambos enxergam o funil completo, não só as equipes que mentoram.

## Próximos passos sugeridos

- Conectar a um backend real (REST ou GraphQL) substituindo `DataContext`.
- Autenticação real com hash de senha e sessão/JWT.
- Envio de e-mails reais (RF-17 a RF-19) via serviço transacional (Resend + Gmail, conforme comentário no `banco.sql`).
- Upload de arquivo real (hoje o input de arquivo só registra o nome do arquivo escolhido, sem enviar bytes a lugar nenhum).
