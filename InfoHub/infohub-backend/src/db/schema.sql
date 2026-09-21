-- =====================================================================
-- InfoHub -> InovAMF — schema PostgreSQL
--
-- Traduzido a partir do banco.sql original (MySQL) fornecido pelo cliente.
-- Diferenças em relação ao banco.sql original, todas combinadas ao longo
-- do projeto (ver README > "Decisões de modelagem"):
--
--   1. ENUMs do MySQL viraram tipos ENUM nativos do Postgres.
--   2. usuario.senha -> usuario.senha_hash (nunca guardamos senha em texto
--      puro; o hash é gerado com bcrypt na camada de aplicação).
--   3. usuario.telefone deixou de ser NOT NULL — colegas de equipe
--      cadastrados só com e-mail e curso (Q do quadro branco) não têm
--      telefone no momento do cadastro.
--   4. usuario.ativo (boolean) — novo campo, necessário para RF-03
--      ("criar, editar e desativar contas de administrador/mentor").
--   5. equipe.pronto_para_inovamf (boolean) — novo campo, para marcar o
--      status "Pronta para o InovAMF" descrito na seção 3 do PDF de
--      requisitos.
--   6. Tabela nova equipe_mentor — relação N:N entre equipe e usuario,
--      pois foi esclarecido que "uma equipe pode ter mais de um mentor",
--      e também que um usuário admin pode atuar como mentor de uma
--      equipe. O banco.sql original só tinha equipe.id_mentor (FK única).
--      Mantivemos equipe.id_mentor como o "mentor principal" por
--      compatibilidade, mas a fonte de verdade para "quem mentora essa
--      equipe" agora é equipe_mentor.
--   7. `etapa` deixou de ser uma tabela global fixa de 6 linhas e passou a
--      pertencer a cada equipe (`etapa.id_equipe`, `etapa.ordem`).
--      Decisão do InfoHub via WhatsApp: "a jornada padrão segue com 6
--      etapas, mas o mentor pode acrescentar etapas extras por equipe".
--      Cada equipe nova nasce com uma cópia das 6 etapas padrão (ordem
--      1 a 6); o mentor DAQUELA equipe pode inserir etapas extras depois
--      (ordem 7, 8, ...). `equipe.id_etapa_atual`, `tarefa.id_etapa` e
--      `anotacoes.id_etapa` agora usam FK composta (id_etapa, id_equipe)
--      para garantir que uma equipe nunca aponte para a etapa de outra.
--      Ver src/db/migrations/002_etapas_por_equipe.sql para a migração que
--      transforma um banco já em produção (schema antigo) neste formato
--      sem perder dados.
--   8. Este arquivo é IDEMPOTENTE: pode rodar `db:migrate` quantas vezes
--      quiser. Ele só cria o que ainda não existe e nunca apaga dados.
--   9. Os dados de referência (cursos e status_tarefa) são inseridos AQUI,
--      não no seed — o sistema não funciona sem eles, com ou sem demo.
--  10. E-mail é único sem diferenciar maiúsculas (índice em lower(email)).
-- =====================================================================

-- ---------- tipos ENUM ----------
DO $$ BEGIN
  CREATE TYPE curso_nome AS ENUM (
    'Sistemas de Informação',
    'Direito',
    'Administração',
    'Gastronomia',
    'Ciências Contábeis',
    'Ontopsicologia',
    'Hotelaria',
    'Pedagogia'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE perfil_usuario AS ENUM ('aluno', 'mentor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE area_ideia AS ENUM (
    'Saúde',
    'Educação',
    'Meio Ambiente',
    'Tecnologia',
    'Entretenimento',
    'Serviços',
    'Outro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE estagio_ideia AS ENUM ('Apenas ideia', 'Validação', 'Prototipagem', 'Lançamento');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE como_conheceu AS ENUM ('Redes sociais', 'Amigos', 'Eventos', 'Outros');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE papel_equipe AS ENUM ('lider', 'integrante');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE status_tarefa_desc AS ENUM (
    'Pendente',
    'Em andamento',
    'Entregue',
    'Atrasada',
    'Aprovada',
    'Reprovada/Ajustar'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- cursos ----------
CREATE TABLE IF NOT EXISTS cursos (
  id_curso SERIAL PRIMARY KEY,
  nome curso_nome NOT NULL UNIQUE
);

-- ---------- usuario ----------
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(100) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil perfil_usuario NOT NULL,
  id_curso INT REFERENCES cursos (id_curso),
  semestre SMALLINT CHECK (semestre IS NULL OR (semestre BETWEEN 1 AND 12)),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usuario_perfil ON usuario (perfil);
-- impede "Joao@x.com" e "joao@x.com" como duas contas diferentes
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_email_lower ON usuario (lower(email));

-- ---------- equipe ----------
-- id_etapa_atual é fisicamente opcional só para quebrar a referência
-- circular com `etapa` (uma equipe precisa existir antes de poder ter
-- etapas; e toda etapa pertence a uma equipe). Logicamente ele NUNCA fica
-- nulo depois que a equipe é criada — o service sempre faz, na mesma
-- transação: 1) INSERT equipe (id_etapa_atual = NULL), 2) INSERT das 6
-- etapas padrão já com id_equipe preenchido, 3) UPDATE equipe SET
-- id_etapa_atual = <etapa de ordem 1>. Uma FK composta com NULL em
-- qualquer lado é considerada satisfeita pelo Postgres, então isso não
-- exige DEFERRABLE.
CREATE TABLE IF NOT EXISTS equipe (
  id_equipe SERIAL PRIMARY KEY,
  nome_equipe VARCHAR(100) NOT NULL,
  nome_ideia VARCHAR(100) NOT NULL,
  descricao_ideia TEXT NOT NULL,
  area_ideia area_ideia NOT NULL,
  estagio_ideia estagio_ideia NOT NULL,
  como_conheceu como_conheceu,
  link_pitch VARCHAR(255),
  id_mentor INT REFERENCES usuario (id_usuario),
  id_etapa_atual INT,
  pronto_para_inovamf BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equipe_etapa_atual ON equipe (id_etapa_atual);

-- ---------- etapa ----------
-- Não é mais um catálogo global fixo de 6 linhas — cada equipe tem sua
-- própria jornada. `ordem` posiciona a etapa dentro da jornada DAQUELA
-- equipe (1, 2, 3, ...). As 6 primeiras (ordem 1-6, padrao=true) nascem
-- junto com a equipe, com os nomes da cartilha; o mentor da equipe pode
-- inserir etapas extras depois (ordem 7+, padrao=false).
CREATE TABLE IF NOT EXISTS etapa (
  id_etapa SERIAL PRIMARY KEY,
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  ordem INT NOT NULL CHECK (ordem >= 1),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  padrao BOOLEAN NOT NULL DEFAULT FALSE,
  criada_por INT REFERENCES usuario (id_usuario),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id_equipe, ordem),
  UNIQUE (id_etapa, id_equipe) -- necessário para ser alvo de FK composta (ver abaixo)
);
CREATE INDEX IF NOT EXISTS idx_etapa_equipe ON etapa (id_equipe);

-- agora que `etapa` existe, fecha a FK composta de equipe.id_etapa_atual
-- (garante que uma equipe só pode apontar para uma etapa DELA MESMA)
DO $$ BEGIN
  ALTER TABLE equipe
    ADD CONSTRAINT fk_equipe_etapa_atual
    FOREIGN KEY (id_etapa_atual, id_equipe) REFERENCES etapa (id_etapa, id_equipe);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- equipe_usuario ----------
CREATE TABLE IF NOT EXISTS equipe_usuario (
  id_equipe_usuario SERIAL PRIMARY KEY,
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
  papel papel_equipe NOT NULL,
  UNIQUE (id_equipe, id_usuario)
);
CREATE INDEX IF NOT EXISTS idx_equipe_usuario_usuario ON equipe_usuario (id_usuario);
CREATE INDEX IF NOT EXISTS idx_equipe_usuario_equipe ON equipe_usuario (id_equipe);

-- ---------- status_tarefa ----------
CREATE TABLE IF NOT EXISTS status_tarefa (
  id_status SERIAL PRIMARY KEY,
  descricao status_tarefa_desc NOT NULL UNIQUE
);

-- ---------- tarefa ----------
-- id_etapa usa FK composta (id_etapa, id_equipe) -> etapa(id_etapa, id_equipe):
-- garante em nível de banco que uma tarefa só pode apontar para uma etapa
-- DA MESMA equipe dela (impossível referenciar a etapa 3 da equipe B numa
-- tarefa da equipe A).
CREATE TABLE IF NOT EXISTS tarefa (
  id_tarefa SERIAL PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  data_limite DATE NOT NULL,
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_etapa INT NOT NULL,
  id_status INT NOT NULL REFERENCES status_tarefa (id_status),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (id_etapa, id_equipe) REFERENCES etapa (id_etapa, id_equipe)
);
CREATE INDEX IF NOT EXISTS idx_tarefa_equipe ON tarefa (id_equipe);
CREATE INDEX IF NOT EXISTS idx_tarefa_status ON tarefa (id_status);

-- ---------- entregavel ----------
CREATE TABLE IF NOT EXISTS entregavel (
  id_entregavel SERIAL PRIMARY KEY,
  arquivo_url VARCHAR(255) NOT NULL,
  tipo VARCHAR(50),
  data_envio TIMESTAMPTZ NOT NULL DEFAULT now(),
  id_tarefa INT NOT NULL REFERENCES tarefa (id_tarefa) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario)
);
CREATE INDEX IF NOT EXISTS idx_entregavel_tarefa ON entregavel (id_tarefa);

-- ---------- arquivo (upload de entregáveis) ----------
-- O conteúdo fica NO BANCO (BYTEA), e não no disco do container: o Coolify
-- recria o container a cada deploy e apagaria qualquer arquivo salvo em disco.
-- id_equipe permite checar a permissão de download sem precisar de joins.
CREATE TABLE IF NOT EXISTS arquivo (
  id_arquivo SERIAL PRIMARY KEY,
  nome_original VARCHAR(255) NOT NULL,
  tipo_mime VARCHAR(100) NOT NULL,
  tamanho INT NOT NULL CHECK (tamanho > 0),
  conteudo BYTEA NOT NULL,
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_arquivo_equipe ON arquivo (id_equipe);

-- entregável de arquivo aponta para a linha em `arquivo`; entregável de link fica NULL
ALTER TABLE entregavel ADD COLUMN IF NOT EXISTS id_arquivo INT REFERENCES arquivo (id_arquivo) ON DELETE SET NULL;

-- ---------- anotacoes ----------
-- mesma lógica de FK composta que tarefa, pelo mesmo motivo.
CREATE TABLE IF NOT EXISTS anotacoes (
  id_anotacao SERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  data_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario),
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_etapa INT NOT NULL,
  FOREIGN KEY (id_etapa, id_equipe) REFERENCES etapa (id_etapa, id_equipe)
);
CREATE INDEX IF NOT EXISTS idx_anotacoes_equipe ON anotacoes (id_equipe);

-- ---------- lembrete ----------
CREATE TABLE IF NOT EXISTS lembrete (
  id_lembrete SERIAL PRIMARY KEY,
  data_programada DATE NOT NULL,
  enviado BOOLEAN NOT NULL DEFAULT FALSE,
  id_tarefa INT NOT NULL REFERENCES tarefa (id_tarefa) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lembrete_tarefa ON lembrete (id_tarefa);
-- quando o e-mail saiu de fato, para quantas pessoas, e em que modo
-- ('enviado' = SMTP real, 'teste' = redirecionado, 'simulado' = sem SMTP configurado)
ALTER TABLE lembrete ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMPTZ;
ALTER TABLE lembrete ADD COLUMN IF NOT EXISTS destinatarios INT;
ALTER TABLE lembrete ADD COLUMN IF NOT EXISTS modo_envio VARCHAR(20);

-- ---------- equipe_mentor (extensão N:N) ----------
CREATE TABLE IF NOT EXISTS equipe_mentor (
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id_equipe, id_usuario)
);

-- =====================================================================
-- Dados de referência (obrigatórios para o sistema funcionar)
-- ON CONFLICT DO NOTHING: rodar de novo não duplica nada.
-- =====================================================================
INSERT INTO cursos (nome) VALUES
  ('Sistemas de Informação'),
  ('Direito'),
  ('Administração'),
  ('Gastronomia'),
  ('Ciências Contábeis'),
  ('Ontopsicologia'),
  ('Hotelaria'),
  ('Pedagogia')
ON CONFLICT (nome) DO NOTHING;

-- a ordem importa: 1 Pendente ... 6 Reprovada/Ajustar
INSERT INTO status_tarefa (descricao) VALUES
  ('Pendente'),
  ('Em andamento'),
  ('Entregue'),
  ('Atrasada'),
  ('Aprovada'),
  ('Reprovada/Ajustar')
ON CONFLICT (descricao) DO NOTHING;
