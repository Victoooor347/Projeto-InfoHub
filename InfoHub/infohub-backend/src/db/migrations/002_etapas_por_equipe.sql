-- =====================================================================
-- Migração 002 — etapa global (6 linhas fixas) -> etapa por equipe
--
-- Contexto: decisão do InfoHub via WhatsApp — "a jornada padrão segue com
-- 6 etapas, mas o mentor pode acrescentar etapas extras por equipe".
-- Isso exige que `etapa` deixe de ser um catálogo global e passe a
-- pertencer a cada equipe.
--
-- Esta migração parte de um banco JÁ EM PRODUÇÃO no formato antigo
-- (etapa = 6 linhas globais, referenciadas por id_etapa simples em
-- equipe/tarefa/anotacoes) e chega no formato novo SEM apagar nenhum
-- dado: cada equipe existente ganha sua própria cópia das 6 etapas
-- (mesmos nomes/descrições que já tinha), e tarefa/anotacoes/equipe são
-- reapontadas para a cópia certa.
--
-- Só é necessária em um banco criado com o schema ANTIGO. Banco novo:
-- ignore este arquivo, o schema.sql já está no formato novo.
-- Como rodar (uma única vez): psql "$DATABASE_URL" -f src/db/migrations/002_etapas_por_equipe.sql
-- =====================================================================

BEGIN;

-- 1) novas colunas em etapa, ainda opcionais (vamos preenchê-las já já)
ALTER TABLE etapa ADD COLUMN id_equipe INT REFERENCES equipe (id_equipe) ON DELETE CASCADE;
ALTER TABLE etapa ADD COLUMN ordem INT;
ALTER TABLE etapa ADD COLUMN padrao BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE etapa ADD COLUMN criada_por INT REFERENCES usuario (id_usuario);
ALTER TABLE etapa ADD COLUMN criado_em TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2) para cada equipe existente, cria uma cópia das 6 etapas globais
--    originais, guardando o mapeamento (equipe, etapa antiga -> etapa nova)
CREATE TEMP TABLE mapa_etapas (
  id_equipe INT,
  id_etapa_antigo INT,
  id_etapa_novo INT
) ON COMMIT DROP;

DO $$
DECLARE
  eq RECORD;
  et RECORD;
  novo_id INT;
BEGIN
  FOR eq IN SELECT id_equipe FROM equipe ORDER BY id_equipe LOOP
    FOR et IN
      SELECT id_etapa, nome, descricao, ROW_NUMBER() OVER (ORDER BY id_etapa) AS ordem
      FROM etapa
      WHERE id_equipe IS NULL  -- só as 6 globais originais, nunca as cópias já criadas
    LOOP
      INSERT INTO etapa (id_equipe, ordem, nome, descricao, padrao)
      VALUES (eq.id_equipe, et.ordem, et.nome, et.descricao, TRUE)
      RETURNING id_etapa INTO novo_id;

      INSERT INTO mapa_etapas VALUES (eq.id_equipe, et.id_etapa, novo_id);
    END LOOP;
  END LOOP;
END $$;

-- 3) reaponta tarefa / anotacoes / equipe.id_etapa_atual para a cópia
--    da equipe certa (usando o mapa montado no passo 2)
UPDATE tarefa t
SET id_etapa = m.id_etapa_novo
FROM mapa_etapas m
WHERE m.id_equipe = t.id_equipe AND m.id_etapa_antigo = t.id_etapa;

UPDATE anotacoes a
SET id_etapa = m.id_etapa_novo
FROM mapa_etapas m
WHERE m.id_equipe = a.id_equipe AND m.id_etapa_antigo = a.id_etapa;

UPDATE equipe e
SET id_etapa_atual = m.id_etapa_novo
FROM mapa_etapas m
WHERE m.id_equipe = e.id_equipe AND m.id_etapa_antigo = e.id_etapa_atual;

-- 4) as 6 linhas globais originais agora estão órfãs (nada mais aponta
--    pra elas) — remove
DELETE FROM etapa WHERE id_equipe IS NULL;

-- 5) agora que toda etapa tem dono, fecha as constraints
ALTER TABLE etapa ALTER COLUMN id_equipe SET NOT NULL;
ALTER TABLE etapa ALTER COLUMN ordem SET NOT NULL;
ALTER TABLE etapa ADD CONSTRAINT etapa_ordem_check CHECK (ordem >= 1);
ALTER TABLE etapa ADD CONSTRAINT etapa_id_equipe_ordem_key UNIQUE (id_equipe, ordem);
ALTER TABLE etapa ADD CONSTRAINT etapa_id_etapa_id_equipe_key UNIQUE (id_etapa, id_equipe);
CREATE INDEX idx_etapa_equipe ON etapa (id_equipe);

-- 6) troca as FKs simples por compostas (id_etapa, id_equipe), garantindo
--    que uma equipe nunca aponte pra etapa de outra
ALTER TABLE equipe DROP CONSTRAINT equipe_id_etapa_atual_fkey;
ALTER TABLE equipe ALTER COLUMN id_etapa_atual DROP NOT NULL; -- physically nullable (ver schema.sql, decisão 7)
ALTER TABLE equipe
  ADD CONSTRAINT fk_equipe_etapa_atual
  FOREIGN KEY (id_etapa_atual, id_equipe) REFERENCES etapa (id_etapa, id_equipe);

ALTER TABLE tarefa DROP CONSTRAINT tarefa_id_etapa_fkey;
ALTER TABLE tarefa
  ADD FOREIGN KEY (id_etapa, id_equipe) REFERENCES etapa (id_etapa, id_equipe);

ALTER TABLE anotacoes DROP CONSTRAINT anotacoes_id_etapa_fkey;
ALTER TABLE anotacoes
  ADD FOREIGN KEY (id_etapa, id_equipe) REFERENCES etapa (id_etapa, id_equipe);

COMMIT;
