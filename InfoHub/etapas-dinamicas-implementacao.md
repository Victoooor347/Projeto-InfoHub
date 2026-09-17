# Implementação: etapas dinâmicas por equipe

> Resposta às 5 perguntas de acompanhamento da terceira foto (mudança de requisito
> recebida via WhatsApp, 09h50: "a jornada padrão segue com 6 etapas, mas o mentor
> pode acrescentar etapas extras por equipe").

## 1. O catálogo fixo de etapas sobrevive?

Não como estava. `etapa` deixou de ser uma tabela global com 6 linhas fixas e passou a
pertencer a cada equipe (`etapa.id_equipe`, `etapa.ordem`). O "catálogo de 6" continua
existindo, mas só como **molde** (`src/db/etapasPadrao.ts`, constante `ETAPAS_PADRAO`) —
usado pra copiar essas 6 linhas pra dentro de cada equipe nova, no momento da inscrição.
Depois disso, cada equipe é dona da própria cópia.

Nenhum `CHECK 1-6` ou número hardcoded sobrevive: `equipe.id_etapa_atual` não tem mais um
intervalo fixo — o limite de "até onde dá pra avançar" agora é `MAX(ordem)` calculado por
equipe, porque o mentor pode ter esticado a jornada dela.

## 2. Onde vivem as etapas extras e como ficam ordenadas?

Na mesma tabela `etapa`, com `id_equipe` preenchido e `padrao = false`. A ordem é dada pela
coluna `ordem`: as 6 padrão nascem com `ordem` 1 a 6; toda etapa extra nasce com
`ordem = MAX(ordem atual da equipe) + 1` — sempre no fim da jornada, nunca no meio (não dá
pra "inserir" uma etapa entre a 3 e a 4 hoje, só acrescentar depois da última).

## 3. Para onde `etapa_atual` aponta agora? O histórico continua fazendo sentido?

Continua sendo uma FK de `equipe` pra `etapa`, só que agora é uma **FK composta**
`(id_etapa_atual, id_equipe) -> etapa(id_etapa, id_equipe)` — o banco garante, na própria
constraint, que uma equipe nunca aponte pra etapa de outra equipe (testado: um `UPDATE`
tentando isso é rejeitado pelo Postgres, não só pela aplicação).

Sobre o histórico: como já registrado nas respostas do primeiro bloco de perguntas
(pergunta 12), o histórico de "quando passou por cada etapa e quem moveu" **já não existia
antes** dessa mudança — `equipe.id_etapa_atual` sempre foi só um ponteiro pro estado atual,
sem log. Essa mudança não piora nem resolve esse gap; ele continua em aberto.

## 4. Equipes que já concluíram com 6 etapas: precisa de migração? Qual seria?

Sim, precisa — e ela foi escrita e **testada de verdade** (não só no papel):
`src/db/migrations/002_etapas_por_equipe.sql`. Testei rodando ela contra um banco fixture
reconstruído no schema antigo (2 equipes em etapas diferentes, com tarefa e anotação cada),
e confirmei depois que:
- cada equipe ganhou sua própria cópia das 6 etapas (nomes/descrições preservados);
- `tarefa.id_etapa`, `anotacoes.id_etapa` e `equipe.id_etapa_atual` foram todos reapontados
  pra cópia certa (a da equipe deles), sem perder nenhum dado;
- as novas constraints (FK composta) realmente rejeitam referência cruzada depois de
  aplicada a migração.

Rodar: `npm run db:migrate:002-etapas-por-equipe` (só em bancos que já estavam em produção
com o schema antigo — um banco novo, criado com `npm run db:migrate`, já nasce no formato
novo direto).

## 5. A RN-01 muda? ("Avança quando as tarefas obrigatórias estão aprovadas")

Tecnicamente não "muda", porque — como registrado na pergunta 11 das respostas do primeiro
bloco — essa regra **nunca chegou a ser implementada** no banco nem na API antes dessa
mudança: `PATCH /equipes/:id/etapa` sempre avançou sem checar tarefas. Continua assim.
Se/quando essa validação for implementada, ela precisaria já nascer pensando em etapa extra
também (contar tarefas daquela `id_etapa` específica, seja ela padrão ou extra) — não tem
nada na modelagem atual que trataria uma etapa extra de forma diferente de uma padrão nesse
quesito, o que é o comportamento correto.

## Quem pode criar etapa extra

Só o mentor **daquela equipe especificamente** (vínculo em `equipe_mentor`) — não um mentor
qualquer do sistema, nem um admin sem vínculo com a equipe. Testado: admin sem vínculo → 403;
mentor de outra equipe → 403; mentor certo → 201.

## Decisão de design no frontend: como mostrar jornadas de tamanhos diferentes no Kanban

Como cada equipe agora pode ter uma jornada de tamanho diferente, não existe mais "a etapa 3"
compartilhada por todo mundo. O Kanban (`AdminEquipesPage.tsx`) resolve isso agrupando pela
**posição** (`ordem` 1 a 6 — que tem o mesmo nome pra qualquer equipe, porque todas nascem da
mesma cópia padrão) e juntando quem já passou disso numa 7ª coluna final ("Além da jornada
padrão"), onde cada card mostra o nome específico da etapa extra em que aquela equipe está
(já que aí os nomes divergem por equipe). O dashboard (`AdminDashboardPage.tsx`) usa a mesma
lógica pro gráfico de distribuição.
