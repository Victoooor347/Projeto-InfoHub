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
npm run db:migrate            # cria as tabelas
npm run db:seed               # popula com dados de demonstração
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

## Se o banco já estava em produção ANTES da mudança de etapas dinâmicas

Se você já tinha um banco rodando com a versão anterior (etapa como catálogo fixo de 6),
**não rode `db:migrate` de novo** (ele recria do zero). Em vez disso:

```bash
cd infohub-backend
npm run db:migrate:002-etapas-por-equipe
```

Isso transforma os dados existentes pro novo formato sem apagar nada — ver
`infohub-backend/src/db/migrations/002_etapas_por_equipe.sql` e
`etapas-dinamicas-implementacao.md` (na raiz) para os detalhes de como isso funciona e como
foi testado.

## O que já funciona hoje

- Login de verdade (JWT), com sessão restaurada ao recarregar a página
- Cadastro inicial público (formulário → cria conta + equipe automaticamente)
- Painel do admin/mentor: Kanban, tarefas, aprovação de entregas, anotações internas, mentores
  múltiplos por equipe, relatórios com exportação CSV
- Área do aluno: acompanhar a jornada da própria equipe, enviar entregáveis (só o líder)
- **Etapas dinâmicas por equipe**: a jornada padrão tem 6 etapas, mas o mentor de cada equipe
  pode acrescentar etapas extras só para ela — ver `etapas-dinamicas-implementacao.md`

## O que ainda falta para produção

- Envio de e-mail de verdade (hoje os lembretes só ficam registrados no banco)
- Upload real de arquivo (hoje `entregavel.arquivo_url` guarda um link/nome, não o binário)
- Refresh token (o JWT expira em 7 dias sem renovação automática)

## Outros documentos neste pacote

- **`respostas-professor-banco.md`** — respostas às perguntas de modelagem de banco de dados,
  com base no código real (não em teoria) — inclui uma lista de gaps genuínos identificados
- **`etapas-dinamicas-implementacao.md`** — como a mudança de etapas por equipe foi
  implementada, testada, e a migração de dados para bancos já em produção
- **`infohub-backend/README.md`** — referência completa de endpoints da API e decisões de
  modelagem do banco
- **`infohub-frontend/README.md`** — estrutura das telas e como cada regra de negócio foi
  implementada na interface
