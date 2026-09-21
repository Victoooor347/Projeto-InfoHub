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
npm run db:seed               # recria o cenário de demonstração (apaga os dados anteriores)
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

## Cenário de demonstração (G1)

O seed roda em **todo deploy** (comando pós-deploy `npm run db:setup` = migrate + seed) e
recria sempre o mesmo cenário no schema da dupla:

- 3 equipes com 3 integrantes cada, 1 líder por equipe (EcoRota, SaborLocal, MenteAtiva)
- 1 administradora e 4 mentores: Diego mentora EcoRota e SaborLocal; Luiza mentora
  MenteAtiva; Marcos e Patrícia ainda sem equipe
- EcoRota e SaborLocal com a Etapa 1 aprovada, cursando a Etapa 2
- MenteAtiva com uma tarefa de prazo atrasado

Como o seed limpa os dados antes de inserir, **o que for criado pelo sistema some no próximo deploy**.

| Perfil | E-mail | Senha |
|---|---|---|
| Administradora | `renata.bock@infohub.amf.br` | `admin123` |
| Mentor (EcoRota, SaborLocal) | `diego.casagrande@infohub.amf.br` | `mentor123` |
| Mentora (MenteAtiva) | `luiza.andreatta@infohub.amf.br` | `mentor123` |
| Mentores sem equipe | `marcos.tonet@infohub.amf.br`, `patricia.dallacosta@infohub.amf.br` | `mentor123` |
| Líder EcoRota | `bruno.kellermann@aluno.amf.br` | `aluno123` |
| Líder SaborLocal | `fernanda.locatelli@aluno.amf.br` | `aluno123` |
| Líder MenteAtiva (atrasada) | `helena.zortea@aluno.amf.br` | `aluno123` |
| Integrante EcoRota | `camila.restelatto@aluno.amf.br` | `aluno123` |

## Produção (Coolify)

Um único resource (Base Directory `/InfoHub`): o Express serve a API e o build do React.
Comando pós-deploy:

```bash
npm run db:setup     # cria schema e tabelas (idempotente) + recria o cenário de demonstração
```

**Nunca** rode `db:reset` / `db:fresh` no servidor.

## Lembretes por e-mail e upload de arquivos

**Upload:** o líder anexa arquivos de até 5 MB (PDF, Office, imagens, ZIP) na tarefa. O
conteúdo fica no banco (tabela `arquivo`), porque o container do Coolify é recriado a cada
deploy. O download respeita as mesmas permissões das equipes. Vídeos continuam por link.

**Lembretes:** toda tarefa nova ganha um lembrete agendado para `LEMBRETE_DIAS_ANTES` dia(s)
antes do prazo; o servidor confere de hora em hora e envia o e-mail para todos os integrantes.
O botão "lembrete" do admin/mentor envia na hora. Variáveis (todas opcionais):

| Variável | Exemplo |
|---|---|
| `SMTP_HOST` / `SMTP_PORT` | `smtp.gmail.com` / `587` |
| `SMTP_USER` / `SMTP_PASS` | seu e-mail / senha de app do Google |
| `EMAIL_FROM` | `InfoHub <seuemail@gmail.com>` |
| `EMAIL_TESTE_PARA` | redireciona **todos** os e-mails para esse endereço (demo) |
| `APP_URL` | endereço público do sistema (link no e-mail) |
| `LEMBRETE_DIAS_ANTES` | `1` |

Sem SMTP configurado, o sistema funciona em **modo simulação**: o lembrete é registrado e o
e-mail só aparece no log do container.

## O que já funciona hoje

- Login com token de acesso curto (15 min) + refresh token de 7 dias em cookie httpOnly,
  renovado automaticamente e revogado no logout ou na troca de senha
- Troca de senha pelo próprio usuário; senha provisória (colegas da inscrição, contas criadas
  pelo admin) obriga a troca no primeiro acesso
- Upload de arquivos (até 5 MB, guardados no banco) e lembretes por e-mail (automáticos e manuais)
- Cadastro inicial público (formulário → cria conta + equipe automaticamente)
- Painel do admin/mentor: Kanban, tarefas, aprovação de entregas, anotações internas, mentores
  múltiplos por equipe, relatórios com exportação CSV
- Área do aluno: acompanhar a jornada da própria equipe, enviar entregáveis (só o líder)
- **Etapas dinâmicas por equipe**: a jornada padrão tem 6 etapas, mas o mentor de cada equipe
  pode acrescentar etapas extras só para ela

## O que ainda falta para produção

- "Esqueci minha senha" (redefinição por e-mail) — hoje, quem esquece precisa de ajuda do admin
- Rate limiting no login e logs estruturados

## Outros documentos neste pacote

- **`infohub-backend/README.md`** — referência completa de endpoints da API e decisões de
  modelagem do banco
- **`infohub-frontend/README.md`** — estrutura das telas e como cada regra de negócio foi
  implementada na interface
