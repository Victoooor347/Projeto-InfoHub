import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { Logo } from "../components/Logo";
import { useData } from "../store/DataContext";
import { useAuth } from "../store/AuthContext";
import { PrimaryButton, Card } from "../components/Kit";
import type { AreaIdeia, ComoConheceu, EstagioIdeia } from "../types";

const areas: AreaIdeia[] = ["Saúde", "Educação", "Meio Ambiente", "Tecnologia", "Entretenimento", "Serviços", "Outro"];
const estagios: EstagioIdeia[] = ["Apenas ideia", "Validação", "Prototipagem", "Lançamento"];
const origens: ComoConheceu[] = ["Redes sociais", "Amigos", "Eventos", "Outros"];

interface Colega {
  nome: string;
  email: string;
  idCurso: number;
}

export function InscricaoPage() {
  const { cursos, registrarCadastroInicial } = useData();
  const { entrarComo } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [idCurso, setIdCurso] = useState<number>(cursos[0]?.id_curso ?? 1);
  const [semestre, setSemestre] = useState<number>(1);
  const [colegas, setColegas] = useState<Colega[]>([]);

  const [nomeEquipe, setNomeEquipe] = useState("");
  const [nomeIdeia, setNomeIdeia] = useState("");
  const [descricaoIdeia, setDescricaoIdeia] = useState("");
  const [areaIdeia, setAreaIdeia] = useState<AreaIdeia>("Tecnologia");
  const [estagioIdeia, setEstagioIdeia] = useState<EstagioIdeia>("Apenas ideia");
  const [comoConheceu, setComoConheceu] = useState<ComoConheceu | "">("");

  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function addColega() {
    setColegas((prev) => [...prev, { nome: "", email: "", idCurso: cursos[0]?.id_curso ?? 1 }]);
  }

  function removeColega(index: number) {
    setColegas((prev) => prev.filter((_, i) => i !== index));
  }

  function updateColega(index: number, patch: Partial<Colega>) {
    setColegas((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !email || !senha || !telefone || !nomeEquipe || !nomeIdeia || !descricaoIdeia) {
      setErro("Preencha todos os campos obrigatórios antes de enviar (RF-04).");
      return;
    }
    setErro(null);

    const { usuario } = registrarCadastroInicial({
      nomeLider: nome,
      telefone,
      email,
      senha,
      idCurso,
      semestre,
      colegas,
      nomeEquipe,
      nomeIdeia,
      descricaoIdeia,
      areaIdeia,
      estagioIdeia,
      comoConheceu: comoConheceu || null,
    });

    setEnviado(true);
    setTimeout(() => {
      entrarComo(usuario);
      navigate("/aluno");
    }, 1400);
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-4">
        <Card className="p-10 text-center max-w-sm">
          <CheckCircle2 className="mx-auto text-brand-success" size={40} />
          <h2 className="font-display text-xl font-semibold text-ink mt-4">Ideia enviada!</h2>
          <p className="text-text-soft text-sm mt-2">
            Sua equipe entrou na Etapa 1 do funil. O administrador foi notificado por e-mail (RF-05). Redirecionando
            para sua área…
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-paper-line bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo />
          <Link to="/login" className="text-sm text-text-soft hover:text-ink flex items-center gap-1.5">
            <ArrowLeft size={15} /> Já tenho conta
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <p className="font-mono text-xs text-accent-orange font-medium tracking-wide">ETAPA 1 · ENVIO DA IDEIA</p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1">Conte pra gente sua ideia</h1>
        <p className="text-text-soft text-sm mt-2 max-w-lg">
          Esse é o ponto de partida da jornada InfoHub → InovAMF. Preencha o formulário abaixo — sua conta de
          acesso é criada automaticamente ao enviar.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <Card className="p-6 space-y-4">
            <h2 className="font-display font-semibold text-ink">Seus dados</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome completo *">
                <input className={inputClass} value={nome} onChange={(e) => setNome(e.target.value)} required />
              </Field>
              <Field label="E-mail *">
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Telefone / WhatsApp *">
                <input
                  className={inputClass}
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(55) 99999-0000"
                  required
                />
              </Field>
              <Field label="Crie uma senha *">
                <input
                  type="password"
                  className={inputClass}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </Field>
              <Field label="Curso *">
                <select className={inputClass} value={idCurso} onChange={(e) => setIdCurso(Number(e.target.value))}>
                  {cursos.map((c) => (
                    <option key={c.id_curso} value={c.id_curso}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Semestre atual *">
                <input
                  type="number"
                  min={1}
                  max={12}
                  className={inputClass}
                  value={semestre}
                  onChange={(e) => setSemestre(Number(e.target.value))}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-ink">Colegas de equipe</h2>
              <button
                type="button"
                onClick={addColega}
                className="text-xs font-semibold text-accent-orange flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Adicionar integrante
              </button>
            </div>
            <p className="text-xs text-text-soft -mt-2">
              Não há número máximo de integrantes. Basta o e-mail e o curso — se a pessoa já tiver conta no
              InfoHub, ela é adicionada automaticamente à equipe; senão, a conta dela já é criada agora.
            </p>
            {colegas.length === 0 && (
              <p className="text-sm text-text-faint italic">Nenhum colega adicionado ainda.</p>
            )}
            <div className="space-y-3">
              {colegas.map((c, i) => (
                <div key={i} className="flex flex-wrap gap-2 items-start">
                  <input
                    className={inputClass + " flex-1 min-w-[140px]"}
                    placeholder="Nome (opcional)"
                    value={c.nome}
                    onChange={(e) => updateColega(i, { nome: e.target.value })}
                  />
                  <input
                    type="email"
                    className={inputClass + " flex-1 min-w-[180px]"}
                    placeholder="E-mail do colega *"
                    value={c.email}
                    onChange={(e) => updateColega(i, { email: e.target.value })}
                    required
                  />
                  <select
                    className={inputClass + " w-full sm:w-40"}
                    value={c.idCurso}
                    onChange={(e) => updateColega(i, { idCurso: Number(e.target.value) })}
                  >
                    {cursos.map((curso) => (
                      <option key={curso.id_curso} value={curso.id_curso}>
                        {curso.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeColega(i)}
                    className="p-2.5 rounded-xl border border-paper-line text-text-soft hover:text-brand-danger hover:border-brand-danger/40 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-display font-semibold text-ink">Sobre a ideia</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nome da equipe *">
                <input className={inputClass} value={nomeEquipe} onChange={(e) => setNomeEquipe(e.target.value)} />
              </Field>
              <Field label="Nome da ideia / projeto *">
                <input className={inputClass} value={nomeIdeia} onChange={(e) => setNomeIdeia(e.target.value)} />
              </Field>
            </div>
            <Field label="Descrição inicial da ideia * (mesmo que ainda 'crua')">
              <textarea
                className={inputClass + " min-h-[100px] resize-y"}
                value={descricaoIdeia}
                onChange={(e) => setDescricaoIdeia(e.target.value)}
              />
            </Field>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Área / setor">
                <select className={inputClass} value={areaIdeia} onChange={(e) => setAreaIdeia(e.target.value as AreaIdeia)}>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Estágio atual">
                <select
                  className={inputClass}
                  value={estagioIdeia}
                  onChange={(e) => setEstagioIdeia(e.target.value as EstagioIdeia)}
                >
                  {estagios.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Como conheceu o InfoHub">
                <select
                  className={inputClass}
                  value={comoConheceu}
                  onChange={(e) => setComoConheceu(e.target.value as ComoConheceu)}
                >
                  <option value="">Prefiro não dizer</option>
                  {origens.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>

          {erro && <p className="text-sm text-brand-danger">{erro}</p>}

          <PrimaryButton type="submit" className="w-full sm:w-auto">
            Enviar minha ideia
          </PrimaryButton>
        </form>
      </main>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-paper-line px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent-orange/40 focus:border-accent-orange";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-text-soft">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
