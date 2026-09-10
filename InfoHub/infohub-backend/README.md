# InfoHub → InovAMF — Backend

API do Sistema de Acompanhamento da Jornada do Empreendedor. **Node + TypeScript + Express 5 + Zod 4 + PostgreSQL**, sem ORM (queries SQL diretas via `pg`, parametrizadas).

Esta API foi desenhada para servir o [frontend React que já existe](../infohub-frontend) — os nomes de tabelas/campos seguem o `banco.sql` original do cliente, e as regras de negócio implementadas aqui são as mesmas validadas com o cliente ao longo do projeto (ver seção "Decisões de modelagem" abaixo).

## Como rodar

Pré-requisitos: **Node.js 18+**, **PostgreSQL 14+** rodando localmente (ou acessível via `DATABASE_URL`).

```bash
# 1. instalar dependências
npm install

# 2. copiar o .env de exemplo e ajustar DATABASE_URL / JWT_SECRET
cp .env.example .env

# 3. criar o banco (se ainda não existir)
createdb infohub   # ou: psql -c "CREATE DATABASE infohub;"

# 4. aplicar o schema e popular com dados de demonstração
  npm run db:migrate
npm run db:seed

# 5. rodar em desenvolvimento (recarrega automaticamente)
npm run dev
```

A API sobe em `http://localhost:3333` (configurável via `PORT` no `.env`). Teste com:

```bash
curl http://localhost:3333/health
```

### Scripts disponíveis

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API em modo desenvolvimento (tsx watch) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda a versão compilada (`dist/server.js`) |
| `npm run db:migrate` | Aplica `src/db/schema.sql` no banco apontado por `DATABASE_URL` |
| `npm run db:seed` | Popula o banco com as mesmas contas/equipes de demonstração do frontend mock |
| `npm run db:reset` | **Apaga tudo** (dropa e recria o schema `public`) — use com cuidado |
| `npm run db:fresh` | `db:reset` + `db:migrate` + `db:seed` em sequência — jeito rápido de recomeçar do zero |

### Contas de demonstração (após `db:seed`)

| Perfil | E-mail | Senha |
|---|---|---|
| Administradora | `renata.bock@infohub.amf.br` | `admin123` |
| Mentor | `diego.casagrande@infohub.amf.br` | `mentor123` |
| Aluno líder | `bruno.kellermann@aluno.amf.br` | `aluno123` |
| Aluna integrante | `camila.restelatto@aluno.amf.br` | `aluno123` |

## Estrutura do projeto

```
src/
  config/
    env.ts        variáveis de ambiente validadas com Zod
    db.ts         pool de conexão do Postgres (pg) + helper query()
  db/
    schema.sql     DDL completo (tabelas, enums, índices)
    migrate.ts      aplica schema.sql
    seed.ts         popula dados de demonstração
    reset.ts        dropa e recria o schema public
  middlewares/
    auth.ts         valida JWT e recarrega o usuário do banco a cada request
    validate.ts      valida body/params/query contra schemas Zod
    errorHandler.ts  converte AppError/ZodError em resposta HTTP padronizada
  modules/
    auth/            login (POST /auth/login) e sessão atual (GET /auth/me)
    usuarios/         RF-03: admin cria/edita/desativa contas de admin e mentor
    cursos/ etapas/ statusTarefas/   tabelas de referência (somente leitura)
    equipes/          funil kanban, avançar etapa, mentores (N:N), link do pitch
    equipeUsuarios/    membros de cada equipe (líder/integrante)
    tarefas/           CRUD de tarefas, status, prazo, entregáveis
    entregaveis/       listagem global (uso administrativo/relatórios)
    anotacoes/         anotações internas do mentor (nunca visíveis ao aluno)
    lembretes/         lembrete manual avulso (RF-20)
    inscricao/         cadastro público inicial (RF-02 a RF-05)
  types/express/       augmenta Request com req.usuario
  utils/AppError.ts    erro de aplicação com status HTTP
  app.ts               monta o Express (middlewares, rotas, 404, error handler)
  server.ts             ponto de entrada
```

Cada módulo maior segue `*.routes.ts` (rotas + middlewares) → `*.controller.ts` (lê request, chama service, monta response) → `*.service.ts` (regra de negócio + SQL) → `*.schemas.ts` (validação Zod) → `*.types.ts`. Módulos pequenos e só-leitura (cursos, etapas, anotações, lembretes, entregáveis) ficam num único `*.routes.ts` para não multiplicar arquivos triviais.

## Referência de endpoints

Todas as rotas (exceto `/health`, `/auth/login` e `/inscricao`) exigem `Authorization: Bearer <token>`.

### Autenticação
- `POST /api/auth/login` — `{ email, senha }` → `{ token, usuario }`
- `GET /api/auth/me` — dados do usuário autenticado

### Cadastro inicial (público)
- `POST /api/inscricao` — formulário da Etapa 1 (RF-02); cria conta do líder, a equipe, e vincula colegas por e-mail (cria conta nova ou reaproveita uma existente, sem "aceitar convite")

### Referência (leitura)
- `GET /api/cursos`, `GET /api/etapas`, `GET /api/status-tarefas`

### Usuários (RF-03 — só admin)
- `GET /api/usuarios?perfil=&ativo=`
- `POST /api/usuarios` — cria conta de admin/mentor
- `PATCH /api/usuarios/:id` — editar dados ou `{ ativo: false }` para desativar

### Equipes
- `GET /api/equipes?busca=&area=&mentor=` — funil kanban (RF-06/RF-07)
- `GET /api/equipes/:id` — detalhe (aluno só vê a própria equipe)
- `PATCH /api/equipes/:id/etapa` — `{ delta: 1 | -1 }` avança/retrocede (RF-09)
- `PATCH /api/equipes/:id/pronto` — `{ pronto: boolean }` marca "Pronta para o InovAMF"
- `PATCH /api/equipes/:id/link-pitch` — `{ link_pitch }` (admin/mentor, ou o próprio líder)
- `GET /api/equipes/:id/mentores`
- `POST /api/equipes/:id/mentores` — `{ id_usuario }` (só admin; usuário precisa ser admin ou mentor)
- `DELETE /api/equipes/:id/mentores/:idUsuario`

### Membros
- `GET /api/equipe-usuarios?id_equipe=` ou `?id_usuario=`

### Tarefas
- `GET /api/tarefas?id_equipe=&id_status=` — aluno só vê tarefas das próprias equipes
- `POST /api/tarefas` — admin/mentor (RF-11/RF-12)
- `PATCH /api/tarefas/:id/status` — admin/mentor, aprovar/pedir ajuste (RF-15)
- `PATCH /api/tarefas/:id/prazo` — **só mentor** (global ou vinculado àquela equipe)
- `POST /api/tarefas/:id/entregaveis` — **só o líder** da equipe (RF-14)
- `GET /api/tarefas/:id/entregaveis`

### Anotações internas / Lembretes / Entregáveis (listagem global)
- `GET/POST /api/anotacoes` (admin/mentor só)
- `GET/POST /api/lembretes` (admin/mentor só)
- `GET /api/entregaveis` (admin/mentor só)

## Decisões de modelagem

Tudo abaixo foi validado com o cliente ao longo do projeto (quadro branco + conversa), não são suposições minhas:

1. **Uma equipe pode ter mais de um mentor.** O `banco.sql` original só tinha `equipe.id_mentor` (FK única). Criei a tabela `equipe_mentor` (N:N) como extensão; `equipe.id_mentor` continua existindo só por compatibilidade, apontando pro primeiro mentor.
2. **Um admin pode "virar" mentor de uma equipe específica.** `POST /equipes/:id/mentores` aceita tanto usuários com `perfil='mentor'` quanto `perfil='admin'` — só rejeita `aluno`.
3. **Só o mentor pode alterar o prazo de uma tarefa.** E "mentor" aqui é: tem `perfil='mentor'` (mentor acompanha o sistema todo, não só as equipes dele) **ou** é admin mas foi explicitamente adicionado em `equipe_mentor` daquela equipe. Um admin comum, sem vínculo de mentoria, recebe 403.
4. **Líder e integrante têm permissões diferentes** (Q1). Só o líder da equipe pode enviar entregável (`POST /tarefas/:id/entregaveis`); integrante recebe 403.
5. **Cadastro de colega só precisa de e-mail + curso, sem RA.** Se o e-mail já existe no sistema, a pessoa é adicionada direto na equipe nova, sem "aceitar convite"; se não existe, a conta já é criada com senha provisória (`trocar123`).
6. **Sem número máximo de integrantes por equipe** (Q5) e **sem etapa pós-InovAMF** (Q6) — o funil termina na Etapa 6.
7. **RF-03** (admin cria/edita/desativa contas de admin e mentor) está implementado — era um requisito do PDF que tinha ficado pendente no frontend mock.

## O que ainda falta para produção

- **Envio de e-mail de verdade** (Resend + Gmail, conforme Q7) — hoje `POST /lembretes` só registra o lembrete como enviado, não dispara e-mail.
- **Refresh token** — o JWT expira em 7 dias (`JWT_EXPIRES_IN`) sem renovação automática.
- **Upload real de arquivo** — `entregavel.arquivo_url` guarda uma URL/nome; não há endpoint de upload binário (S3, disco, etc.) ainda.
- **Rate limiting** e **logs estruturados** para produção.
- Conectar o frontend (`infohub-frontend`) a esta API no lugar do `DataContext` mock, mantendo os mesmos tipos.

## Testado de ponta a ponta

Antes de entregar, rodei o servidor contra um Postgres real e testei via `curl`:
login (admin/mentor/aluno), `GET /auth/me`, listagem de equipes com/sem token, as 4 regras finas de permissão (admin não edita prazo / mentor edita / integrante não envia entregável / líder envia), múltiplos mentores por equipe (incluindo admin virando mentor, e rejeição de aluno como mentor), inscrição pública com auto-vínculo de colega (e-mail novo cria conta, e-mail existente reaproveita), RF-03 completo (criar → logar → desativar → login falha), 404 numa rota inexistente, e erro 422 de validação Zod.
