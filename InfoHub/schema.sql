/* Líder e integrante com roles diferentes, Perfil próprio para mentores, o video do pitch sera enviado via link
do youtube, usuário poderá participar de mais de uma equipe, não existe um número máximo de integrantes
por equipe, o sistema não terá novas etapas pós infohub, o serviço de e-mail sera o gmail com RESEND */

/* Cursos*/
CREATE TABLE cursos (
    id_curso INT PRIMARY KEY AUTO_INCREMENT,
    nome ENUM('Sistemas de Informação', 'Direito', 'Administração', 'Gastronomia', 'Ciências Contábeis', 'Ontopsicologia', 'Hotelaria', 'Pedagogia') NOT NULL
);

/* 2. Usuários */
CREATE TABLE usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL, /* Aumentado para 255 para suportar hashes de senha (ex: bcrypt) */
    perfil ENUM('aluno', 'mentor', 'admin') NOT NULL, /* Perfil de acesso ao sistema */
    id_curso INT,
    semestre TINYINT, /* O semestre pertence ao status atual do aluno, ex: 1 a 10 */
    FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)
);

/* Etapas */
CREATE TABLE etapa (
    id_etapa INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL
);

/* Equipe */
CREATE TABLE equipe (
    id_equipe INT PRIMARY KEY AUTO_INCREMENT,
    nome_equipe VARCHAR(100) NOT NULL,
    nome_ideia VARCHAR(100) NOT NULL,
    descricao_ideia TEXT NOT NULL,
    area_ideia ENUM('Saúde', 'Educação', 'Meio Ambiente', 'Tecnologia', 'Entretenimento', 'Serviços', 'Outro') NOT NULL,
    estagio_ideia ENUM('Apenas ideia', 'Validação', 'Prototipagem', 'Lançamento') NOT NULL,
    como_conheceu ENUM('Redes sociais', 'Amigos', 'Eventos', 'Outros'),
    link_pitch VARCHAR(255), /* Link do vídeo no YouTube enviado no final */
    id_mentor INT,
    id_etapa_atual INT NOT NULL, /* Controle do Kanban/Funil */
    FOREIGN KEY (id_mentor) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_etapa_atual) REFERENCES etapa(id_etapa)
);

/* Equipe | Usuario */
CREATE TABLE equipe_usuario (
    id_equipe_usuario INT PRIMARY KEY AUTO_INCREMENT,
    id_equipe INT NOT NULL,
      id_usuario INT NOT NULL,
    papel ENUM('lider', 'integrante') NOT NULL, /* Papel específico DESTE aluno NESTA equipe */
    FOREIGN KEY (id_equipe) REFERENCES equipe(id_equipe),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

/* Status das Tarefas */
CREATE TABLE status_tarefa (
    id_status INT PRIMARY KEY AUTO_INCREMENT,
    descricao ENUM('Pendente', 'Em andamento', 'Entregue', 'Atrasada', 'Aprovada', 'Reprovada/Ajustar') NOT NULL
);

/* Tarefas */
CREATE TABLE tarefa (
    id_tarefa INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    data_limite DATE NOT NULL,
    id_equipe INT NOT NULL,
    id_etapa INT NOT NULL,
    id_status INT NOT NULL,
    FOREIGN KEY (id_equipe) REFERENCES equipe(id_equipe),
    FOREIGN KEY (id_etapa) REFERENCES etapa(id_etapa),
    FOREIGN KEY (id_status) REFERENCES status_tarefa(id_status)
);

/* Entregáveis */
CREATE TABLE entregavel (
    id_entregavel INT PRIMARY KEY AUTO_INCREMENT,
    arquivo_url VARCHAR(255) NOT NULL,
    tipo VARCHAR(50), 
    data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_tarefa INT NOT NULL,
    id_usuario INT NOT NULL, 
    FOREIGN KEY (id_tarefa) REFERENCES tarefa(id_tarefa),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

/* Anotações */
CREATE TABLE anotacoes (
    id_anotacao INT PRIMARY KEY AUTO_INCREMENT,
    descricao TEXT NOT NULL,
    data_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL, 
    id_equipe INT NOT NULL,
    id_etapa INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_equipe) REFERENCES equipe(id_equipe),
    FOREIGN KEY (id_etapa) REFERENCES etapa(id_etapa)
);

/* Lembretes */
CREATE TABLE lembrete (
    id_lembrete INT PRIMARY KEY AUTO_INCREMENT,
    data_programada DATE NOT NULL,
    enviado BOOLEAN DEFAULT FALSE, 
    id_tarefa INT NOT NULL,
    FOREIGN KEY (id_tarefa) REFERENCES tarefa(id_tarefa)
);