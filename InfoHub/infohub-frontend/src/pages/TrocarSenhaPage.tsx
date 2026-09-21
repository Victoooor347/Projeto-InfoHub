import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { Logo } from "../components/Logo";
import { Card, PrimaryButton } from "../components/Kit";
import { useAuth } from "../store/AuthContext";
import * as apiInfoHub from "../services/api";
import { mensagemDeErro } from "../services/http";

/**
 * Troca de senha pelo próprio usuário. Também é a tela obrigatória para
 * quem está com senha provisória (colegas criados na inscrição, contas
 * criadas pelo admin): o ProtectedRoute manda para cá até a troca ser feita.
 */
export function TrocarSenhaPage() {
  const { usuarioAtual, entrarComToken, sair } = useAuth();
  const navigate = useNavigate();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const obrigatoria = Boolean(usuarioAtual?.deve_trocar_senha);
  const areaInicial = usuarioAtual?.perfil === "aluno" ? "/aluno" : "/admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (novaSenha.length < 6) return setErro("A nova senha precisa ter pelo menos 6 caracteres.");
    if (novaSenha !== confirmacao) return setErro("A confirmação não confere com a nova senha.");
    if (novaSenha === senhaAtual) return setErro("A nova senha precisa ser diferente da atual.");

    setSalvando(true);
    try {
      const { token, usuario } = await apiInfoHub.auth.trocarSenha(senhaAtual, novaSenha);
      entrarComToken(token, usuario); // token e sessão novos; as outras sessões caíram
      setSucesso(true);
      setTimeout(() => navigate(areaInicial, { replace: true }), 1500);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  const campo = "w-full rounded-xl border border-paper-line px-3 py-2.5 text-sm";

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-10">
      <Logo className="mb-6" />
      <Card className="w-full max-w-md p-7">
        {!obrigatoria && (
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-text-soft hover:text-ink flex items-center gap-1.5 mb-4"
          >
            <ArrowLeft size={15} /> Voltar
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <KeyRound size={20} className="text-accent-orange" />
          <h1 className="font-display text-xl font-semibold text-ink">
            {obrigatoria ? "Crie sua senha" : "Trocar senha"}
          </h1>
        </div>
        <p className="text-sm text-text-soft mt-2">
          {obrigatoria
            ? "Você entrou com uma senha provisória. Para continuar, defina uma senha só sua."
            : "Ao trocar a senha, você sai automaticamente dos outros navegadores e dispositivos."}
        </p>

        {sucesso ? (
          <div className="mt-6 flex items-center gap-2 text-brand-success bg-brand-success-soft rounded-xl px-4 py-3 text-sm font-medium">
            <ShieldCheck size={17} /> Senha alterada! Redirecionando…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-text-soft">
                {obrigatoria ? "Senha provisória" : "Senha atual"}
              </span>
              <input
                className={`${campo} mt-1`}
                type="password"
                autoComplete="current-password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-text-soft">Nova senha (mín. 6 caracteres)</span>
              <input
                className={`${campo} mt-1`}
                type="password"
                autoComplete="new-password"
                minLength={6}
                maxLength={72}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-text-soft">Confirme a nova senha</span>
              <input
                className={`${campo} mt-1`}
                type="password"
                autoComplete="new-password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                required
              />
            </label>

            {erro && <p className="text-sm text-brand-danger">{erro}</p>}

            <PrimaryButton type="submit" disabled={salvando} className="w-full">
              {salvando ? "Salvando…" : "Salvar nova senha"}
            </PrimaryButton>

            {obrigatoria && (
              <button
                type="button"
                onClick={() => {
                  sair();
                  navigate("/login");
                }}
                className="w-full text-sm text-text-soft hover:text-ink"
              >
                Sair
              </button>
            )}
          </form>
        )}
      </Card>
    </div>
  );
}
