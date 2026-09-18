# InfoHub → InovAMF

Sistema de Acompanhamento da Jornada do Empreendedor — da ideia inicial no InfoHub até o
encaminhamento pro InovAMF. Projeto dividido em duas pastas que **precisam rodar juntas**:

```
infohub-backend/    API (Node + TypeScript + Express + PostgreSQL)
infohub-frontend/   Interface (React + TypeScript + Vite)
```

Cada pasta tem seu próprio README com detalhes específicos — este arquivo é só o guia rápido
pra colocar tudo de pé, na ordem certa, do zero.

## Pré-requisitos

- **Node.js 18+**
- **PostgreSQL 14+** rodando localmente (ou uma `DATABASE_URL` de algum jeito acessível)

## Passo a passo (do zero)

### 1. Banco de dados

```bash
createdb infohub
# ou, se preferir: psql -c "CREATE DATABASE infohub;"
```

### 2. Backend

```bash
cd infohub-backend
npm install
cp .env.example .env          # ajuste DATABASE_URL/JWT_SECRET se precisar
npm run db:migrate            # cria tabelas + cursos + status (pode rodar de novo sem medo)
npm run db:seed               # OPCIONAL: dados de demonstração (só em banco vazio)
npm run dev                   # sobe a API em http://localhost:3333
```

Confirme que subiu: `curl http://localhost:3333/health` deve responder `{"status":"ok",...}`.

### 3. Frontend (num segundo terminal)

```bash
cd infohub-frontend
npm install
cp .env.example .env          # já vem apontando pra http://localhost:3333, normalmente não precisa mexer
npm run dev                   # sobe em http://localhost:5173
```

Abra `http://localhost:5173` no navegador. **O backend precisa estar rodando** — o frontend
não tem mais dados mockados, ele busca tudo da API de verdade.

## Contas de demonstração (criadas pelo `db:seed`)

| Perfil | E-mail | Senha |
|---|---|---|
| Administradora | `renata.bock@infohub.amf.br` | `admin123` |
| Mentor | `diego.casagrande@infohub.amf.br` | `mentor123` |
| Aluno líder | `bruno.kellermann@aluno.amf.br` | `aluno123` |
| Aluna integrante | `camila.restelatto@aluno.amf.br` | `aluno123` |

## Produção (Coolify)

No terminal do container do backend, depois do deploy:

```bash
npm run db:migrate:prod     # idempotente: só cria o que falta, nunca apaga dados
npm run db:seed:prod        # opcional, só na primeira vez (dados de demonstração)
```

**Nunca** rode `db:reset` / `db:fresh` no servidor — eles apagam o banco inteiro.
Se rodar o seed em produção, troque a senha das contas de demonstração, porque elas
estão documentadas acima.

Banco criado com a versão ANTIGA do schema (etapa como catálogo fixo de 6)? Aplique uma
única vez `src/db/migrations/002_etapas_por_equipe.sql` com `psql`. Banco novo não precisa.

## O que já funciona hoje

- Login de verdade (JWT), com sessão restaurada ao recarregar a página
- Cadastro inicial público (formulário → cria conta + equipe automaticamente)
- Painel do admin/mentor: Kanban, tarefas, aprovação de entregas, anotações internas, mentores
  múltiplos por equipe, relatórios com exportação CSV
- Área do aluno: acompanhar a jornada da própria equipe, enviar entregáveis (só o líder)
- **Etapas dinâmicas por equipe**: a jornada padrão tem 6 etapas, mas o mentor de cada equipe
  pode acrescentar etapas extras só para ela

## O que ainda falta para produção

- Envio de e-mail de verdade (hoje os lembretes só ficam registrados no banco)
- Upload real de arquivo (hoje `entregavel.arquivo_url` guarda um link/nome, não o binário)
- Refresh token (o JWT expira em 7 dias sem renovação automática)
- Troca de senha pelo próprio usuário (colegas criados na inscrição recebem uma senha
  provisória aleatória, mostrada uma única vez ao líder)

## Outros documentos neste pacote

- **`infohub-backend/README.md`** — referência completa de endpoints da API e decisões de
  modelagem do banco
- **`infohub-frontend/README.md`** — estrutura das telas e como cada regra de negócio foi
  implementada na interface
