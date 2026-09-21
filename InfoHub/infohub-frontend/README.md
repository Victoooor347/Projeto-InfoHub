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
