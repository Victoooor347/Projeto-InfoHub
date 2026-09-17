import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Logo } from "../components/Logo";
import { StageRail } from "../components/StageRail";
import { useAuth } from "../store/AuthContext";
import { PrimaryButton } from "../components/Kit";
import type { Etapa } from "../types";

// Puramente decorativo: a tela de login é pública, e etapa deixou de ser um
// dado público (agora pertence a cada equipe — ver decisão 7 do backend).
// Esses 6 nomes só ilustram a jornada padrão no hero, sem vir da API.
const ETAPAS_DEMO: Etapa[] = [
  "Envio da ideia",
  "Contato com a equipe",
  "Encontro 1",
  "Encontro 2",
  "Encontro 3",
  "Encontro 4",
].map((nome, i) => ({
  id_etapa: i + 1,
  id_equipe: 0,
  ordem: i + 1,
  nome,
  descricao: "",
  padrao: true,
  criada_por: null,
  criado_em: "",
}));

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const { entrar } = useAuth();
  const navigate = useNavigate();

  // O destino agora vem do perfil que a API devolveu, não mais de um palpite
  // baseado no domínio do e-mail.
  async function autenticar(contaEmail: string, contaSenha: string) {
    setEntrando(true);
    const resultado = await entrar(contaEmail, contaSenha);
    setEntrando(false);

    if (!resultado.ok || !resultado.usuario) {
      setErro(resultado.erro ?? "Não foi possível entrar.");
      return;
    }
    setErro(null);
    navigate(resultado.usuario.perfil === "aluno" ? "/aluno" : "/admin");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    autenticar(email, senha);
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
            <StageRail etapas={ETAPAS_DEMO} ordemAtual={4} size="sm" />
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
            <PrimaryButton
              type="submit"
              disabled={entrando}
              className="w-full flex items-center justify-center gap-2"
            >
              {entrando ? "Entrando…" : "Entrar"} <ArrowRight size={16} />
            </PrimaryButton>
          </form>

          <p className="text-center text-sm text-text-soft mt-5">
            Sua ideia ainda não está no InfoHub?{" "}
            <Link to="/inscricao" className="text-accent-orange font-medium hover:underline">
              Inscrever minha equipe
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
