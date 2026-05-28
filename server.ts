import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { StoryData, StoryConfig, Letter, TimelineEvent, Reply } from "./src/types";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "story_db.json");

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Default story data prefilled with beautiful, touching templates in Portuguese
const defaultData: StoryData = {
  config: {
    securityQuestion: "Qual é o apelido carinhoso pelo qual você me chamava?",
    securityAnswer: "moi",
    hint: "Começa com M e termina com oi",
    musicUrl: "https://www.youtube.com/embed/5mF9D7Xyv64", // Acoustic/chill lo-fi instrumental
    songTitle: "Nossos Momentos",
    songArtist: "Melodia Suave",
    writerPassword: "amor",
    introText: "",
    coupleName1: "",
    coupleName2: "Ela",
    anniversaryDate: "26 de Dezembro"
  },
  letters: [
    {
      id: "l1",
      title: "Lembranças de Nós Dois 🌸",
      date: "Revivendo momentos",
      content: "Escrevo isto com um sorriso tímido no rosto ao lembrar de cada pequeno detalhe nosso. A sua risada quando alguma piada boba dava errado, o jeito doce com o qual arrumava o cabelo quando estava tímida, e a cumplicidade que tínhamos no olhar.\n\nQuero que você saiba que o tempo passa, mas as marcas bonitas que você deixou em mim continuam intactas. Obrigado por ter sido o meu porto seguro e por ter compartilhado uma parte tão linda da sua vida comigo. Você sempre terá um espaço especial em minhas memórias carinhosas.",
      mood: "romantic",
      isRead: false
    },
    {
      id: "l2",
      title: "Maturidade e Desculpas sinceras 🙏",
      date: "Reflexão do coração",
      content: "Olhando para trás, com o silêncio e o amadurecimento que o tempo nos presenteia, consigo ver com clareza onde falhei. Sinto muito pelas vezes em que não soube ouvir de verdade, ou pelas palavras que machucaram sem necessidade nos dias difíceis. Sei que nenhum relacionamento é perfeito, mas você merecia apenas o meu melhor.\n\nEscrevo isso não com segundas intenções, mas para te dar a paz de saber que reconheço meus erros. Guardo em mim somente o orgulho de ver a pessoa maravilhosa que você é, de braços abertos e com a maturidade que hoje nos protege de qualquer mágoa antiga.",
      mood: "sorry",
      isRead: false
    },
    {
      id: "l3",
      title: "O que ficou em mim... ✨",
      date: "Marcas eternas",
      content: "Dizem que as conexões verdadeiras nunca desaparecem por completo, elas apenas se transformam. Você não foi apenas uma namorada; foi uma parte fundamental da minha jornada de crescimento. Aprendi a ser mais sensível, aprendi a cuidar, e aprendi o valor de um abraço apertado nos dias ruins.\n\nNão importa para onde o vento nos leve hoje ou em que parte do mundo estejamos, há um pedaço de mim que celebra o seu sucesso a cada nova vitória sua. Ver você sorrir, mesmo que de longe, continua sendo uma alegria sincera.",
      mood: "poetic",
      isRead: false
    },
    {
      id: "l4",
      title: "Desejos para o seu futuro 💫",
      date: "Olhando para frente",
      content: "Se houver uma coisa que peço todos os dias, é que você conquiste cada um dos seus planos. Que voe alto, sem medo, porque a sua força é gigante. Que aquela paz de espírito que você tanto procurava preencha os seus dias e ilumine cada novo caminho.\n\nE guarde isso: se num dia chuvoso ou num instante de solidão você precisar de alguém para conversar sem julgamentos, de um abraço amigo ou apenas de um silêncio confortável para descansar, a minha porta estará sempre encostada para você. Com todo carinho e respeito do mundo.",
      mood: "hopeful",
      isRead: false
    }
  ],
  timeline: [
    {
      id: "t1",
      date: "O Início",
      title: "O Dia que nos Conhecemos 🌌",
      description: "No instante em que vi você de costas lá no altar da igreja com a Ana Lívia, meu coração disparou como nunca tinha disparado antes. Foi ali que meu coração descobriu o que era o amor — um amor sem nunca ter visto, tocado ou conversado, algo que parecia impossível. A primeira vez que te vi de perto e ouvi sua voz foi no bebedouro da igreja, onde você quase caiu, kkkk! Foi ali que eu vi a menina mais linda de toda a minha vida. Jamais irei esquecer o seu primeiro toque em mim, naquela quadra.",
      icon: "Sparkles"
    },
    {
      id: "t2",
      date: "Primeiro Beijo",
      title: "O Frio na Barriga 💖",
      description: "Nosso primeiro beijo, como esquecer? Teve o selinho, em que eu acabei virando o rosto de tão envergonhado que estava, kkk! Mas o tão esperado primeiro beijo de língua foi bem na esquina da sua casa, onde os nossos dentes até se bateram (e não foi no dia que a sua mãe viu, kkk!). Foi ali que eu senti o gosto do beijo pela primeira vez. Foi ali também que as nossas bocas se encaixaram perfeitamente depois, e a partir dali a gente se beijava a toda hora. Como esquecer?",
      icon: "Heart"
    },
    {
      id: "t3",
      date: "Nossas Conversas Noturnas",
      title: "As Horas que Voavam de Madrugada 💬",
      description: "Uma das coisas de que mais sinto saudades! As horas passavam voando, os assuntos pareciam não ter fim e o tempo era simplesmente nosso inimigo. Nossas conversas eram exatamente como aquelas trends do TikTok: mesmo com cem problemas acontecendo, quando você começava a falar, tudo literalmente ia para zero. Eu nunca fui muito de falar, mas com você eu não queria ficar quieto, e também não queria que você ficasse. Eram tantos assuntos, tantas coisas... simplesmente perfeito. Eu jamais vou esquecer a sua voz e as suas risadas.",
      icon: "MessageCircle"
    },
    {
      id: "t4",
      date: "Os Planos Bobos",
      title: "Nossa Parceria 🤝",
      description: "Agora vem o que eu mais amo em você, aquilo que falo no meu trabalho e para as pessoas novas com quem converso — sim, eu falo de você, e falo muito, inclusive! E o que eu mais gosto de falar é sobre o motivo pelo qual me apaixonei e amei você.\n\nVocê foi a mulher que me curou de diversas coisas. Ao seu lado, descobri o que era a felicidade e o que era sonhar em ter uma família. Eu juro, por tudo que há de mais sagrado, que foi por sua causa que sonhei e ainda sonho em ser pai. O seu jeito de ser, o seu jeito de falar, a sua feminilidade e o seu jeito de ser mulher fizeram com que eu sonhasse em ter filhos com os seus olhos e em construir um lar com você sendo a minha esposa.\n\nEu jamais vou esquecer a sua parceria: quando precisei pagar contas, você estava lá comigo vendendo pastéis debaixo de chuva, sem reclamar de nada... Posso citar inúmeras vezes em que você provou ser uma mulher de verdade ao meu lado, que nunca se importou por eu não ter nada.\n\nObrigado por sempre ter acreditado em mim e por ter me ajudado a me tornar o homem que sou hoje.",
      icon: "Heart"
    }
  ],
  replies: []
};

// Robust database read helper
function loadData(): StoryData {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Erro ao ler banco de dados JSON:", err);
  }
  // Initialize file if not present
  saveData(defaultData);
  return defaultData;
}

// Robust database write helper
function saveData(data: StoryData) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar banco de dados JSON:", err);
  }
}

// API Routes

// 1. Get security configuration (for public landing screen)
app.get("/api/public-config", (req, res) => {
  const data = loadData();
  res.json({
    question: data.config.securityQuestion,
    hint: data.config.hint,
    coupleName1: data.config.coupleName1,
    coupleName2: data.config.coupleName2,
    introText: data.config.introText
  });
});

// 2. Unlock portal with answer
app.post("/api/unlock", (req, res) => {
  const { answer } = req.body;
  const data = loadData();
  
  if (!answer) {
    return res.status(400).json({ error: "Insira uma resposta." });
  }

  const normalizedAnswer = answer.trim().toLowerCase();
  const correctAnswer = data.config.securityAnswer.trim().toLowerCase();

  if (normalizedAnswer === correctAnswer) {
    // Return letters, timeline, and configuration without passwords/answers
    const safeConfig = { ...data.config };
    // @ts-ignore
    delete safeConfig.writerPassword;
    // @ts-ignore
    delete safeConfig.securityAnswer;

    return res.json({
      success: true,
      letters: data.letters,
      timeline: data.timeline,
      config: safeConfig
    });
  } else {
    return res.status(401).json({ error: "Lariiii, voce errouuu!!" });
  }
});

// 3. User feedback letter callback (her message back)
app.post("/api/reply", (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "O texto não pode ser vazio." });
  }

  const data = loadData();
  const newReply: Reply = {
    id: `r_${Date.now()}`,
    text: text.trim(),
    timestamp: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
  };

  data.replies.unshift(newReply); // newest first
  saveData(data);

  res.json({ success: true, reply: newReply });
});

// 3.5. Admin Upload custom MP3 audio
app.post("/api/admin/upload-audio", (req, res) => {
  const { password, filename, base64Data } = req.body;
  const data = loadData();

  if (password !== data.config.writerPassword) {
    return res.status(401).json({ error: "Acesso não autorizado." });
  }

  if (!filename || !base64Data) {
    return res.status(400).json({ error: "Faltam parâmetros: filename e base64Data são necessários." });
  }

  try {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Sanitize filename and ensure it ends with .mp3
    let cleanName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    if (!cleanName.endsWith(".mp3")) {
      cleanName += ".mp3";
    }
    // Prevent collision by prepending timestamp
    const finalFilename = `${Date.now()}_${cleanName}`;
    const filePath = path.join(uploadDir, finalFilename);

    // Write file
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
    
    // Save to config
    const fileUrl = `/uploads/${finalFilename}`;
    data.config.musicUrl = fileUrl;
    
    // Auto-update song title with clean filename (without timestamp and extension)
    const displayTitle = filename.replace(/\.mp3$/i, "");
    data.config.songTitle = displayTitle;
    data.config.songArtist = "Áudio Personalizado (.mp3)";
    
    saveData(data);

    res.json({ 
      success: true, 
      url: fileUrl,
      songTitle: displayTitle,
      songArtist: "Áudio Personalizado (.mp3)"
    });
  } catch (err: any) {
    console.error("Erro ao salvar arquivo de áudio:", err);
    res.status(500).json({ error: "Erro ao salvar arquivo de áudio no servidor." });
  }
});

// 4. Admin Login
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  const data = loadData();

  if (password === data.config.writerPassword) {
    return res.json({
      success: true,
      data
    });
  } else {
    return res.status(401).json({ error: "Senha de acesso incorreta." });
  }
});

// 5. Admin edit save
app.post("/api/admin/update", (req, res) => {
  const { password, config, letters, timeline } = req.body;
  const data = loadData();

  if (password !== data.config.writerPassword) {
    return res.status(401).json({ error: "Acesso não autorizado." });
  }

  // Update fields carefully, keep existing replies
  data.config = { ...data.config, ...config };
  data.letters = letters;
  data.timeline = timeline;

  saveData(data);
  res.json({ success: true, data });
});

// Vite Middleware for running front-end and hot assets serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Nossa História running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
