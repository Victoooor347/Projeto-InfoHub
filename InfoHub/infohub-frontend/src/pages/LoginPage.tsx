import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "../components/Logo";
import { StageRail } from "../components/StageRail";
import { useAuth } from "../store/AuthContext";
import { useData } from "../store/DataContext";
import { PrimaryButton } from "../components/Kit";

const contasDemo = [
  { email: "renata.bock@infohub.amf.br", senha: "admin123", label: "Renata Bock", papel: "Administradora" },
  { email: "diego.casagrande@infohub.amf.br", senha: "mentor123", label: "Prof. Diego", papel: "Mentor" },
  { email: "bruno.kellermann@aluno.amf.br", senha: "aluno123", label: "Bruno Kellermann", papel: "Aluno · líder" },
  { email: "camila.restelatto@aluno.amf.br", senha: "aluno123", label: "Camila Restelatto", papel: "Aluna · integrante" },
];

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const { entrar } = useAuth();
  const { etapas } = useData();
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resultado = entrar(email, senha);
    if (!resultado.ok) {
      setErro(resultado.erro ?? "Não foi possível entrar.");
      return;
    }
    setErro(null);
    const perfil = email.includes("aluno") ? "aluno" : "admin";
    navigate(perfil === "aluno" ? "/aluno" : "/admin");
  }

  function handleDemo(contaEmail: string, contaSenha: string) {
    setEmail(contaEmail);
    setSenha(contaSenha);
    const resultado = entrar(contaEmail, contaSenha);
    if (resultado.ok) {
      navigate(contaEmail.includes("aluno") ? "/aluno" : "/admin");
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-paper">
      <div className="hidden md:flex flex-col justify-between bg-ink text-white p-10 relative overflow-hidden">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full gradient-brand opacity-20 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-brand-info opacity-10 blur-3xl"
          aria-hidden
        />

        {/* Selo com a marca oficial em cores originais, como um "carimbo" sobre o hero escuro */}
        <div
          className="hidden lg:block absolute top-10 -right-8 w-56 bg-white rounded-2xl shadow-xl p-4 rotate-3 z-10"
          aria-hidden
        >
          <Logo as="mark" />
        </div>

        <Logo variant="light" className="relative z-10" />

        <div className="relative z-10 max-w-md">
          <p className="font-mono text-xs text-white/50 mb-3 tracking-wide">FACULDADE ANTONIO MENEGHETTI</p>
          <h1 className="font-display text-3xl font-semibold leading-tight">
            Da ideia no papel ao <span className="text-gradient-brand">pitch pronto</span> para o InovAMF.
          </h1>
          <p className="text-white/60 text-sm mt-4 leading-relaxed">
            Acompanhe em um só lugar cada equipe do InfoHub: etapa atual, tarefas, prazos e entregáveis —
            sem depender mais de planilha e WhatsApp.
          </p>
          <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
            <StageRail etapas={etapas} etapaAtual={4} size="sm" />
          </div>
        </div>

        <p className="relative z-10 text-white/40 text-xs">InfoHub → InovAMF · Sistema de acompanhamento v1.0</p>
      </div>

      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12">
        <div className="max-w-sm w-full mx-auto">
          <div className="md:hidden mb-8">
            <Logo />
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink">Entrar</h2>
          <p className="text-text-soft text-sm mt-1">Acesse com o e-mail cadastrado no InfoHub.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-text-soft" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@amf.br"
                className="mt-1 w-full rounded-xl border border-paper-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange/40 focus:border-accent-orange"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-soft" htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-paper-line px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange/40 focus:border-accent-orange"
              />
            </div>
            {erro && <p className="text-sm text-brand-danger">{erro}</p>}
            <PrimaryButton type="submit" className="w-full flex items-center justify-center gap-2">
              Entrar <ArrowRight size={16} />
            </PrimaryButton>
          </form>

          <p className="text-center text-sm text-text-soft mt-5">
            Sua ideia ainda não está no InfoHub?{" "}
            <Link to="/inscricao" className="text-accent-orange font-medium hover:underline">
              Inscrever minha equipe
            </Link>
          </p>

          <div className="mt-10 pt-6 border-t border-paper-line">
            <p className="text-xs font-medium text-text-soft flex items-center gap-1.5 mb-3">
              <ShieldCheck size={14} /> Acesso rápido de demonstração
            </p>
            <div className="space-y-2">
              {contasDemo.map((c) => (
                <button
                  key={c.email}
                  onClick={() => handleDemo(c.email, c.senha)}
                  className="w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-paper-line hover:border-accent-orange/50 hover:bg-paper-alt/60 transition group"
                >
                  <span>
                    <span className="block text-sm font-medium text-ink">{c.label}</span>
                    <span className="block text-xs text-text-soft">{c.papel}</span>
                  </span>
                  <ArrowRight size={14} className="text-text-faint group-hover:text-accent-orange transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
