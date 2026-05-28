import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Lock,
  Mail,
  MailOpen,
  Sparkles,
  Compass,
  MessageCircle,
  Clock,
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Cat
} from "lucide-react";
import { Letter, TimelineEvent, StoryConfig } from "../types";
import AudioPlayer from "./AudioPlayer";
import { staticStoryData } from "../staticData";

interface ImageWithFallbackProps {
  index: number;
  alt: string;
}

function ImageWithFallback({ index, alt }: ImageWithFallbackProps) {
  const extensions = ["jpg", "png", "jpeg", "webp"];
  const [extIndex, setExtIndex] = useState(0);
  const src = `/assets/.aistudio/attachment-${index}.${extensions[extIndex]}`;

  const handleError = () => {
    if (extIndex < extensions.length - 1) {
      setExtIndex((prev) => prev + 1);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      onError={handleError}
      className="w-full h-auto max-h-[400px] rounded-xl object-cover hover:scale-[1.02] transition-transform duration-300 shadow-md"
      referrerPolicy="no-referrer"
    />
  );
}

interface VisitorPortalProps {
  publicConfig: {
    question: string;
    hint: string;
    coupleName1: string;
    coupleName2: string;
    introText: string;
  };
  onUnlockSuccess: (data: { letters: Letter[]; timeline: TimelineEvent[]; config: StoryConfig }) => void;
}

export default function VisitorPortal({ publicConfig, onUnlockSuccess }: VisitorPortalProps) {
  // Gate Phase States
  const [answer, setAnswer] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showHint, setShowHint] = useState(false);

  // Unlocked States
  const [sessionLetters, setSessionLetters] = useState<Letter[]>([]);
  const [sessionTimeline, setSessionTimeline] = useState<TimelineEvent[]>([]);
  const [sessionConfig, setSessionConfig] = useState<StoryConfig | null>(null);

  // Active viewing state
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [activeLetterPage, setActiveLetterPage] = useState(0);
  const [readLetterIds, setReadLetterIds] = useState<string[]>([]);
  const [letterSpecialActionOpen, setLetterSpecialActionOpen] = useState(false);
  const [specialActionChoice, setSpecialActionChoice] = useState<"punch" | "hug" | null>(null);
  const [specialNoticeOpen, setSpecialNoticeOpen] = useState(false);
  
  // Custom response state
  const [typedReply, setTypedReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  // Active section tracker
  const [activeTab, setActiveTab] = useState<"letters" | "timeline" | "last_act" | "baby">("letters");

  const [showEntranceNotice, setShowEntranceNotice] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsUnlocked(true);
        setSessionLetters(data.letters);
        setSessionTimeline(data.timeline);
        setSessionConfig(data.config);
        onUnlockSuccess(data);
        setShowEntranceNotice(true);
      } else {
        const normalizedAnswer = answer.trim().toLowerCase();
        const correctAnswer = staticStoryData.config.securityAnswer.trim().toLowerCase();
        if (normalizedAnswer === correctAnswer) {
          setIsUnlocked(true);
          setSessionLetters(staticStoryData.letters);
          setSessionTimeline(staticStoryData.timeline);
          setSessionConfig(staticStoryData.config);
          onUnlockSuccess(staticStoryData);
          setShowEntranceNotice(true);
        } else {
          setErrorMsg(data.error || "Algo deu errado. Verifique a resposta e tente novamente.");
        }
      }
    } catch (err) {
      const normalizedAnswer = answer.trim().toLowerCase();
      const correctAnswer = staticStoryData.config.securityAnswer.trim().toLowerCase();
      if (normalizedAnswer === correctAnswer) {
        setIsUnlocked(true);
        setSessionLetters(staticStoryData.letters);
        setSessionTimeline(staticStoryData.timeline);
        setSessionConfig(staticStoryData.config);
        onUnlockSuccess(staticStoryData);
        setShowEntranceNotice(true);
      } else {
        setErrorMsg("Resposta incorreta. Dica: " + staticStoryData.config.hint);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLetterClick = (letter: Letter) => {
    setSelectedLetter(letter);
    setActiveLetterPage(0);
    setLetterSpecialActionOpen(false);
    setSpecialActionChoice(null);
    if (!readLetterIds.includes(letter.id)) {
      setReadLetterIds([...readLetterIds, letter.id]);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedReply.trim()) return;

    setReplyLoading(true);
    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: typedReply }),
      });

      if (res.ok) {
        setReplySuccess(true);
        setTypedReply("");
        setTimeout(() => setReplySuccess(false), 6000);
      } else {
        // Fallback gracefully so she isn't blocked by database failure errors
        const localReplies = JSON.parse(localStorage.getItem("couple_local_replies") || "[]");
        localReplies.push({ text: typedReply, timestamp: new Date().toISOString() });
        localStorage.setItem("couple_local_replies", JSON.stringify(localReplies));

        setReplySuccess(true);
        setTypedReply("");
        setTimeout(() => setReplySuccess(false), 6000);
      }
    } catch (err) {
      // Fallback gracefully so she isn't blocked by database failure errors
      const localReplies = JSON.parse(localStorage.getItem("couple_local_replies") || "[]");
      localReplies.push({ text: typedReply, timestamp: new Date().toISOString() });
      localStorage.setItem("couple_local_replies", JSON.stringify(localReplies));

      setReplySuccess(true);
      setTypedReply("");
      setTimeout(() => setReplySuccess(false), 6000);
    } finally {
      setReplyLoading(false);
    }
  };

  const getTimelineIcon = (iconName: string = "") => {
    switch (iconName) {
      case "Sparkles":
        return <Sparkles className="w-5 h-5 text-amber-300" />;
      case "Heart":
        return <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />;
      case "Compass":
        return <Compass className="w-5 h-5 text-sky-400" />;
      case "MessageCircle":
        return <MessageCircle className="w-5 h-5 text-emerald-400" />;
      default:
        return <Heart className="w-5 h-5 text-rose-300" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-8 font-sans relative z-10">
      
      {/* 1. LOCK SCREEN / ENTRANCE GATE */}
      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div
            key="lock-gate"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-lg mt-10 md:mt-16 text-center"
          >
            {/* Header Greeting */}
            <div className="mb-8">
              <span className="inline-block p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse mb-4">
                <Heart className="w-7 h-7 fill-current" />
              </span>

              <p id="space-subtitle-text" className="text-xs uppercase tracking-widest text-slate-400/80 font-mono">
                Um espaço feito somente para você
              </p>
              <div id="orange-cat-container" className="flex justify-center mt-4">
                <img
                  id="smiling-orange-cat"
                  src="https://img2.lovecell.com.br/b7a0e2fde2ab44c7a2ea5af2d4bf0128cb9a5ed744d128550a560e604246e4df.webp"
                  alt="Gatinho sorridente"
                  referrerPolicy="no-referrer"
                  className="w-32 h-32 rounded-2xl border border-rose-500/20 shadow-lg object-cover hover:scale-105 transition-transform duration-300 pointer-events-none"
                />
              </div>
            </div>

            {/* Main Welcome Envelope Box */}
            <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-left mb-6">
              {/* Decorative soft corners */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none rounded-tr-2xl" />

              {publicConfig.introText && (
                <p className="text-slate-300 leading-relaxed text-sm md:text-base mb-6 font-serif italic text-justify">
                  &ldquo;{publicConfig.introText}&rdquo;
                </p>
              )}

              <form onSubmit={handleUnlock} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-rose-300 mb-2 font-mono flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Pergunta de Segurança Especial:
                  </label>
                  <p className="text-slate-200 text-sm font-medium mb-3 pl-1">
                    {publicConfig.question}
                  </p>
                  
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      if (errorMsg) setErrorMsg("");
                    }}
                    placeholder="Digite sua resposta aqui..."
                    className="w-full bg-slate-950/60 border border-slate-700/60 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 rounded-xl px-4 py-3 text-slate-100 text-sm transition-all outline-none"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Hints and Errors */}
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2 text-rose-300 text-xs"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {/* Show Hint Option */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer select-none underline inline-flex items-center gap-1 font-mono"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showHint ? "Ocultar dica" : "Precisa de uma dica?"}
                  </button>
                </div>

                {showHint && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800 italic"
                  >
                    {publicConfig.hint}
                  </motion.p>
                )}

                {/* Entry Action */}
                <button
                  type="submit"
                  disabled={loading || !answer.trim()}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:from-slate-800 disabled:to-slate-800 text-white font-medium text-sm py-3 px-4 rounded-xl shadow-lg shadow-rose-900/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      <span>Destrancar e Entrar</span>
                      <Heart className="w-4 h-4 fill-current ml-0.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="text-slate-500 text-[11px] font-mono select-none">
              Iniciado carinhosamente. Um diário de sentimentos.
            </p>
          </motion.div>
        ) : (
          
          /* 2. THE SECRET PORTAL (UNLOCKED) */
          <motion.div
            key="story-portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl space-y-8 pb-20 mt-4"
          >
            {/* Ambient Background Audio */}
            {sessionConfig && (
              <div className="w-full flex justify-end">
                <AudioPlayer
                  musicUrl={sessionConfig.musicUrl}
                  songTitle={sessionConfig.songTitle}
                  songArtist={sessionConfig.songArtist}
                  forceAutoplay={true}
                />
              </div>
            )}

            {/* Small Top Floating Heading */}
            <header className="w-full flex justify-center border-b border-rose-500/10 pb-6 px-2">
              {/* Minimal Nav / Sections changer - 2x2 grid on mobile, inline flex row on md screens */}
              <div className="grid grid-cols-2 md:flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 w-full md:w-auto max-w-md md:max-w-none mx-auto">
                <button
                  onClick={() => setActiveTab("letters")}
                  className={`px-2 py-2.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 w-full md:w-auto ${
                    activeTab === "letters"
                      ? "bg-rose-500/10 text-rose-300 border border-rose-500/20 shadow-inner"
                      : "text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
                  <span className="truncate">Cartas Sentimentais</span>
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`px-2 py-2.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 w-full md:w-auto ${
                    activeTab === "timeline"
                      ? "bg-rose-500/10 text-rose-300 border border-rose-500/20 shadow-inner"
                      : "text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
                  <span className="truncate">Nossa Linha do Tempo</span>
                </button>
                <button
                  onClick={() => setActiveTab("last_act")}
                  className={`px-2 py-2.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 w-full md:w-auto ${
                    activeTab === "last_act"
                      ? "bg-rose-500/10 text-rose-300 border border-rose-500/20 shadow-inner"
                      : "text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 fill-rose-500/20 shrink-0" />
                  <span className="truncate">Último Ato de Amor</span>
                </button>
                <button
                  onClick={() => setActiveTab("baby")}
                  className={`px-2 py-2.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 w-full md:w-auto ${
                    activeTab === "baby"
                      ? "bg-rose-500/10 text-rose-300 border border-rose-500/20 shadow-inner"
                      : "text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <Cat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
                  <span className="truncate">Nosso bebê</span>
                </button>
              </div>
            </header>

            {/* TAB CONTENT: 1. LETTERS DRAWER */}
            {activeTab === "letters" && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="text-center max-w-lg mx-auto">
                  <h3 className="font-serif text-lg text-rose-100 flex items-center justify-center gap-1.5">
                    <BookOpen className="w-4.5 h-4.5 text-rose-400" />
                    Gaveta com Minhas Cartas
                  </h3>
                </div>

                {/* Special Important Card */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSpecialNoticeOpen(true)}
                  className="bg-gradient-to-br from-rose-950/70 to-slate-900/90 border-2 border-rose-500/40 hover:border-rose-400/80 rounded-2xl p-6 cursor-pointer shadow-2xl text-center max-w-xl mx-auto transform transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center justify-center gap-2 text-rose-300 font-mono text-[10px] uppercase tracking-widest font-bold">
                    <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span>É de extrema importância</span>
                    <Sparkles className="w-4 h-4 text-rose-400 animate-pulse" />
                  </div>
                  <h4 className="font-serif text-lg md:text-xl font-bold text-rose-100 mt-2 flex items-center justify-center gap-2">
                    Clique aqui antes de começar a ler 💌
                  </h4>
                </motion.div>

                {/* Letters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sessionLetters.map((letter) => {
                    const isRead = readLetterIds.includes(letter.id);
                    return (
                      <motion.div
                        key={letter.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleLetterClick(letter)}
                        className={`border rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between h-40 shadow-md bg-slate-900/60 ${
                          isRead
                            ? "border-slate-800 text-slate-400"
                            : "border-rose-500/20 hover:border-rose-400/50 hover:bg-slate-950 text-rose-100"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-rose-300">
                              {letter.date}
                            </span>
                            {isRead ? (
                              <MailOpen className="w-4 h-4 text-slate-500" />
                            ) : (
                              <Mail className="w-4 h-4 text-rose-400 animate-pulse" />
                            )}
                          </div>
                          <h4 className={`text-base font-serif ${isRead ? "text-slate-300" : "text-rose-100 font-semibold"}`}>
                            {letter.title}
                          </h4>
                        </div>
                        <div className="flex items-center justify-end text-xs font-mono mt-4 pt-2 border-t border-slate-800/60">
                          <span className="text-rose-400/80 hover:underline flex items-center gap-1 font-sans text-[11px]">
                            Ler carta &rarr;
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Empty State */}
                {sessionLetters.length === 0 && (
                  <p className="text-center text-slate-500 text-xs italic py-10">
                    Nenhuma carta preenchida no momento.
                  </p>
                )}
              </motion.section>
            )}

            {/* TAB CONTENT: 2. TIMELINE */}
            {activeTab === "timeline" && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="text-center max-w-lg mx-auto mb-8">
                  <h3 className="font-serif text-lg text-rose-100 flex items-center justify-center gap-1.5">
                    <Compass className="w-4.5 h-4.5 text-rose-400" />
                    Linha do tempo
                  </h3>
                </div>

                {/* Elegant centered single-column layout for the timeline */}
                <div className="relative border-l-2 border-slate-800 max-w-2xl mx-auto pl-6 md:pl-10 space-y-10 md:space-y-12">
                  {sessionTimeline.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -15 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="relative group"
                    >
                      {/* Left timeline circle button */}
                      <span className="absolute -left-[37px] md:-left-[53px] top-1.5 w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-900 border border-rose-500/30 group-hover:border-rose-400 flex items-center justify-center transition-all bg-gradient-to-br from-slate-900 to-slate-950 shadow-md">
                        {getTimelineIcon(item.icon)}
                      </span>

                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                        <span className="inline-block text-xs font-mono font-semibold text-rose-400 bg-rose-500/5 px-2.5 py-0.5 rounded-full mb-2">
                          {item.date}
                        </span>
                        <h4 className="text-base font-serif text-rose-100 font-semibold mb-2">
                          {item.title}
                        </h4>
                        <p className="text-slate-350 text-sm leading-relaxed text-justify whitespace-pre-line">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {sessionTimeline.length === 0 && (
                    <p className="text-slate-500 text-xs italic py-10 pl-6 text-center">
                      Nenhuma lembrança adicionada na linha do tempo ainda.
                    </p>
                  )}
                </div>

                {/* ALWAYS VISIBLE Attention Note inside Timeline Tab */}
                <div className="pt-8 border-t border-slate-900/40">
                  <section className="bg-slate-900/80 border border-amber-500/15 rounded-2xl p-6 shadow-xl max-w-xl mx-auto space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-1 border-b border-amber-500/10 pb-3">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-semibold text-amber-300 font-bold">
                          Atenção 💌
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Uma nota especial
                        </p>
                      </div>
                    </div>

                    <div className="text-slate-300 text-xs md:text-sm leading-relaxed space-y-4 whitespace-pre-line text-justify font-sans">
                      <p>
                        Faltam linhas e espaço nesta tela para descrever tudo o que estou sentindo ao escrever isso. Gostaria de escrever muito mais e fazer muito mais aqui, porém não sei nem se você vai ler, e também não quero que passe tanto tempo lendo. Mas só quero que saiba que cada palavra, cada mensagem foi escrita 100% por mim, nesta madrugada quieta e vazia, onde, em todas as noites, meus pensamentos pensam em você.
                      </p>
                      <p>
                        Meu coração jamais ficaria em paz se eu não demonstrasse tudo o que sinto e tudo o que guardo no meu coração. Esta carta vai ficar online por muito tempo e espero que um dia você se lembre de quando eu prometi que iria te amar e jamais te abandonar, mesmo se você se tornasse outra pessoa ou até um bicho, kkk, como naquelas brincadeiras que você fazia.
                      </p>
                      <p>
                        Eu estaria ao seu lado independente de como você estivesse, porque eu não amei você pelo físico; eu amei e amo a sua alma.
                      </p>
                    </div>
                  </section>
                </div>
              </motion.section>
            )}

            {/* TAB CONTENT: 3. LAST ACT */}
            {activeTab === "last_act" && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="text-center max-w-lg mx-auto mb-8">
                  <h3 className="font-serif text-lg text-rose-100 flex items-center justify-center gap-1.5">
                    <Heart className="w-4.5 h-4.5 text-rose-400 fill-rose-500/20" />
                    Nosso Último Ato de Amor
                  </h3>
                </div>

                <div className="max-w-xl mx-auto">
                  {/* Card: "Meu Último Ato de Amor" */}
                  <section className="bg-slate-900/80 border border-rose-500/15 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-1 border-b border-rose-500/10 pb-3">
                      <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                        <Heart className="w-5 h-5 fill-rose-500/20" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-semibold text-rose-200 font-bold">
                          Meu Último Ato de Amor 🌹
                        </h4>
                      </div>
                    </div>

                    <div className="text-slate-300 text-xs md:text-sm leading-relaxed space-y-4 whitespace-pre-line text-justify font-sans">
                      <p>
                        Eu decidi hoje fazer isso como o meu último ato de amor. Hoje, o pessoal que estava comigo na hora da janta disse que, de tanto eu falar de você, eles sabem o quanto eu te amo e que eu deveria demonstrar todo esse sentimento. E aqui estou. Então, eu te dedico tudo isso como o meu último ato de amor por você.
                      </p>
                      <p>
                        Quero que você seja a mulher mais feliz deste mundo e realize o seu sonho de ser mãe, além dos seus sonhos profissionais. Que tudo dê muito certo em sua vida — e vai dar! Você tem um coração excelente, você é uma menina de ouro, Larissa. Deus vai te honrar e te abençoar muito.
                      </p>
                    </div>
                  </section>
                </div>
              </motion.section>
            )}

            {/* TAB CONTENT: 4. NOSSO BEBÊ */}
            {activeTab === "baby" && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="text-center max-w-lg mx-auto mb-8">
                  <h3 className="font-serif text-lg text-rose-100 flex items-center justify-center gap-1.5">
                    <Cat className="w-5 h-5 text-rose-400" />
                    Nosso Bebê
                  </h3>
                </div>

                <div className="max-w-xl mx-auto space-y-6">
                  {/* Photo Container on top of card */}
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="aspect-square overflow-hidden rounded-2xl border border-rose-500/15 bg-slate-900/60 p-1.5 shadow-xl hover:border-rose-500/30 transition-all duration-300">
                      <img
                        src="https://cdn.discordapp.com/attachments/1153073949744308418/1315864813146079273/rn_image_picker_lib_temp_59f2b9f5-332a-4123-9305-50046310af55.jpg?ex=6a18f71b&is=6a17a59b&hm=65993e8ea709b594488ae00281b07f5d78ee1e87d2faee1c0d762c675b327126&"
                        alt="Nossa Kiara"
                        className="w-full h-full object-cover rounded-xl hover:scale-[1.03] transition-transform duration-300 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="aspect-square overflow-hidden rounded-2xl border border-rose-500/15 bg-slate-900/60 p-1.5 shadow-xl hover:border-rose-500/30 transition-all duration-300">
                      <img
                        src="https://cdn.discordapp.com/attachments/1153073949744308418/1315865300209504317/rn_image_picker_lib_temp_addd951f-5966-4467-95ae-076bc185c98e.jpg?ex=6a18f78f&is=6a17a60f&hm=8ff85317c231df628b746732840e0aa7cc863938caa1ad770d194c2f6f366f91&"
                        alt="Close da Kiara"
                        className="w-full h-full object-cover rounded-xl hover:scale-[1.03] transition-transform duration-300 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Message Card */}
                  <section className="bg-slate-900/80 border border-rose-500/15 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-1 border-b border-rose-500/10 pb-3">
                      <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                        <Heart className="w-5 h-5 fill-rose-500/20" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-semibold text-rose-200 font-bold">
                          A Kiara, como esquecer dela? 🐾
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Uma lembrança doce e amorosa
                        </p>
                      </div>
                    </div>

                    <div className="text-slate-300 text-xs md:text-sm leading-relaxed space-y-4 whitespace-pre-line text-justify font-sans">
                      <p>
                        A Kiara, como esquecer dela? Eu lembro dela sempre, especialmente do dia em que a pegamos juntos, quando ela estava toda assustada. Eu pensei em te pedir uma foto dela no último dia em que conversamos, mas aquilo seria um gatilho enorme para mim, então preferi não pedir. Mas eu sinto tanta saudade dela, que você não tem noção. Hoje, pela primeira vez, reli uma conversa nossa e vi uma mensagem em que eu dizia que tinha visto uma foto sua, lembrado da Kiara e que estava com muita saudade dela, e aí você me mandou uma foto dela.
                      </p>
                      <p>
                        Lembro dos nossos planos com ela, da casa onde ela iria morar, de quando iríamos levá-la conosco, e do nosso plano de pegar mais gatos para fazer companhia a ela... Lembro de quando ela batia nos meus gatos, kkkkkkkkk, e de como ela era &quot;ruim&quot; comigo!
                      </p>
                      <p>
                        Lembro muito das brincadeiras que ela fazia no sofá, esperando alguém aparecer para ela pular.
                      </p>
                      <p className="border-t border-rose-500/10 pt-3 text-rose-200 font-semibold italic">
                        Eu sinto tanta saudade de tudo...
                      </p>
                    </div>
                  </section>
                </div>
              </motion.section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. EXPANDED LETTER OVERLAY MODAL */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            key="letter-overlay"
            id="letter-overlay-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#fcfaf2] text-[#2c241e] font-handwriting rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 shadow-2xl border-2 sm:border-4 border-amber-900/10 max-w-2xl w-full leading-relaxed relative my-4 sm:my-8 select-text"
              style={{
                backgroundImage: `radial-gradient(#ebe3cc 1px, transparent 1px)`,
                backgroundSize: "20px 20px"
              }}
            >
              {/* Envelope Retro Lines decoration */}
              <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-red-400 via-blue-400 to-red-400 rounded-t-lg opacity-40" />

              <div className="flex items-center justify-between border-b border-amber-900/20 pb-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest font-mono text-amber-900/60 font-semibold">
                    Carta Guardada
                  </p>
                  <p className="text-xs text-amber-900/80 font-mono mt-0.5">
                    Assunto: <span className="font-serif">{selectedLetter.date}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="w-10 h-10 rounded-full hover:bg-amber-900/10 flex items-center justify-center font-sans font-bold text-amber-900 text-lg cursor-pointer transition-all active:scale-95"
                  title="Fechar carta"
                >
                  ✕
                </button>
              </div>

              {/* Title of the Letter */}
              <h3 className="text-xl sm:text-2xl md:text-4xl text-[#3b2b1e] font-bold font-serif mb-4 md:mb-6 leading-tight border-b-2 border-amber-900/10 pb-2">
                {selectedLetter.title}
              </h3>

              {/* Paper Content with Dynamic Pagination */}
              {(() => {
                if (letterSpecialActionOpen) {
                  return (
                    <div className="space-y-4 sm:space-y-6 text-center animate-fadeIn py-2 sm:py-4">
                      <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 rounded-full flex items-center justify-center border-2 border-rose-300">
                        <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 fill-rose-500/20" />
                      </div>
                      
                      <p className="text-base sm:text-lg md:text-2xl text-[#3d2e20] font-bold font-serif leading-relaxed px-1 sm:px-2">
                        Todas mensagens que voce leu, tudo foi escrito por mim, foram mais de 3horas escrevendo as mensagens com todo meu coraçao, quero que saiba disso.
                      </p>
                      
                      <p className="text-sm sm:text-base md:text-xl text-rose-700 font-semibold italic">
                        E por fim voce pode escolher kkkk
                      </p>

                      <div className="bg-white/90 border-2 border-amber-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 max-w-lg mx-auto shadow-md">
                        <p className="font-sans not-italic text-sm sm:text-base text-slate-900 font-semibold leading-relaxed select-text">
                          (Juro por tudo, que eu nao saberei qual voce escolheu, nao programei nada disso, nem vou saber se voce acessou o site ou nao, se voce leu ou nao, ou até mesmo qual a baixo voce escolheu, pode confiar em mim)
                        </p>
                      </div>

                      {/* Interactive Option Selector */}
                      {!specialActionChoice ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm mx-auto mt-4 sm:mt-6">
                          <button
                            type="button"
                            onClick={() => setSpecialActionChoice("punch")}
                            className="flex flex-col items-center justify-center p-3 sm:p-4 bg-[#fcf5e3] rounded-xl sm:rounded-2xl border-2 border-amber-900/10 hover:border-amber-900/30 hover:bg-[#faeed1] active:scale-95 transition-all text-[#3b2b1e] cursor-pointer"
                          >
                            <span className="text-2xl sm:text-4xl mb-1 sm:mb-2">🥊</span>
                            <span className="font-semibold text-sm sm:text-lg">Dar um Soco</span>
                            <span className="text-[10px] sm:text-xs text-amber-900/60 mt-0.5 sm:mt-1">Brincadeira carinhosa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSpecialActionChoice("hug")}
                            className="flex flex-col items-center justify-center p-3 sm:p-4 bg-[#fcf5e3] rounded-xl sm:rounded-2xl border-2 border-amber-900/10 hover:border-[#f43f5e]/30 hover:bg-rose-50 active:scale-95 transition-all text-[#3b2b1e] cursor-pointer"
                          >
                            <span className="text-2xl sm:text-4xl mb-1 sm:mb-2">🤗</span>
                            <span className="font-semibold text-sm sm:text-lg">Dar um Abraço</span>
                            <span className="text-[10px] sm:text-xs text-amber-900/60 mt-0.5 sm:mt-1">Gesto carinhoso</span>
                          </button>
                        </div>
                      ) : (
                        <div className="mt-8 space-y-8">
                          {/* ANIMATIONS */}
                          {specialActionChoice === "punch" ? (
                            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                              <div className="relative flex items-center justify-center gap-6 sm:gap-12 h-26 sm:h-36 w-full max-w-xs mx-auto overflow-visible bg-[#fbf8ed] rounded-2xl border border-amber-900/5 p-4">
                                {/* Left avatar: Her punching */}
                                <motion.div
                                  animate={{ 
                                    x: [0, 25, 0],
                                    rotate: [0, 10, -5, 0]
                                  }}
                                  transition={{ 
                                    repeat: Infinity,
                                    repeatType: "loop",
                                    duration: 1.5,
                                    ease: "easeInOut"
                                  }}
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-pink-100 border-2 border-pink-300 flex items-center justify-center shadow-md text-2xl sm:text-3xl font-bold select-none relative z-10"
                                >
                                  👸
                                  <div className="absolute -top-2 -right-1 sm:-top-3 sm:-right-2 text-xs sm:text-base">🥊</div>
                                </motion.div>

                                {/* Middle Hit Pow */}
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ 
                                    scale: [0, 1.1, 0],
                                    opacity: [0, 1, 0]
                                  }}
                                  transition={{ 
                                    repeat: Infinity, 
                                    duration: 1.5,
                                    delay: 0.3,
                                    ease: "easeOut"
                                  }}
                                  className="absolute left-1/2 -translate-x-1/2 text-lg sm:text-2xl font-bold text-yellow-500 font-mono pointer-events-none select-none z-20"
                                >
                                  💥 POW!
                                </motion.div>

                                {/* Right avatar: Him punched */}
                                <motion.div
                                  animate={{ 
                                    x: [0, 8, -3, 0],
                                    rotate: [0, -15, 10, 0],
                                    scale: [1, 0.95, 1.05, 1]
                                  }}
                                  transition={{ 
                                    repeat: Infinity,
                                    repeatType: "loop",
                                    duration: 1.5,
                                    ease: "easeInOut"
                                  }}
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center shadow-md text-2xl sm:text-3xl font-bold select-none relative z-10"
                                >
                                  🥺
                                  <div className="absolute -top-2 -left-1 sm:-top-3 sm:-left-2 text-xs sm:text-sm text-yellow-500 select-none animate-spin">💫</div>
                                </motion.div>
                              </div>
                              
                              <p className="text-sm sm:text-base text-amber-900/80 font-medium italic">
                                Ai! Hahaha, levei um soco merecido! 🥊🤕
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                              <div className="relative flex items-center justify-center gap-2 sm:gap-4 h-26 sm:h-36 w-full max-w-xs mx-auto overflow-hidden bg-[#fbf8ed] rounded-2xl border border-amber-900/5 p-4">
                                {/* Left avatar: Her */}
                                <motion.div
                                  animate={{ 
                                    x: [0, 12, 0],
                                    rotate: [0, 8, 0]
                                  }}
                                  transition={{ 
                                    repeat: Infinity,
                                    repeatType: "loop",
                                    duration: 2,
                                    ease: "easeInOut"
                                  }}
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-pink-100 border-2 border-pink-300 flex items-center justify-center shadow-md text-2xl sm:text-3xl font-bold select-none relative z-10"
                                >
                                  👸
                                </motion.div>

                                {/* Floating Hearts */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                                  {[1, 2, 3].map((i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ y: 20, opacity: 0, scale: 0.5 }}
                                      animate={{ 
                                        y: -40, 
                                        opacity: [0, 1, 0],
                                        scale: [0.5, 1.2, 0.8],
                                        x: Math.sin(i) * 15
                                      }}
                                      transition={{ 
                                        repeat: Infinity,
                                        duration: 2,
                                        delay: i * 0.6,
                                        ease: "easeOut"
                                      }}
                                      className="absolute text-sm sm:text-xl pb-2"
                                    >
                                      ❤️
                                    </motion.div>
                                  ))}
                                </div>

                                {/* Right avatar: Him hugging */}
                                <motion.div
                                  animate={{ 
                                    x: [0, -12, 0],
                                    rotate: [0, -8, 0]
                                  }}
                                  transition={{ 
                                    repeat: Infinity,
                                    repeatType: "loop",
                                    duration: 2,
                                    ease: "easeInOut"
                                  }}
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center shadow-md text-2xl sm:text-3xl font-bold select-none relative z-10"
                                >
                                  🥺
                                </motion.div>
                              </div>
                              
                              <p className="text-sm sm:text-base text-rose-700 font-medium italic animate-pulse">
                                Um abraço bem quentinho e cheio de carinho! 🤗❤️
                              </p>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setSpecialActionChoice(null)}
                            className="bg-transparent border-0 text-xs text-amber-900/60 hover:text-rose-600 underline cursor-pointer select-none font-mono"
                          >
                            Mudar de ideia e escolher outra opção
                          </button>
                        </div>
                      )}

                      <div className="pt-6 border-t border-amber-900/10 mt-8 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLetter(null);
                            setLetterSpecialActionOpen(false);
                            setSpecialActionChoice(null);
                            setActiveTab("letters");
                          }}
                          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
                        >
                          Voltar
                        </button>
                      </div>
                    </div>
                  );
                }

                const pages = selectedLetter.content.split("[PAGE]");
                const currentPageContent = pages[activeLetterPage] || pages[0] || "";
                return (
                  <>
                    <div className="space-y-4 sm:space-y-5 font-sans text-slate-900 text-[15px] sm:text-base md:text-lg text-justify whitespace-pre-line leading-[1.65] sm:leading-[1.75] min-h-[220px] sm:min-h-[300px] tracking-normal antialiased font-normal">
                      {currentPageContent}
                    </div>

                    {/* Pagination Indicators at the bottom of the content */}
                    {pages.length > 1 && (
                      <div className="flex flex-col border-t border-amber-900/20 pt-4 mt-8 select-none space-y-4">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            disabled={activeLetterPage === 0}
                            onClick={() => {
                              setActiveLetterPage((prev) => Math.max(0, prev - 1));
                              // Smooth scroll up within the paper modal
                              const modal = document.getElementById("letter-overlay-modal");
                              if (modal) modal.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="px-3 py-1.5 text-xs md:text-sm bg-amber-950/5 hover:bg-amber-950/10 border border-amber-900/20 text-[#3b2b1e] font-semibold rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-colors duration-200 cursor-pointer"
                          >
                            &larr; Anterior
                          </button>
                          
                          <span className="text-xs md:text-sm font-mono text-amber-900/70 font-bold">
                            Página {activeLetterPage + 1} de {pages.length}
                          </span>

                          <button
                            type="button"
                            disabled={activeLetterPage === pages.length - 1}
                            onClick={() => {
                              setActiveLetterPage((prev) => Math.min(pages.length - 1, prev + 1));
                              // Smooth scroll up within the paper modal
                              const modal = document.getElementById("letter-overlay-modal");
                              if (modal) modal.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="px-3 py-1.5 text-xs md:text-sm bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl border border-rose-700/10 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-200 cursor-pointer"
                          >
                            Próxima &rarr;
                          </button>
                        </div>

                        {/* Clique Aqui button at the bottom of Página 3 de 3 */}
                        {activeLetterPage === pages.length - 1 && (
                          <div className="flex justify-center pt-2">
                            <motion.button
                              type="button"
                              onClick={() => setLetterSpecialActionOpen(true)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-base md:text-lg rounded-full shadow-lg hover:shadow-rose-500/25 border border-rose-400/20 transition-all cursor-pointer flex items-center gap-2 animate-bounce"
                            >
                              <Heart className="w-5 h-5 fill-current text-white animate-pulse" />
                              <span>Clique Aqui 💌</span>
                            </motion.button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3.5. SPECIAL IMPORTANT LETTER MODAL */}
      <AnimatePresence>
        {specialNoticeOpen && (
          <motion.div
            key="special-notice-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#fcfaf2] text-[#2c241e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl border-2 sm:border-4 border-amber-900/10 max-w-2xl w-full leading-relaxed relative my-4 sm:my-8 select-text"
              style={{
                backgroundImage: `radial-gradient(#ebe3cc 1px, transparent 1px)`,
                backgroundSize: "20px 20px"
              }}
            >
              {/* Envelope Retro Lines decoration */}
              <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-rose-400 via-rose-300 to-rose-400 rounded-t-lg opacity-40" />

              <div className="flex items-center justify-between border-b border-amber-900/20 pb-4 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest font-mono text-rose-800 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    Mensagem de Extrema Importância
                  </p>
                  <p className="text-xs text-amber-900/80 font-mono mt-0.5">
                    De: <span className="font-serif">Meu coração para o seu</span>
                  </p>
                </div>
                <button
                  onClick={() => setSpecialNoticeOpen(false)}
                  className="w-10 h-10 rounded-full hover:bg-amber-900/10 flex items-center justify-center font-sans font-bold text-amber-900 text-lg cursor-pointer transition-all active:scale-95"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>

              {/* Title of the Letter */}
              <h3 className="text-xl sm:text-2xl md:text-3xl text-[#3b2b1e] font-bold font-serif mb-4 md:mb-6 leading-tight border-b-2 border-amber-900/10 pb-2">
                Leia com Atenção antes de Começar ❤️
              </h3>

              {/* Text content */}
              <div className="space-y-5 font-sans text-slate-900 text-[15px] sm:text-base md:text-[17px] text-justify whitespace-pre-line leading-[1.65] sm:leading-[1.75] tracking-normal antialiased font-normal">
                <p>
                  Antes de tudo, quero dizer pra você que me importo muito com você e espero que você esteja melhor!
                </p>
                <p>
                  Na última vez que nos falamos, você citou que estava em depressão e que engordou 8KG. Eu orei por você e vou continuar orando.
                </p>
                <p className="font-medium text-amber-900 bg-amber-900/5 px-4 py-3 rounded-xl border-l-4 border-amber-700/60 leading-relaxed italic">
                  Quando puder, leia essa oração com calma. Não sei como você está hoje, mas irei continuar orando por você:
                </p>
                
                <div className="bg-rose-500/5 border border-rose-500/10 p-5 rounded-2xl font-serif text-[#412e1f] text-base md:text-lg italic leading-[1.8] space-y-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 font-mono text-[9px] uppercase font-bold text-rose-500/30">Oração</div>
                  <p>
                    &ldquo;Senhor Jesus, quero que você vá de encontro à Larissa, eu faço essa oração por cura, direção e paz, toca nela, toca e age aonde existem feridas profundas. Que tua Palavra seja luz no seu caminho e direção para os seus passos. Que ela continue confiando em ti, sabendo os seus planos são de paz, esperança e futuro.
                  </p>
                  <p>
                    Senhor, que quando ela estiver se sentindo sozinha, que você demonstre toda a glória do Espírito Santo, que sua paz encha o coração dela, que sua alegria tome conta. Senhor, te peço em todo momento, cuide dela Senhor Jesus, livre ela de todo mal e jamais deixe ninguém machucá-la.
                  </p>
                  <p className="font-bold text-center pt-2 leading-relaxed not-italic">
                    Essa oração que te faço e te agradeço em nome do Senhor Jesus, amém!&rdquo;
                  </p>
                </div>
              </div>

              {/* Footer Close Button */}
              <div className="flex justify-center mt-8 border-t border-amber-900/20 pt-5">
                <button
                  type="button"
                  onClick={() => setSpecialNoticeOpen(false)}
                  className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl border border-rose-700/20 transition-colors duration-200 cursor-pointer shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base"
                >
                  Confirmar Leitura & Prosseguir 🌹
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. ENTRANCE WARNING NOTICE MODAL */}
      <AnimatePresence>
        {showEntranceNotice && (
          <motion.div
            key="entrance-notice"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/98 flex items-center justify-center p-4 z-[60] overflow-y-auto backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border-2 border-rose-500/20 rounded-3xl p-6 md:p-10 shadow-2xl max-w-xl w-full text-center space-y-6 animate-fadeIn relative"
            >
              {/* Soft glowing ambient light behind */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-center relative z-10">
                <span className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse">
                  <AlertCircle className="w-10 h-10" />
                </span>
              </div>

              <h3 className="font-serif text-2xl font-bold text-rose-200 relative z-10">
                Aviso Importante 💌
              </h3>

              <div className="text-slate-300 text-sm md:text-base leading-relaxed text-justify space-y-4 font-sans border-y border-slate-800/80 py-6 relative z-10">
                <p>
                  Larissa, após você ler tudo isso, não quero que você me mande mensagem. Caso fosse mandar, quero apenas que você leia tudo e guarde no seu coração. Se um dia for mandar mensagem, que esse dia seja para eu largar tudo o que estou fazendo e ir te abraçar.
                </p>
                <p>
                  Até esse dia chegar, e se chegar, só quero que você se lembre do meu amor por você e saiba que eu nunca desisti de nós. Porém hoje, eu vou torcer por você e pela sua nova jornada.
                </p>
              </div>

              <div className="pt-2 relative z-10">
                <button
                  onClick={() => setShowEntranceNotice(false)}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-650 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-rose-950/25 transition-all duration-300 active:scale-95 cursor-pointer"
                >
                  Entendi e Quero Prosseguir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
