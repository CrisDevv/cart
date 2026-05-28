import React, { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Lock,
  Plus,
  Trash2,
  Edit2,
  Save,
  LogOut,
  Sparkles,
  Inbox,
  Music,
  Share2,
  Compass,
  ArrowLeft,
  Calendar,
  HelpCircle,
  Eye,
  Check,
  RotateCcw,
  Upload
} from "lucide-react";
import StarryBackground from "./components/StarryBackground";
import VisitorPortal from "./components/VisitorPortal";
import { StoryData, StoryConfig, Letter, TimelineEvent } from "./types";
import { staticStoryData } from "./staticData";

export default function App() {
  // Public Configuration (loaded initially)
  const [publicConfig, setPublicConfig] = useState<{
    question: string;
    hint: string;
    coupleName1: string;
    coupleName2: string;
    introText: string;
  }>({
    question: staticStoryData.config.securityQuestion,
    hint: staticStoryData.config.hint,
    coupleName1: staticStoryData.config.coupleName1,
    coupleName2: staticStoryData.config.coupleName2,
    introText: staticStoryData.config.introText
  });

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [visitorUnlocked, setVisitorUnlocked] = useState(false);

  // Admin Section States
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminData, setAdminData] = useState<StoryData | null>(null);
  const [submittingAdminUpdate, setSubmittingAdminUpdate] = useState(false);
  const [adminUpdateSuccess, setAdminUpdateSuccess] = useState(false);

  // Active sub-tab inside administer portal
  const [adminActiveTab, setAdminActiveTab] = useState<"replies" | "config" | "letters" | "timeline">("replies");

  // Local draft states for live updates in developer panel
  const [draftConfig, setDraftConfig] = useState<StoryConfig | null>(null);
  const [draftLetters, setDraftLetters] = useState<Letter[]>([]);
  const [draftTimeline, setDraftTimeline] = useState<TimelineEvent[]>([]);

  // Editing items state helper
  const [editingLetterId, setEditingLetterId] = useState<string | null>(null);
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);

  // MP3 Audio uploading states
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState("");
  const [audioUploadSuccess, setAudioUploadSuccess] = useState(false);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".mp3")) {
      setAudioUploadError("Apenas arquivos .mp3 são suportados.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) { // 15MB limit
      setAudioUploadError("O arquivo .mp3 é muito grande. Limite: 15MB.");
      return;
    }

    setIsUploadingAudio(true);
    setAudioUploadError("");
    setAudioUploadSuccess(false);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];

        const response = await fetch("/api/admin/upload-audio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            password: adminPassword,
            filename: file.name,
            base64Data
          })
        });

        const resData = await response.json();

        if (response.ok && resData.success) {
          setAudioUploadSuccess(true);
          setDraftConfig((prev: any) => {
            if (!prev) return null;
            return {
              ...prev,
              musicUrl: resData.url,
              songTitle: resData.songTitle,
              songArtist: resData.songArtist
            };
          });
          setTimeout(() => setAudioUploadSuccess(false), 4000);
        } else {
          setAudioUploadError(resData.error || "Não foi possível enviar o áudio.");
        }
      };

      reader.onerror = () => {
        setAudioUploadError("Erro ao ler o arquivo MP3.");
      };

      reader.readAsDataURL(file);
    } catch {
      setAudioUploadError("Erro de conexão ao enviar o áudio.");
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Fetch initial public configs
  const fetchPublicConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/public-config");
      if (res.ok) {
        const data = await res.json();
        setPublicConfig(data);
        setConfigError(false);
      } else {
        setPublicConfig({
          question: staticStoryData.config.securityQuestion,
          hint: staticStoryData.config.hint,
          coupleName1: staticStoryData.config.coupleName1,
          coupleName2: staticStoryData.config.coupleName2,
          introText: staticStoryData.config.introText
        });
        setConfigError(false);
      }
    } catch {
      setPublicConfig({
        question: staticStoryData.config.securityQuestion,
        hint: staticStoryData.config.hint,
        coupleName1: staticStoryData.config.coupleName1,
        coupleName2: staticStoryData.config.coupleName2,
        introText: staticStoryData.config.introText
      });
      setConfigError(false);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchPublicConfig();
  }, []);

  // Admin Login Request
  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminAuthenticated(true);
        setAdminData(data.data);
        setDraftConfig(data.data.config);
        setDraftLetters(data.data.letters);
        setDraftTimeline(data.data.timeline);
      } else {
        setAdminLoginError(data.error || "Senha do administrador incorreta.");
      }
    } catch {
      setAdminLoginError("Não foi possível conectar com o painel.");
    }
  };

  // Submit edits
  const handleSaveAdminData = async () => {
    if (!draftConfig || !adminData) return;
    setSubmittingAdminUpdate(true);
    setAdminUpdateSuccess(false);

    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          config: draftConfig,
          letters: draftLetters,
          timeline: draftTimeline,
        }),
      });

      if (res.ok) {
        setAdminUpdateSuccess(true);
        // Refresh original public config silently to keep synchronized
        fetchPublicConfig();
        setTimeout(() => setAdminUpdateSuccess(false), 4000);
      } else {
        const d = await res.json();
        alert(d.error || "Falha ao salvar modificações.");
      }
    } catch {
      alert("Houve um erro de conexão ao salvar.");
    } finally {
      setSubmittingAdminUpdate(false);
    }
  };

  const handleLoggedOut = () => {
    setIsAdminAuthenticated(false);
    setAdminPassword("");
    setAdminData(null);
  };

  // Helper adding letter drafts
  const handleAddLetterDraft = () => {
    const newId = `l_${Date.now()}`;
    const newLetter: Letter = {
      id: newId,
      title: "Nova Carta de Sentimento 📝",
      date: "Data do Momento",
      content: "Escreva aqui o seu texto romântico, sincero ou reflexivo. Diga exatamente o que seu coração guarda com carinho.",
      mood: "romantic",
      isRead: false,
    };
    setDraftLetters([...draftLetters, newLetter]);
    setEditingLetterId(newId);
  };

  // Timeline add draft
  const handleAddTimelineDraft = () => {
    const newId = `t_${Date.now()}`;
    const newEvent: TimelineEvent = {
      id: newId,
      date: "Ano ou Época",
      title: "Momento Especial 📍",
      description: "Uma pequena lembrança doce explicando esse marco histórico na nossa trajetória juntos.",
      icon: "Heart",
    };
    setDraftTimeline([...draftTimeline, newEvent]);
    setEditingTimelineId(newId);
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-rose-500/30">
      
      {/* 1. STARRY ATMOSPHERIC CANVAS */}
      <StarryBackground isUnlocked={visitorUnlocked} />

      {/* Main Container */}
      <main className="flex-1 w-full flex flex-col items-center justify-start">
        
        {/* If initial loading */}
        {loadingConfig && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
            <span className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-400 animate-spin" />
            <p className="text-sm text-rose-300 font-serif italic animate-pulse">
              Carregando nosso pequeno universo...
            </p>
          </div>
        )}

        {/* A. VISITOR STORY PORTAL OR B. ADMIN CONTROL */}
        {!loadingConfig && publicConfig && (
          <div className="w-full">
            <AnimatePresence mode="wait">
              {!showAdminPanel ? (
                // 1. VISITOR PORTAL INTERNET SIDE
                <motion.div
                  key="visitor-side"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full"
                >
                  <VisitorPortal
                    publicConfig={publicConfig}
                    onUnlockSuccess={(data) => {
                      setVisitorUnlocked(true);
                    }}
                  />
                </motion.div>
              ) : (
                // 2. THE ADMIN EDIT PANEL FOR THE WRITER
                <motion.div
                  key="admin-side"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full max-w-4xl p-4 md:p-8 space-y-6 mx-auto z-10 relative"
                >
                  
                  {/* Admin Entrance (Password Shield) */}
                  {!isAdminAuthenticated ? (
                    <div className="max-w-md mx-auto mt-16 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
                      <div className="text-center mb-6">
                        <span className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-full inline-block text-rose-400 mb-3">
                          <Lock className="w-6 h-6" />
                        </span>
                        <h2 className="font-serif text-xl font-bold text-rose-100">Painel do Escritor 🔒</h2>
                        <p className="text-xs text-slate-400 mt-1">
                          Apenas você, autor do portal, pode entrar aqui para editar mensagens e ver recados dela.
                        </p>
                      </div>

                      <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                            Sua Senha de Escritor:
                          </label>
                          <input
                            type="password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Dica padrão: amor"
                            className="w-full bg-slate-950 border border-slate-700/60 focus:border-rose-400 rounded-xl px-4 py-3 text-slate-150 text-sm outline-none transition-all"
                            required
                          />
                        </div>

                        {adminLoginError && (
                          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 flex items-center gap-1.5">
                            ✕ {adminLoginError}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAdminPanel(false)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-3 px-4 rounded-xl cursor-pointer"
                          >
                            Voltar ao Portal
                          </button>
                          <button
                            type="submit"
                            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs py-3 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-2"
                          >
                            Acessar Painel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    
                    /* AUTHENTICATED WRITER WORKSPACE */
                    <div className="space-y-6">
                      
                      {/* Dashboard Header Bar */}
                      <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
                        <div className="text-center md:text-left">
                          <span className="text-[10px] uppercase tracking-widest font-mono text-rose-400 font-bold bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                            Modo Escritor Ativo
                          </span>
                          <h1 className="font-serif text-2xl text-slate-100 font-semibold mt-1">
                            Painel de Configuração
                          </h1>
                          <p className="text-xs text-slate-400">
                            Edite perguntas, escreva cartinhas sinceras e acompanhe as reações dela.
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleSaveAdminData}
                            disabled={submittingAdminUpdate}
                            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                          >
                            {submittingAdminUpdate ? (
                              <span className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                            ) : (
                              <>
                                <Save className="w-4 h-4 text-slate-950" />
                                <span>Salvar Alterações</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleLoggedOut}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 p-2.5 rounded-xl border border-slate-700/50 cursor-pointer"
                            title="Sair do painel"
                          >
                            <LogOut className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </header>

                      {/* Live Update status toasts */}
                      {adminUpdateSuccess && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl p-4 text-xs md:text-sm flex items-center gap-2 shadow-lg"
                        >
                          <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-300">✓</span>
                          <span><strong>Perfeito!</strong> Seus textos, cartas e respostas foram atualizados e salvos com sucesso na nuvem.</span>
                        </motion.div>
                      )}

                      {/* Admin Tab Selectors */}
                      <div className="flex overflow-x-auto gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                        <button
                          onClick={() => setAdminActiveTab("replies")}
                          className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                            adminActiveTab === "replies"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/20"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Inbox className="w-4 h-4 text-rose-400" />
                          Respostas dela ({adminData?.replies?.length || 0})
                        </button>
                        <button
                          onClick={() => setAdminActiveTab("config")}
                          className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                            adminActiveTab === "config"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/20"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Lock className="w-4 h-4 text-rose-400" />
                          Configurações &amp; Música
                        </button>
                        <button
                          onClick={() => setAdminActiveTab("letters")}
                          className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                            adminActiveTab === "letters"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/20"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Sparkles className="w-4 h-4 text-rose-400" />
                          Editar Cartas ({draftLetters.length})
                        </button>
                        <button
                          onClick={() => setAdminActiveTab("timeline")}
                          className={`px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1.5 ${
                            adminActiveTab === "timeline"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/20"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Compass className="w-4 h-4 text-rose-400" />
                          Linha do Tempo ({draftTimeline.length})
                        </button>
                      </div>

                      {/* ADMIN TAB 1: HER REPLIES */}
                      {adminActiveTab === "replies" && (
                        <div className="space-y-4">
                          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                            <h3 className="font-serif text-lg font-semibold text-rose-200">Mensagens Recebidas 💌</h3>
                            <p className="text-xs text-slate-400 mt-1">
                              Esta é a caixa secreta contendo os recados que sua ex-namorada escreveu no formulário do portal. Apenas você consegue visualizá-los.
                            </p>
                          </div>

                          <div className="space-y-3">
                            {adminData?.replies && adminData.replies.length > 0 ? (
                              adminData.replies.map((reply) => (
                                <motion.div
                                  key={reply.id}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="bg-slate-900/80 border border-rose-500/15 rounded-2xl p-5 shadow-md hover:border-rose-400/30 transition-all relative overflow-hidden"
                                >
                                  {/* Left decor stamp bar */}
                                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-500 to-pink-500" />
                                  <div className="flex justify-between items-start gap-4 mb-2 pl-2">
                                    <span className="text-[10px] font-mono font-bold text-rose-400 flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {reply.timestamp}
                                    </span>
                                  </div>
                                  <p className="text-slate-200 text-sm md:text-base leading-relaxed pl-2 select-text font-sans break-words bg-slate-950/30 rounded-xl p-3 border border-slate-800/80">
                                    {reply.text}
                                  </p>
                                </motion.div>
                              ))
                            ) : (
                              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-10 text-center text-slate-500 italic text-sm">
                                <Inbox className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                                Nenhuma resposta escrita por ela ainda. Avise-a quando o site estiver pronto!
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ADMIN TAB 2: PORTAL CONFIGS */}
                      {adminActiveTab === "config" && draftConfig && (
                        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md space-y-5">
                          <h3 className="font-serif text-lg text-rose-200 pb-3 border-b border-slate-850">
                            Ajustes Básicos do Portal
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-semibold">
                                Seu Nome (Escritor)
                              </label>
                              <input
                                type="text"
                                value={draftConfig.coupleName1}
                                onChange={(e) => setDraftConfig({ ...draftConfig, coupleName1: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-semibold">
                                Nome Delas (Ex-namorada / Leitora)
                              </label>
                              <input
                                type="text"
                                value={draftConfig.coupleName2}
                                onChange={(e) => setDraftConfig({ ...draftConfig, coupleName2: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs font-mono uppercase text-slate-400 font-semibold">
                              Texto de Introdução (Explicando o motivo do espaço):
                            </label>
                            <textarea
                              rows={3}
                              value={draftConfig.introText}
                              onChange={(e) => setDraftConfig({ ...draftConfig, introText: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-400 rounded-xl p-3 text-xs text-slate-100 outline-none"
                            />
                          </div>

                          {/* Security gate locks */}
                          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                            <h4 className="text-xs font-semibold text-rose-300 font-mono flex items-center gap-1.5 uppercase">
                              <Lock className="w-4 h-4" />
                              Portão de Segurança (Para que apenas ela entre):
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="block text-[11px] font-mono text-slate-400 font-medium">
                                  Pergunta Secreta:
                                </label>
                                <input
                                  type="text"
                                  value={draftConfig.securityQuestion}
                                  onChange={(e) => setDraftConfig({ ...draftConfig, securityQuestion: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-850 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[11px] font-mono text-slate-400 font-medium">
                                  Resposta Correta (Tudo em letras minúsculas):
                                </label>
                                <input
                                  type="text"
                                  value={draftConfig.securityAnswer}
                                  onChange={(e) => setDraftConfig({ ...draftConfig, securityAnswer: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-850 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[11px] font-mono text-slate-400 font-medium">
                                Dica de Resposta (Ficará visível caso ela esqueça):
                              </label>
                              <input
                                type="text"
                                value={draftConfig.hint}
                                onChange={(e) => setDraftConfig({ ...draftConfig, hint: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-850 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
                              />
                            </div>
                          </div>

                          {/* Music configuration */}
                          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                            <h4 className="text-xs font-semibold text-rose-300 font-mono flex items-center gap-1.5 uppercase">
                              <Music className="w-4 h-4" />
                              Trilha Sonora de Fundo (.MP3 ou YouTube)
                            </h4>

                            {/* MP3 Upload Zone */}
                            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                              <span className="text-[11px] font-mono text-rose-300 font-semibold block uppercase">
                                Opção 1: Enviar música MP3 (.mp3)
                              </span>
                              
                              <p className="text-xs text-slate-400">
                                Escolha uma linda música MP3 do seu computador ou celular. Ela será salva diretamente no site e tocará de fundo no portal!
                              </p>

                              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-rose-500/40 rounded-xl p-6 transition-all bg-slate-950/40 relative group">
                                <input
                                  id="mp3-file-input"
                                  type="file"
                                  accept="audio/mp3,audio/mpeg"
                                  onChange={handleAudioUpload}
                                  disabled={isUploadingAudio}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                />
                                
                                <Upload className={`w-8 h-8 text-rose-400 mb-2 ${isUploadingAudio ? "animate-bounce" : "group-hover:scale-110 transition-transform"}`} />
                                <span className="text-xs font-medium text-slate-300 text-center">
                                  {isUploadingAudio ? "Enviando arquivo MP3..." : "Clique ou arraste um arquivo MP3 aqui"}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-1">
                                  Suporta arquivos de até 15MB
                                </span>
                              </div>

                              {audioUploadError && (
                                <p className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-lg p-2 mt-2">
                                  ✕ {audioUploadError}
                                </p>
                              )}

                              {audioUploadSuccess && (
                                <p className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 mt-2">
                                  ✓ Seu arquivo MP3 foi carregado e adicionado com sucesso!
                                </p>
                              )}
                              
                              {draftConfig.musicUrl && draftConfig.musicUrl.startsWith("/uploads/") && (
                                <div className="text-xs text-slate-400 flex items-center gap-2 bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
                                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                                  <span>
                                    Música ativa atual: <strong>{draftConfig.songTitle}</strong> (Salva localmente)
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Separator */}
                            <div className="flex items-center my-3">
                              <hr className="flex-1 border-slate-800" />
                              <span className="px-3 text-[10px] font-mono text-slate-500 uppercase">ou</span>
                              <hr className="flex-1 border-slate-800" />
                            </div>

                            {/* YouTube Optional Fallback */}
                            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 space-y-2">
                              <span className="text-[11px] font-mono text-slate-400 block uppercase font-semibold">
                                Opção 2: Usar vídeo ou música do YouTube
                              </span>
                              
                              <div className="space-y-1">
                                <label className="block text-[11px] font-mono text-slate-400">
                                  Link ou ID do Vídeo do YouTube (Exemplo instrumental suave ou canção de vocês):
                                </label>
                                <input
                                  type="text"
                                  value={draftConfig.musicUrl}
                                  onChange={(e) => setDraftConfig({ ...draftConfig, musicUrl: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-850 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
                                  placeholder="https://www.youtube.com/embed/..."
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div className="space-y-1">
                                <label className="block text-[11px] font-mono text-slate-400">
                                  Título de Exibição da Música:
                                </label>
                                <input
                                  type="text"
                                  value={draftConfig.songTitle}
                                  onChange={(e) => setDraftConfig({ ...draftConfig, songTitle: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-850 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[11px] font-mono text-slate-400">
                                  Artista / Cantor / Descrição:
                                </label>
                                <input
                                  type="text"
                                  value={draftConfig.songArtist}
                                  onChange={(e) => setDraftConfig({ ...draftConfig, songArtist: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-850 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Credentials for Admin Password */}
                          <div className="p-4 bg-rose-950/10 rounded-xl border border-rose-500/10">
                            <label className="block text-xs font-mono uppercase text-rose-300 font-semibold mb-1">
                              Alterar Senha do Escritor:
                            </label>
                            <input
                              type="text"
                              value={draftConfig.writerPassword}
                              onChange={(e) => setDraftConfig({ ...draftConfig, writerPassword: e.target.value })}
                              className="bg-slate-950 border border-slate-800 focus:border-rose-400 rounded-xl px-3 py-2 text-xs text-slate-105 outline-none max-w-xs w-full"
                            />
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block font-mono mb-2">
                              Lembre de clicar em &quot;Salvar Alterações&quot; no topo após fazer mudanças.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* ADMIN TAB 3: MANAGE LETTERS */}
                      {adminActiveTab === "letters" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                            <div>
                              <h3 className="font-serif text-lg font-semibold text-rose-200">Gerenciar suas Cartas</h3>
                              <p className="text-xs text-slate-400 mt-1">
                                Redija, edite ou remova cartas que aparecerão no baú da sua ex-namorada.
                              </p>
                            </div>
                            <button
                              onClick={handleAddLetterDraft}
                              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs py-2 px-3.5 rounded-xl cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Nova Carta
                            </button>
                          </div>

                          <div className="space-y-4">
                            {draftLetters.map((letter) => (
                              <div
                                key={letter.id}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden"
                              >
                                {editingLetterId === letter.id ? (
                                  /* Edit View */
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wide">
                                      Editando Carta
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-slate-400 uppercase">
                                          Título da Carta/Envelope:
                                        </label>
                                        <input
                                          type="text"
                                          value={letter.title}
                                          onChange={(e) => {
                                            const updated = draftLetters.map((l) =>
                                              l.id === letter.id ? { ...l, title: e.target.value } : l
                                            );
                                            setDraftLetters(updated);
                                          }}
                                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-105 outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-slate-400 uppercase">
                                          Data / Subtítulo:
                                        </label>
                                        <input
                                          type="text"
                                          value={letter.date}
                                          onChange={(e) => {
                                            const updated = draftLetters.map((l) =>
                                              l.id === letter.id ? { ...l, date: e.target.value } : l
                                            );
                                            setDraftLetters(updated);
                                          }}
                                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-105 outline-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-slate-400 uppercase">
                                          Tom / Sentimento:
                                        </label>
                                        <select
                                          value={letter.mood}
                                          onChange={(e) => {
                                            const updated = draftLetters.map((l) =>
                                              l.id === letter.id
                                                ? {
                                                    ...l,
                                                    mood: e.target.value as
                                                      | "romantic"
                                                      | "poetic"
                                                      | "sorry"
                                                      | "nostalgic"
                                                      | "hopeful",
                                                  }
                                                : l
                                            );
                                            setDraftLetters(updated);
                                          }}
                                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
                                        >
                                          <option value="romantic">Romântico</option>
                                          <option value="poetic">Poético</option>
                                          <option value="sorry">Pedido de Desculpas / Sincero</option>
                                          <option value="nostalgic">Saudoso / Nostálgico</option>
                                          <option value="hopeful">Esperançoso</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] font-mono text-slate-400 uppercase">
                                        Conteúdo Sincero da Carta (Suporta quebras de linha):
                                      </label>
                                      <textarea
                                        rows={8}
                                        value={letter.content}
                                        onChange={(e) => {
                                          const updated = draftLetters.map((l) =>
                                            l.id === letter.id ? { ...l, content: e.target.value } : l
                                          );
                                          setDraftLetters(updated);
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none leading-relaxed font-sans"
                                      />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                      <button
                                        onClick={() => setEditingLetterId(null)}
                                        className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs py-2 px-3.5 rounded-lg cursor-pointer flex items-center gap-1"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Concluir Rascunho</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Display View */
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-[10px] font-mono uppercase bg-slate-805 text-rose-350 border border-slate-800 px-2 py-0.5 rounded-full font-bold">
                                          {letter.date}
                                        </span>
                                        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                                          Sentimento: {letter.mood}
                                        </span>
                                      </div>
                                      <h4 className="font-serif text-base text-rose-100 font-semibold">
                                        {letter.title}
                                      </h4>
                                      <p className="text-xs text-slate-400 mt-2 pl-1 max-w-xl line-clamp-3 leading-relaxed italic text-justify">
                                        &ldquo;{letter.content}&rdquo;
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setEditingLetterId(letter.id)}
                                        className="bg-slate-850 hover:bg-slate-800 p-2 rounded-xl text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                                        title="Editar Carta"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>

                                      <button
                                        onClick={() => {
                                          if (confirm("Quer mesmo apagar esta carta definitivamente?")) {
                                            setDraftLetters(draftLetters.filter((l) => l.id !== letter.id));
                                          }
                                        }}
                                        className="bg-slate-850 hover:bg-rose-950/40 p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                        title="Apagar Carta"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}

                            {draftLetters.length === 0 && (
                              <p className="text-center text-slate-500 text-xs italic py-10">
                                Toque no botão superior para criar a sua primeira carta sentimental.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ADMIN TAB 4: TIMELINE */}
                      {adminActiveTab === "timeline" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                            <div>
                              <h3 className="font-serif text-lg font-semibold text-rose-200">Guardar Linha do Tempo</h3>
                              <p className="text-xs text-slate-400 mt-1">
                                Adicione os seus marcos preferidos para relembrar momentos lindos do relacionamento.
                              </p>
                            </div>
                            <button
                              onClick={handleAddTimelineDraft}
                              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs py-2 px-3.5 rounded-xl cursor-pointer flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Novo Marco
                            </button>
                          </div>

                          <div className="space-y-4">
                            {draftTimeline.map((item) => (
                              <div
                                key={item.id}
                                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden"
                              >
                                {editingTimelineId === item.id ? (
                                  /* Editing mode */
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wide">
                                      Editando Marco do Relacionamento
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-slate-400 uppercase">
                                          Título do Momento:
                                        </label>
                                        <input
                                          type="text"
                                          value={item.title}
                                          onChange={(e) => {
                                            const updated = draftTimeline.map((t) =>
                                              t.id === item.id ? { ...t, title: e.target.value } : t
                                            );
                                            setDraftTimeline(updated);
                                          }}
                                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-105 outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-slate-400 uppercase">
                                          Data ou Época do Acontecimento:
                                        </label>
                                        <input
                                          type="text"
                                          value={item.date}
                                          onChange={(e) => {
                                            const updated = draftTimeline.map((t) =>
                                              t.id === item.id ? { ...t, date: e.target.value } : t
                                            );
                                            setDraftTimeline(updated);
                                          }}
                                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-105 outline-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-slate-400 uppercase">
                                          Estilo do Ícone Visual:
                                        </label>
                                        <select
                                          value={item.icon || "Heart"}
                                          onChange={(e) => {
                                            const updated = draftTimeline.map((t) =>
                                              t.id === item.id ? { ...t, icon: e.target.value } : t
                                            );
                                            setDraftTimeline(updated);
                                          }}
                                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none"
                                        >
                                          <option value="Heart">Coração de Amor (Vermelho)</option>
                                          <option value="Sparkles">Estrelas Brilhantes (Dourado)</option>
                                          <option value="Compass">Bússola / Aventura (Azul)</option>
                                          <option value="MessageCircle">Balão de Conversa (Verde)</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] font-mono text-slate-400 uppercase">
                                        Descrição Sentimental Detalhada:
                                      </label>
                                      <textarea
                                        rows={4}
                                        value={item.description}
                                        onChange={(e) => {
                                          const updated = draftTimeline.map((t) =>
                                            t.id === item.id ? { ...t, description: e.target.value } : t
                                          );
                                          setDraftTimeline(updated);
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-105 outline-none font-sans"
                                      />
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                      <button
                                        onClick={() => setEditingTimelineId(null)}
                                        className="bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold text-xs py-2 px-3.5 rounded-lg cursor-pointer flex items-center gap-1"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Concluir Rascunho</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Display mode */
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <span className="inline-block text-[10px] font-mono font-bold bg-slate-800 p-1.5 px-3 rounded-full text-rose-300 mb-2">
                                        📅 {item.date}
                                      </span>
                                      <h4 className="font-serif text-base text-rose-100 font-semibold">
                                        {item.title}
                                      </h4>
                                      <p className="text-xs text-slate-450 mt-1 pl-1 line-clamp-3 leading-relaxed">
                                        {item.description}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setEditingTimelineId(item.id)}
                                        className="bg-slate-850 hover:bg-slate-800 p-2 rounded-xl text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
                                        title="Editar Marco"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>

                                      <button
                                        onClick={() => {
                                          if (confirm("Tem certeza que deseja de apagar esta lembrança?")) {
                                            setDraftTimeline(draftTimeline.filter((t) => t.id !== item.id));
                                          }
                                        }}
                                        className="bg-slate-850 hover:bg-rose-950/40 p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                        title="Apagar Marco"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}

                            {draftTimeline.length === 0 && (
                              <p className="text-center text-slate-500 text-xs italic py-10">
                                Escreva a primeira lembrança sentimental da sua linha do tempo no botão superior.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>



    </div>
  );
}
