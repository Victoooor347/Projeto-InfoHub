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
-- =====================================================================

-- ---------- tipos ENUM ----------
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

CREATE TYPE perfil_usuario AS ENUM ('aluno', 'mentor', 'admin');

CREATE TYPE area_ideia AS ENUM (
  'Saúde',
  'Educação',
  'Meio Ambiente',
  'Tecnologia',
  'Entretenimento',
  'Serviços',
  'Outro'
);

CREATE TYPE estagio_ideia AS ENUM ('Apenas ideia', 'Validação', 'Prototipagem', 'Lançamento');

CREATE TYPE como_conheceu AS ENUM ('Redes sociais', 'Amigos', 'Eventos', 'Outros');

CREATE TYPE papel_equipe AS ENUM ('lider', 'integrante');

CREATE TYPE status_tarefa_desc AS ENUM (
  'Pendente',
  'Em andamento',
  'Entregue',
  'Atrasada',
  'Aprovada',
  'Reprovada/Ajustar'
);

-- ---------- cursos ----------
CREATE TABLE cursos (
  id_curso SERIAL PRIMARY KEY,
  nome curso_nome NOT NULL UNIQUE
);

-- ---------- usuario ----------
CREATE TABLE usuario (
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
CREATE INDEX idx_usuario_perfil ON usuario (perfil);

-- ---------- etapa ----------
CREATE TABLE etapa (
  id_etapa SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL
);

-- ---------- equipe ----------
CREATE TABLE equipe (
  id_equipe SERIAL PRIMARY KEY,
  nome_equipe VARCHAR(100) NOT NULL,
  nome_ideia VARCHAR(100) NOT NULL,
  descricao_ideia TEXT NOT NULL,
  area_ideia area_ideia NOT NULL,
  estagio_ideia estagio_ideia NOT NULL,
  como_conheceu como_conheceu,
  link_pitch VARCHAR(255),
  id_mentor INT REFERENCES usuario (id_usuario),
  id_etapa_atual INT NOT NULL REFERENCES etapa (id_etapa),
  pronto_para_inovamf BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_equipe_etapa_atual ON equipe (id_etapa_atual);

-- ---------- equipe_usuario ----------
CREATE TABLE equipe_usuario (
  id_equipe_usuario SERIAL PRIMARY KEY,
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
  papel papel_equipe NOT NULL,
  UNIQUE (id_equipe, id_usuario)
);
CREATE INDEX idx_equipe_usuario_usuario ON equipe_usuario (id_usuario);
CREATE INDEX idx_equipe_usuario_equipe ON equipe_usuario (id_equipe);

-- ---------- status_tarefa ----------
CREATE TABLE status_tarefa (
  id_status SERIAL PRIMARY KEY,
  descricao status_tarefa_desc NOT NULL UNIQUE
);

-- ---------- tarefa ----------
CREATE TABLE tarefa (
  id_tarefa SERIAL PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  data_limite DATE NOT NULL,
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_etapa INT NOT NULL REFERENCES etapa (id_etapa),
  id_status INT NOT NULL REFERENCES status_tarefa (id_status),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tarefa_equipe ON tarefa (id_equipe);
CREATE INDEX idx_tarefa_status ON tarefa (id_status);

-- ---------- entregavel ----------
CREATE TABLE entregavel (
  id_entregavel SERIAL PRIMARY KEY,
  arquivo_url VARCHAR(255) NOT NULL,
  tipo VARCHAR(50),
  data_envio TIMESTAMPTZ NOT NULL DEFAULT now(),
  id_tarefa INT NOT NULL REFERENCES tarefa (id_tarefa) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario)
);
CREATE INDEX idx_entregavel_tarefa ON entregavel (id_tarefa);

-- ---------- anotacoes ----------
CREATE TABLE anotacoes (
  id_anotacao SERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  data_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario),
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_etapa INT NOT NULL REFERENCES etapa (id_etapa)
);
CREATE INDEX idx_anotacoes_equipe ON anotacoes (id_equipe);

-- ---------- lembrete ----------
CREATE TABLE lembrete (
  id_lembrete SERIAL PRIMARY KEY,
  data_programada DATE NOT NULL,
  enviado BOOLEAN NOT NULL DEFAULT FALSE,
  id_tarefa INT NOT NULL REFERENCES tarefa (id_tarefa) ON DELETE CASCADE
);
CREATE INDEX idx_lembrete_tarefa ON lembrete (id_tarefa);

-- ---------- equipe_mentor (extensão N:N) ----------
CREATE TABLE equipe_mentor (
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id_equipe, id_usuario)
);
