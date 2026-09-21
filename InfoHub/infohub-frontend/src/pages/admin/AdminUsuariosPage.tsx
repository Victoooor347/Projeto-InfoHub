import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Plus, ShieldCheck, GraduationCap } from "lucide-react";
import { useData } from "../../store/DataContext";
import { useAuth } from "../../store/AuthContext";
import * as apiInfoHub from "../../services/api";
import { mensagemDeErro } from "../../services/http";
import { Card, EmptyState, Kpi, PrimaryButton } from "../../components/Kit";

/**
 * Requisito (seção 2): o administrador "cadastra e acompanha alunos e
 * equipes". Esta tela cadastra a equipe InfoHub (administradores e mentores).
 * Alunos e equipes são cadastrados pelo formulário de inscrição — o admin
 * usa o botão "Nova equipe" (atalho aqui e no funil).
 */
export function AdminUsuariosPage() {
  const { usuarios, equipeUsuarios, equipeMentores, recarregar } = useData();
  const { usuarioAtual } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<"mentor" | "admin">("mentor");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const equipeInfoHub = useMemo(
    () => usuarios.filter((u) => u.perfil !== "aluno").sort((a, b) => a.nome.localeCompare(b.nome)),
    [usuarios]
  );
  const totalAlunos = usuarios.filter((u) => u.perfil === "aluno").length;
  const alunosSemEquipe = usuarios.filter(
    (u) => u.perfil === "aluno" && !equipeUsuarios.some((v) => v.id_usuario === u.id_usuario)
  ).length;

  if (usuarioAtual?.perfil !== "admin") {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <EmptyState title="Acesso restrito" description="Somente administradores gerenciam usuários." />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setEnviando(true);
    try {
      const novo = await apiInfoHub.usuarios.criar({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim() || null,
        senha,
        perfil,
      });
      setSucesso(`${novo.nome} foi cadastrado(a) como ${perfil === "admin" ? "administrador(a)" : "mentor(a)"}.`);
      setNome("");
      setEmail("");
      setTelefone("");
      setSenha("");
      await recarregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  const campo = "w-full rounded-xl border border-paper-line px-3 py-2.5 text-sm";

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <p className="font-mono text-xs text-accent-orange font-medium tracking-wide">USUÁRIOS</p>
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1">Cadastro de usuários</h1>
      <p className="text-text-soft text-sm mt-1">
        Cadastre mentores e administradores. Alunos e equipes entram pelo formulário de inscrição.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <Kpi label="Equipe InfoHub" value={equipeInfoHub.length} hint="admins e mentores" />
        <Kpi label="Alunos" value={totalAlunos} />
        <Kpi label="Alunos sem equipe" value={alunosSemEquipe} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-6">
          <h2 className="font-display font-semibold text-ink text-sm">Novo mentor ou administrador</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input className={campo} placeholder="Nome completo" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <input
              className={campo}
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className={campo}
              placeholder="Telefone (opcional)"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
            <input
              className={campo}
              type="password"
              placeholder="Senha inicial (mín. 6 caracteres)"
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
            <select className={campo} value={perfil} onChange={(e) => setPerfil(e.target.value as "mentor" | "admin")}>
              <option value="mentor">Mentor</option>
              <option value="admin">Administrador</option>
            </select>

            {erro && <p className="text-sm text-brand-danger">{erro}</p>}
            {sucesso && <p className="text-sm text-brand-success">{sucesso}</p>}

            <PrimaryButton type="submit" disabled={enviando} className="w-full">
              {enviando ? "Salvando…" : "Cadastrar"}
            </PrimaryButton>
          </form>

          <div className="mt-5 pt-5 border-t border-paper-line">
            <p className="text-sm text-text-soft">Para cadastrar um aluno com a equipe dele:</p>
            <Link
              to="/inscricao"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-orange hover:underline"
            >
              <Plus size={15} /> Nova equipe
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display font-semibold text-ink text-sm">Equipe InfoHub ({equipeInfoHub.length})</h2>
          <div className="mt-3 space-y-3">
            {equipeInfoHub.map((u) => {
              const qtdEquipes = equipeMentores.filter((em) => em.id_usuario === u.id_usuario).length;
              return (
                <div key={u.id_usuario} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{u.nome}</p>
                    <p className="text-xs text-text-soft mt-0.5 flex items-center gap-1.5 truncate">
                      <Mail size={12} /> {u.email}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-ink flex items-center gap-1 justify-end">
                      {u.perfil === "admin" ? <ShieldCheck size={12} /> : <GraduationCap size={12} />}
                      {u.perfil === "admin" ? "Admin" : "Mentor"}
                    </p>
                    <p className="text-[11px] text-text-faint mt-0.5">
                      {qtdEquipes === 1 ? "1 equipe" : `${qtdEquipes} equipes`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
