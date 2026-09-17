# Respostas às perguntas do professor — como o banco do InfoHub resolve cada situação

> Baseado no schema real em `infohub-backend/src/db/schema.sql` (PostgreSQL) e no código
> dos services em `infohub-backend/src/modules/`. Cada resposta diz o que o sistema faz
> **hoje**, de fato — e sinaliza claramente quando é um **gap real** (coisa que o banco/API
> ainda não resolve).

---

## Bloco 1 — "Como o SEU banco resolve cada situação?"

### 01 — RF-02: a conta nasce do formulário. Como fica a senha antes do 1º acesso?

A senha já nasce definitiva, não existe um estado "sem senha". No cadastro inicial
(`inscricao.service.ts`), o próprio formulário pede uma senha (`input.senha`) e ela é
transformada em hash bcrypt **no mesmo INSERT** que cria o usuário líder — não existe
intervalo de tempo em que a conta exista sem senha utilizável.

**Exceção / gap real:** colegas de equipe que ainda não tinham conta (adicionados só por
e-mail + curso) recebem uma senha **provisória fixa**, `"trocar123"`, hasheada. Não existe
flag `precisa_trocar_senha` nem fluxo de "defina sua senha aqui". Se dois líderes diferentes
cadastrarem dois colegas novos em momentos diferentes, os dois colegas ficam com a **mesma**
senha provisória, e nada força a troca no primeiro login.

### 02 — Q1: o que impede uma equipe com dois líderes? E com nenhum?

**Nada, no banco.** `equipe_usuario.papel` é um ENUM livre por linha. A única constraint
relacionada é `UNIQUE(id_equipe, id_usuario)` — ela impede a *mesma pessoa* aparecer duas
vezes na mesma equipe, mas não impede duas pessoas *diferentes* com `papel='lider'` na
mesma equipe, e não impede uma equipe existir com zero linhas em `equipe_usuario`.

A garantia de "exatamente 1 líder por equipe" é **100% responsabilidade da aplicação**: o
único caminho que cria uma equipe (`inscricao.service.ts`) sempre insere o líder junto, na
mesma transação. Mas nada no schema impede que outro caminho (uma migração futura, um
script, um bug) insira uma segunda linha com `papel='lider'` na mesma equipe, ou apague a
única linha de líder que existia.

### 03 — RF-16: aluno reenvia o BMC corrigido — sobrescreve ou versiona? Cadê a versão 1?

**Versiona.** `entregavel` não tem `UNIQUE(id_tarefa)` nem fluxo de `UPDATE` — cada envio
(`enviarEntregavel` em `tarefas.service.ts`) é sempre um `INSERT` novo. A versão 1 continua
intacta na tabela, com `id_entregavel` menor e `data_envio` mais antiga. Recuperar o
histórico completo é:

```sql
SELECT * FROM entregavel WHERE id_tarefa = $1 ORDER BY data_envio DESC;
```

Isso já funciona hoje e é exposto pela API (`GET /tarefas/:id/entregaveis`).

### 04 — RF-17: o mentor adia o prazo. O que acontece com os lembretes já agendados?

**Nada acontece automaticamente — gap real.** `lembrete.data_programada` é gravada no
`INSERT` e não tem nenhum trigger, nenhum `ON UPDATE`, nenhuma relação viva com
`tarefa.data_limite` além da FK simples (`id_tarefa`). Quando o mentor muda o prazo via
`PATCH /tarefas/:id/prazo`, os lembretes que já existiam continuam com a data antiga —
ficariam "desalinhados" com o novo prazo. O correto seria, no mínimo, invalidar ou
reagendar os lembretes futuros e não enviados ao mudar o prazo; isso não está implementado.

### 05 — RN-04: "atrasada" é calculada na consulta ou gravada por um job? Por quê?

**Nenhum dos dois exatamente — é um meio-termo "preguiçoso" (lazy).** Existe uma função
`marcarTarefasAtrasadas()` que faz um `UPDATE` em massa:

```sql
UPDATE tarefa SET id_status = <Atrasada>
WHERE data_limite < CURRENT_DATE AND id_status IN (<Pendente>, <Em andamento>);
```

Ela **não roda num job/cron agendado** — ela é chamada dentro de `listarTarefas()`, ou seja,
só executa quando *alguém* faz um `GET /tarefas`. Entre uma listagem e outra, o campo
`id_status` no banco pode estar desatualizado (mostrando "Pendente" numa tarefa já
vencida) até a próxima leitura reprocessar isso. Não é um cálculo em tempo real (não seria
um `CASE` dentro do `SELECT`) nem um job de verdade rodando sozinho em background.

### 06 — Q4: apagar uma equipe apaga o quê? Percorram os ON DELETE.

Seguindo a cadeia de FKs do schema:

- `equipe_usuario` → `ON DELETE CASCADE` (apaga os vínculos da equipe)
- `tarefa.id_equipe` → `ON DELETE CASCADE` (apaga todas as tarefas da equipe)
  - `entregavel.id_tarefa` → `ON DELETE CASCADE` (cascata de 2º nível: some junto com a tarefa)
  - `lembrete.id_tarefa` → `ON DELETE CASCADE` (idem, cascata de 2º nível)
- `anotacoes.id_equipe` → `ON DELETE CASCADE` (apaga as anotações internas)
- `equipe_mentor` → `ON DELETE CASCADE` (apaga os vínculos de mentoria)

**O que sobrevive:** a tabela `usuario` (as pessoas continuam existindo, só perdem o vínculo
com aquela equipe) e as tabelas de referência (`etapa`, `status_tarefa`, `cursos`), que nunca
dependem de equipe. No total, apagar uma equipe é uma cascata por **6 tabelas**, mas nenhuma
pessoa é apagada.

### 07 — RF-10: o que impede a anotação do mentor de vazar para o aluno?

A tabela `anotacoes` **não tem nenhuma coluna de visibilidade**. O controle é inteiramente
de aplicação: a rota `GET /api/anotacoes` usa `requireRole("admin", "mentor")` no
middleware — um usuário com `perfil='aluno'` recebe `403` antes de qualquer query rodar.

**Isso significa:** não existe Row Level Security do Postgres, nem uma `VIEW` separada para
o aluno. Se alguém conectar direto no Postgres (um script de relatório, um BI, uma migração
futura descuidada), vê as anotações sem filtro nenhum — a garantia é da camada Express, não
do banco.

### 08 — RNF-02: aluno pede exclusão (LGPD). O que o modelo faz hoje com as entregas dele?

**Hoje não existe nenhum endpoint de exclusão de conta.** E, tecnicamente, tentar apagar a
linha do `usuario` direto no banco **falha**: `entregavel.id_usuario`, `anotacoes.id_usuario`,
`equipe_usuario.id_usuario`, `equipe.id_mentor` e `equipe_mentor.id_usuario` referenciam
`usuario(id_usuario)` **sem** `ON DELETE CASCADE` nem `ON DELETE SET NULL` — o comportamento
padrão do Postgres nesse caso é bloquear (`RESTRICT`), então um `DELETE FROM usuario` retorna
erro de violação de chave estrangeira (`23503`) assim que a pessoa tiver qualquer entregável,
anotação ou vínculo de equipe.

Isso é bom para integridade histórica, mas é um **gap real de LGPD**: não existe caminho de
anonimização (trocar nome/e-mail por algo genérico preservando o rastro) nem de exclusão em
cascata pensada para esse cenário.

---

## Bloco 2 — Perguntas 09 a 16

### 09 — Q4: o mesmo e-mail aparece em duas equipes. Quantas linhas de PESSOA existem?

**Uma só.** `usuario.email` é `UNIQUE`, e a lógica de inscrição já checa isso: se o e-mail do
colega já existe, o `id_usuario` existente é reaproveitado — só nasce uma linha nova em
`equipe_usuario` (o vínculo), nunca uma nova linha em `usuario`. Então "aparecer em duas
equipes" = **1 linha em `usuario`** + **2 linhas em `equipe_usuario`** (cada uma com seu
próprio `papel`, que inclusive pode ser diferente: líder numa equipe, integrante em outra).

### 10 — RF-11: o MODELO de tarefa ("enviar BMC") e a tarefa da equipe X: uma tabela ou duas? Por quê?

**Uma tabela só, `tarefa`.** Não existe conceito de "modelo"/"template" no schema atual —
toda linha de `tarefa` já nasce com `id_equipe NOT NULL`, ou seja, já é a instância concreta
para uma equipe específica.

**Gap real:** "modelos pré-configurados por etapa" (mencionado no RF-11 do PDF original) não
tem nenhuma representação no banco. Na prática, cada vez que o admin cria "Enviar BMC" para
outra equipe, ele preenche o formulário de novo, e nasce uma linha totalmente independente —
sem ligação entre "Enviar BMC da equipe A" e "Enviar BMC da equipe B". Se quisessem mudar o
texto padrão para todo mundo de uma vez, teria que ser um `UPDATE` manual em massa; não existe
uma tabela `tarefa_modelo` centralizando isso.

### 11 — RN-01: escrevam em palavras a query "esta equipe pode avançar de etapa?". O banco distingue obrigatória de opcional?

**Isso não é validado hoje, nem pelo banco nem pela API.** `PATCH /equipes/:id/etapa`
simplesmente faz `id_etapa_atual = min(6, max(1, atual + delta))` — não olha para nenhuma
tarefa antes de avançar.

Em palavras, a query que **deveria** existir seria algo como:

> "Conte quantas tarefas da etapa atual dessa equipe têm status diferente de 'Aprovada'; se
> esse número for maior que zero, bloqueie o avanço."

Em SQL, seria algo como:

```sql
SELECT COUNT(*) FROM tarefa
WHERE id_equipe = $1 AND id_etapa = $2 AND id_status <> (SELECT id_status FROM status_tarefa WHERE descricao = 'Aprovada');
```

E a segunda parte: **não**, o banco não distingue tarefa obrigatória de opcional — a tabela
`tarefa` não tem nenhuma coluna tipo `obrigatoria BOOLEAN`. Mesmo implementando a query acima,
ela trataria toda tarefa como igualmente obrigatória.

### 12 — RF-08/09: a equipe está na etapa 4, o banco sabe QUANDO passou pelas anteriores e QUEM moveu? E se retroceder?

**Não sabe nada disso — gap real e relevante.** `equipe.id_etapa_atual` é uma única coluna
que guarda só o valor atual; cada `UPDATE` sobrescreve o anterior sem deixar rastro. Não
existe uma tabela `equipe_etapa_historico` (algo como `id_equipe, id_etapa, entrou_em,
saiu_em, id_usuario_que_moveu`).

Então hoje é **impossível responder**: "quando a equipe X entrou na etapa 3?" ou "quem foi
que avançou ela para a etapa 4?" — essa informação se perde assim que o próximo `UPDATE`
acontece. Retroceder (`delta = -1`) tem exatamente o mesmo problema: só decrementa o número,
sem registrar que houve retrocesso nem o motivo.

Vale notar que o próprio PDF de requisitos original já previa isso — **RNF-05** pede
"Registro de auditoria (log) de mudanças de etapa" — e esse log simplesmente não existe no
banco hoje.

### 13 — Q3: o pitch é link, o BMC é PDF. Mesma tabela? Que colunas ficam vazias em cada caso?

Duas respostas diferentes, dependendo do que é:

- O **link do pitch final** da equipe não vai para `entregavel` — vai direto em
  `equipe.link_pitch` (uma coluna própria, `VARCHAR(255)`), porque ele pertence à equipe como
  um todo, não a uma tarefa específica.
- Já o **BMC**, por ser entregável de uma tarefa específica, cai em `entregavel` — e aí sim,
  **mesma tabela**, seja link ou arquivo. `entregavel.arquivo_url` guarda tanto uma URL quanto
  um "nome" de arquivo (é só `VARCHAR`, o banco não distingue formato), e `entregavel.tipo` é
  um `VARCHAR(50)` livre (tipo `"pdf"` ou `"link"` — string qualquer, **não é um ENUM**).

**Nenhuma coluna fica vazia**, porque não existe uma coluna por tipo de arquivo — é tudo
texto genérico. O gap: se um dia precisarem, por exemplo, gerar preview de PDF versus abrir o
link do YouTube de formas diferentes, a aplicação teria que *adivinhar* pelo conteúdo da
string em `tipo`, porque não há validação de formato nenhuma.

### 14 — RF-15: três rodadas de ajuste na mesma tarefa: os comentários antigos do admin sobrevivem?

**Não existe comentário nenhum para sobreviver ou não — a coluna nunca existiu.** A tabela
`tarefa` não tem campo de comentário. O fluxo de aprovar/pedir ajuste
(`PATCH /tarefas/:id/status`) só troca o `id_status` — não grava texto nenhum junto.

Se o admin quiser "pedir ajuste com uma explicação" hoje, o único lugar possível é a tabela
`anotacoes` — mas ela é da **equipe** (não da tarefa especificamente) e é **interna**, o
aluno nunca vê. Ou seja: hoje não tem como o aluno receber o motivo do "Reprovada/Ajustar"
pelo sistema — teria que ser combinado por fora (WhatsApp de novo). Esse é um gap direto
contra o texto do próprio RF-15 do PDF, que fala em "reabrindo a tarefa com um comentário
para o aluno".

### 15 — RF-18/19: como o banco sabe o que JÁ foi notificado, para não enviar o mesmo e-mail duas vezes?

A tabela `lembrete` tem uma coluna `enviado BOOLEAN` — em teoria, é ela que deveria evitar
duplicidade (mandar e-mail só para linhas com `enviado = false`, depois fazer `UPDATE` para
`true`).

**Na prática, isso não está implementado.** O único caminho que cria uma linha em `lembrete`
hoje é `POST /lembretes` (lembrete manual avulso, RF-20), e esse `INSERT` já nasce com
`enviado = TRUE` direto:

```sql
INSERT INTO lembrete (data_programada, enviado, id_tarefa) VALUES (CURRENT_DATE, TRUE, $1);
```

Não existe nenhum processo automático (job, cron, fila) que crie lembretes com
`enviado = false` e depois volte para marcar como enviado — e não existe nenhuma constraint
tipo "não insira um lembrete novo se já existe um igual para essa tarefa nessa data". A coluna
existe; o **mecanismo** de "eu sei o que já mandei" ainda não foi construído.

### 16 — RF-06/22: a query do kanban: quantos JOINs? E o contador de atrasadas do dashboard é um COUNT direto?

**A query principal do kanban tem zero JOINs:**

```sql
SELECT * FROM equipe [WHERE ...] ORDER BY id_equipe;
```

Quem "junta" equipe com líder, integrantes e mentores é o **frontend, em JavaScript**, depois
de já ter recebido `equipes`, `usuarios`, `equipe_usuario` e `equipe_mentor` como listas
separadas (múltiplas chamadas + merge no cliente — não é um `JOIN` relacional no Postgres).

O contador de tarefas atrasadas do dashboard tem o mesmo padrão: **não existe** um endpoint
`GET /dashboard` nem um `COUNT(*) WHERE id_status = 'Atrasada'` rodando no banco — o frontend
busca a lista completa de tarefas (`GET /tarefas`) e faz `.filter()` em JavaScript, contando
localmente. Funciona para o volume de dados de demonstração, mas não escala: traz **tudo**
para depois filtrar, em vez de deixar o Postgres fazer a contagem.

---

## Resumo — gaps reais identificados (para priorizar depois)

| # | Gap | Risco |
|---|---|---|
| 1 | Sem `UNIQUE` garantindo exatamente 1 líder por equipe | Integridade — depende só da aplicação |
| 4 | Mudar prazo não atualiza/invalida lembretes já agendados | Lembrete pode disparar (ou não disparar) na data errada |
| 6/8 | Sem rota de exclusão de conta; FK bloqueia DELETE de usuário com histórico | Não atende LGPD |
| 10 | Sem tabela de "modelo de tarefa" | Retrabalho manual toda vez |
| 11/12 | Avançar etapa não valida tarefas aprovadas nem grava histórico/quem moveu | Sem auditoria (contradiz RNF-05 do PDF) |
| 14 | Sem campo de comentário em `tarefa` para o fluxo de ajuste | Aluno não recebe o motivo pelo sistema |
| 15 | Coluna `enviado` existe mas não tem mecanismo de deduplicação real | Risco de notificação duplicada quando o envio de e-mail for implementado |
| 16 | Kanban e dashboard filtram em JavaScript, não em SQL | Não escala |
