# InfoHub → InovAMF — Frontend

Frontend do **Sistema de Acompanhamento da Jornada do Empreendedor**, feito com **React + TypeScript + Vite + Tailwind CSS v4**.

Conectado a uma API real (ver [`../infohub-backend`](../infohub-backend)) — **precisa do backend rodando** para funcionar; não há mais dados mockados neste projeto (o antigo `src/data/mockData.ts` foi removido quando a conexão com a API foi feita).

## Como rodar o projeto

Pré-requisitos: **Node.js 18+**, e o [backend já rodando](../infohub-backend/README.md) em `http://localhost:3333`.

```bash
# 1. instalar dependências
npm install

# 2. copiar o .env de exemplo (já aponta pro backend local, normalmente não precisa mexer)
cp .env.example .env

# 3. rodar em modo desenvolvimento
npm run dev
```

Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`).

Outros comandos úteis:

```bash
npm run build      # gera a versão de produção em /dist
npm run preview    # serve a versão de produção localmente
```

## Login

Digite e-mail e senha de uma das contas de demonstração (criadas pelo `db:seed` do backend):

| Perfil | E-mail | Senha |
|---|---|---|
| Administradora | `renata.bock@infohub.amf.br` | `admin123` |
| Mentor | `diego.casagrande@infohub.amf.br` | `mentor123` |
| Aluno (líder de equipe) | `bruno.kellermann@aluno.amf.br` | `aluno123` |
| Aluna (integrante, sem permissão de envio) | `camila.restelatto@aluno.amf.br` | `aluno123` |

Você também pode clicar em **"Inscrever minha equipe"** na tela de login para criar uma conta e equipe novas de verdade (formulário inicial, RF-02).

## Estrutura do projeto

```
src/
  types/           tipos TypeScript espelhando as respostas da API
  services/
    http.ts        cliente HTTP: base URL, token JWT, tratamento de erro
    api.ts          uma função tipada por endpoint da API
  store/           AuthContext (login/sessão) + DataContext (dados vindos da API)
  utils/           funções auxiliares (formatação de datas, status, joins entre tabelas)
  components/      componentes reutilizáveis (StageRail, StatusBadge, Kit de UI, etc.)
  layouts/         casca de navegação do admin e do aluno (com estados de carregamento/erro)
  pages/
    LoginPage.tsx
    InscricaoPage.tsx        formulário inicial (Etapa 1 / RF-02 a RF-05)
    admin/
      AdminDashboardPage.tsx     visão geral e KPIs (RF-22)
      AdminEquipesPage.tsx       funil/kanban com busca e filtros (RF-06, RF-07)
      AdminEquipeDetalhePage.tsx detalhe da equipe: tarefas, entregáveis, anotações, etapas extras
      AdminTarefasPage.tsx       lista de tarefas com filtros
      AdminRelatoriosPage.tsx    relatório consolidado + exportação CSV (RF-23, RF-24)
    aluno/
      AlunoDashboardPage.tsx     "minha jornada" com o funil visual
      AlunoTarefasPage.tsx       lista de tarefas do aluno (RF-13)
      AlunoTarefaDetalhePage.tsx envio de entregável + histórico de versões (RF-14, RF-16)
```

## O que já está funcionando

- Login real (JWT) por perfil (`admin`, `mentor`, `aluno`), com sessão restaurada ao recarregar a página e proteção de rotas.
- Formulário de inscrição inicial, criando conta + equipe de verdade no banco.
- Painel do administrador: funil kanban, busca/filtros, avançar/retroceder etapa, criar tarefas, aprovar/reprovar entregas, registrar anotações internas, disparar lembrete manual, múltiplos mentores por equipe.
- Dashboard com indicadores gerais e relatório exportável em CSV.
- Área do aluno: acompanhar a etapa atual da equipe (mesmo em mais de uma equipe), ver tarefas pendentes/atrasadas/aprovadas, enviar entregável por arquivo ou link (ex.: pitch no YouTube), com histórico de versões.
- **Etapas dinâmicas por equipe**: a jornada padrão tem 6 etapas, mas o mentor de cada equipe pode acrescentar etapas extras só para ela (formulário no detalhe da equipe, visível só pra quem é mentor daquela equipe específica). O Kanban agrupa pelas 6 etapas padrão (nome igual pra todo mundo) mais uma coluna final "Além da jornada padrão" pra quem já está em etapa extra — ver `../etapas-dinamicas-implementacao.md` na raiz do projeto para os detalhes dessa decisão de design.

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

- Upload de arquivo real (hoje o input de arquivo manda o nome/link pra API, mas não há envio de binário pra um storage de verdade).
- Envio de e-mails reais (RF-17 a RF-19) via serviço transacional (Resend + Gmail, conforme comentário no `banco.sql`) — hoje o backend só registra o lembrete, não dispara e-mail.
