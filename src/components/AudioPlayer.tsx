import { useState, useEffect, useRef } from "react";
import { Music, Volume2, VolumeX, Disc, Play, Pause } from "lucide-react";
// @ts-ignore
import defaultMusicFile from "./music.mp3";

interface AudioPlayerProps {
  musicUrl: string;
  songTitle: string;
  songArtist: string;
  forceAutoplay?: boolean;
}

export default function AudioPlayer({
  musicUrl,
  songTitle,
  songArtist,
  forceAutoplay = false
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(forceAutoplay);
  const [isMuted, setIsMuted] = useState(false);
  const [animBars, setAnimBars] = useState<number[]>([15, 8, 22, 10, 18, 5, 12, 20]);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Detect mode
  const isYoutube = musicUrl && (musicUrl.includes("youtube.com") || musicUrl.includes("youtu.be"));

  // Check if we should use the local components music.mp3
  const resolvedAudioSrc = (!isYoutube && musicUrl && (musicUrl === "local-components-music" || musicUrl.includes("music.mp3")))
    ? defaultMusicFile
    : musicUrl;

  // Parse YouTube ID
  const getYoutubeId = (url: string) => {
    try {
      if (!url) return "";
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11 ? match[2] : "5mF9D7Xyv64";
    } catch {
      return "5mF9D7Xyv64";
    }
  };

  const videoId = isYoutube ? getYoutubeId(musicUrl) : "";

  // HTML5 audio controls for custom MP3s
  useEffect(() => {
    if (isYoutube || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn("Autoplay block or audio element playback error:", err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isYoutube]);

  useEffect(() => {
    if (isYoutube || !audioRef.current) return;
    audioRef.current.muted = isMuted;
  }, [isMuted, isYoutube]);

  // Autoplay or source changes
  useEffect(() => {
    if (isYoutube || !audioRef.current) return;
    audioRef.current.load();
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn("Playback error on source change:", err);
      });
    }
  }, [musicUrl, isYoutube]);

  // Waveform animation
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setAnimBars((prev) =>
          prev.map(() => Math.floor(Math.random() * 25) + 4)
        );
      }, 150);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setAnimBars([4, 4, 4, 4, 4, 4, 4, 4]);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  // When forceAutoplay changes
  useEffect(() => {
    if (forceAutoplay) {
      setIsPlaying(true);
    }
  }, [forceAutoplay]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="bg-slate-900/85 backdrop-blur-md border border-rose-500/20 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 max-w-sm w-full mx-auto relative overflow-hidden group">
      {/* Background soft pulse */}
      <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Embedded YouTube Player Iframe (Hidden / Visual audio source) */}
      {isYoutube && videoId && (
        <iframe
          id="music-iframe"
          className="absolute opacity-0 pointer-events-none w-1 h-1"
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&loop=1&playlist=${videoId}&mute=${isMuted ? 1 : 0}`}
          title="Nossa Música"
          allow="autoplay; encrypted-media"
        />
      )}

      {/* HTML5 Native Audio Source for MP3 URLs or uploads */}
      {!isYoutube && resolvedAudioSrc && (
        <audio
          ref={audioRef}
          src={resolvedAudioSrc}
          loop
          preload="auto"
          style={{ display: "none" }}
        />
      )}

      {/* Rotating Disc / Visual Aspect */}
      <div className="relative shrink-0 flex items-center justify-center">
        <div
          className={`w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center relative transition-transform shadow-md ${
            isPlaying ? "animate-spin" : ""
          }`}
          style={{ animationDuration: "6s" }}
        >
          <Disc className="w-8 h-8 text-rose-400" />
          <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700 absolute" />
        </div>
        <div className="absolute -top-1 -right-1 flex gap-[2px] items-end h-5 w-6 px-[2px]">
          {animBars.map((height, i) => (
            <div
              key={i}
              className="w-[2px] bg-rose-400 rounded-full transition-all duration-150"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </div>

      {/* Track Details */}
      <div className="flex-1 min-w-0 select-none font-sans">
        <p className="text-sm font-semibold text-rose-100 truncate flex items-center gap-1.5 font-sans">
          <Music className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          {songTitle || "Nossa Música"}
        </p>
        <p className="text-xs text-rose-300/70 truncate pl-5">
          {songArtist || "Preste atenção na letra"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlayback}
          className="w-9 h-9 rounded-full bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 flex items-center justify-center text-rose-300 hover:text-white transition-all cursor-pointer active:scale-95"
          title={isPlaying ? "Pausar música" : "Tocar música"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current text-rose-300" />
          ) : (
            <Play className="w-4 h-4 fill-current text-rose-300 ml-0.5" />
          )}
        </button>

        <button
          onClick={toggleMute}
          className="w-9 h-9 rounded-full bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
          title={isMuted ? "Ativar som" : "Desativar som"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-slate-300" />
          )}
        </button>
      </div>
    </div>
  );
}
