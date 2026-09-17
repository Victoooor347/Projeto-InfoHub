-- Snapshot do schema.sql como ele era ANTES da mudança "etapas por equipe"
-- (etapa como catálogo global fixo de 6 linhas). Usado só pra testar a
-- migração 002 de verdade, partindo de um banco no formato antigo.
CREATE TYPE curso_nome AS ENUM (
  'Sistemas de Informação','Direito','Administração','Gastronomia',
  'Ciências Contábeis','Ontopsicologia','Hotelaria','Pedagogia'
);
CREATE TYPE perfil_usuario AS ENUM ('aluno', 'mentor', 'admin');
CREATE TYPE area_ideia AS ENUM (
  'Saúde','Educação','Meio Ambiente','Tecnologia','Entretenimento','Serviços','Outro'
);
CREATE TYPE estagio_ideia AS ENUM ('Apenas ideia', 'Validação', 'Prototipagem', 'Lançamento');
CREATE TYPE como_conheceu AS ENUM ('Redes sociais', 'Amigos', 'Eventos', 'Outros');
CREATE TYPE papel_equipe AS ENUM ('lider', 'integrante');
CREATE TYPE status_tarefa_desc AS ENUM (
  'Pendente','Em andamento','Entregue','Atrasada','Aprovada','Reprovada/Ajustar'
);

CREATE TABLE cursos (
  id_curso SERIAL PRIMARY KEY,
  nome curso_nome NOT NULL UNIQUE
);

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

CREATE TABLE etapa (
  id_etapa SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL
);

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

CREATE TABLE equipe_usuario (
  id_equipe_usuario SERIAL PRIMARY KEY,
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
  papel papel_equipe NOT NULL,
  UNIQUE (id_equipe, id_usuario)
);

CREATE TABLE status_tarefa (
  id_status SERIAL PRIMARY KEY,
  descricao status_tarefa_desc NOT NULL UNIQUE
);

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

CREATE TABLE entregavel (
  id_entregavel SERIAL PRIMARY KEY,
  arquivo_url VARCHAR(255) NOT NULL,
  tipo VARCHAR(50),
  data_envio TIMESTAMPTZ NOT NULL DEFAULT now(),
  id_tarefa INT NOT NULL REFERENCES tarefa (id_tarefa) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario)
);

CREATE TABLE anotacoes (
  id_anotacao SERIAL PRIMARY KEY,
  descricao TEXT NOT NULL,
  data_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario),
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_etapa INT NOT NULL REFERENCES etapa (id_etapa)
);

CREATE TABLE lembrete (
  id_lembrete SERIAL PRIMARY KEY,
  data_programada DATE NOT NULL,
  enviado BOOLEAN NOT NULL DEFAULT FALSE,
  id_tarefa INT NOT NULL REFERENCES tarefa (id_tarefa) ON DELETE CASCADE
);

CREATE TABLE equipe_mentor (
  id_equipe INT NOT NULL REFERENCES equipe (id_equipe) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES usuario (id_usuario) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id_equipe, id_usuario)
);

-- ---- dados mínimos pra testar a migração ----
INSERT INTO cursos (nome) VALUES ('Sistemas de Informação');
INSERT INTO usuario (nome, telefone, email, senha_hash, perfil, id_curso)
  VALUES ('Aluno Teste', '123', 'aluno@teste.com', 'x', 'aluno', 1);
INSERT INTO etapa (nome, descricao) VALUES
  ('Envio da ideia', 'd1'), ('Contato com a equipe', 'd2'),
  ('Encontro 1', 'd3'), ('Encontro 2', 'd4'),
  ('Encontro 3', 'd5'), ('Encontro 4', 'd6');
-- duas equipes, cada uma numa etapa diferente
INSERT INTO equipe (nome_equipe, nome_ideia, descricao_ideia, area_ideia, estagio_ideia, id_etapa_atual)
  VALUES ('EquipeA', 'IdeiaA', 'descA', 'Tecnologia', 'Validação', 3);
INSERT INTO equipe (nome_equipe, nome_ideia, descricao_ideia, area_ideia, estagio_ideia, id_etapa_atual, pronto_para_inovamf)
  VALUES ('EquipeB', 'IdeiaB', 'descB', 'Saúde', 'Lançamento', 6, TRUE);
INSERT INTO status_tarefa (descricao) VALUES ('Pendente'),('Em andamento'),('Entregue'),('Atrasada'),('Aprovada'),('Reprovada/Ajustar');
-- tarefa da EquipeA na etapa 3 dela, e da EquipeB na etapa 6 dela
INSERT INTO tarefa (titulo, descricao, data_limite, id_equipe, id_etapa, id_status)
  VALUES ('Tarefa A', 'x', '2026-12-01', 1, 3, 1);
INSERT INTO tarefa (titulo, descricao, data_limite, id_equipe, id_etapa, id_status)
  VALUES ('Tarefa B', 'x', '2026-12-01', 2, 6, 5);
INSERT INTO anotacoes (descricao, id_usuario, id_equipe, id_etapa)
  VALUES ('nota da EquipeA', 1, 1, 3);
