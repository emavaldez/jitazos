"use client";
import { useGameStore } from "@/store/useGameStore";
import { SpotifyPlayer } from "@/components/SpotifyPlayer";
import { useState, useEffect, useRef } from "react";

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/spotify_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ── Paleta por equipo ─────────────────────────────────────────────────────────
const TEAM = {
  0: {
    bg:         "bg-green-500",
    text:       "text-green-500",
    border:     "border-green-500",
    topBar:     "bg-green-500",
    glow:       "shadow-[0_0_20px_rgba(34,197,94,0.5)]",
    ring:       "ring-green-500/20",
    btnText:    "text-black",
    dropActive: "border-green-400 bg-green-400/20 text-green-400 scale-110",
    dropIdle:   "border-zinc-700 hover:border-green-500 hover:bg-green-500/10 text-zinc-600 hover:text-green-500",
    inputRing:  "focus:ring-green-500",
    label:      "EQUIPO 1",
    scoreBg:    "bg-green-500 text-black",
  },
  1: {
    bg:         "bg-indigo-500",
    text:       "text-indigo-400",
    border:     "border-indigo-500",
    topBar:     "bg-indigo-500",
    glow:       "shadow-[0_0_20px_rgba(99,102,241,0.5)]",
    ring:       "ring-indigo-500/20",
    btnText:    "text-white",
    dropActive: "border-indigo-400 bg-indigo-400/20 text-indigo-400 scale-110",
    dropIdle:   "border-zinc-700 hover:border-indigo-500 hover:bg-indigo-500/10 text-zinc-600 hover:text-indigo-400",
    inputRing:  "focus:ring-indigo-500",
    label:      "EQUIPO 2",
    scoreBg:    "bg-indigo-500 text-white",
  },
} as const;

export default function Home() {
  const {
    status,
    startGame,
    activeSong,
    team1Timeline,
    team2Timeline,
    currentTurn,
    points,
    placeSong,
    isPlaying,
    togglePlay,
    guessTrack,
    guessArtist,
    resetGame,
    usePower,
    playlist,
  } = useGameStore();

  const [trackGuess, setTrackGuess]       = useState("");
  const [artistGuess, setArtistGuess]     = useState("");
  const [dragging, setDragging]           = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasToken, setHasToken]           = useState(false);
  const [powerMsg, setPowerMsg]           = useState<string | null>(null);

  const touchDragging = useRef(false);

  const timelineActiva = currentTurn === 0 ? team1Timeline : team2Timeline;
  const tc             = TEAM[currentTurn as 0 | 1];
  const teamPoints     = points[currentTurn];

  useEffect(() => {
    setHasToken(!!getTokenFromCookie());
  }, []);

  // ── Drag & drop (mouse) ───────────────────────────────────────────────────
  const handleDragStart = () => setDragging(true);
  const handleDragEnd   = () => { setDragging(false); setDragOverIndex(null); };
  const handleDrop      = (index: number) => {
    if (!dragging) return;
    setDragging(false);
    setDragOverIndex(null);
    confirmarYColocar(index);
  };

  // ── Touch drag (iPhone Safari) ────────────────────────────────────────────
  const handleTouchStart = () => { touchDragging.current = true; };
  const handleTouchEnd   = () => { touchDragging.current = false; };

  // ── Confirmar colocación ─────────────────────────────────────────────────
  const confirmarYColocar = (index: number) => {
    const confirmar = window.confirm("¿Colocar la carta en esta posición?");
    if (!confirmar) return;

    const trackOk  = trackGuess.trim()  ? guessTrack(trackGuess)   : false;
    const artistOk = artistGuess.trim() ? guessArtist(artistGuess) : false;

    const exito = placeSong(index);

    setTrackGuess("");
    setArtistGuess("");

    const msgs: string[] = [];
    if (trackGuess.trim())  msgs.push(trackOk  ? "🎵 Nombre correcto +1"  : "🎵 Nombre incorrecto");
    if (artistGuess.trim()) msgs.push(artistOk ? "🎤 Artista correcto +1" : "🎤 Artista incorrecto");
    msgs.push(exito ? "✅ ¡Posición CORRECTA!" : "❌ Posición incorrecta, perdieron el turno");

    alert(msgs.join("\n"));
  };

  // ── Poderes ───────────────────────────────────────────────────────────────
  const showPower = (msg: string) => {
    setPowerMsg(msg);
    setTimeout(() => setPowerMsg(null), 2500);
  };

  const handleChangeSong = () => {
    if (teamPoints < 4 || !playlist?.length) return;
    usePower("change");
    showPower("🔄 ¡Canción cambiada!");
  };

  const handleAutoPlace = () => {
    if (teamPoints < 10) return;
    usePower("auto");
    showPower("✨ ¡Carta colocada automáticamente!");
  };

  // ── Pantalla: Login Spotify ───────────────────────────────────────────────
  if (!hasToken) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        <h1 className="text-7xl font-black italic text-green-500 mb-4 tracking-tighter">HITAZOS</h1>
        <p className="mb-2 text-zinc-400 font-bold uppercase tracking-widest text-sm">484 canciones · 1960–2024</p>
        <p className="mb-12 text-zinc-600 text-xs text-center max-w-xs">Necesitás Spotify Premium para reproducir las canciones</p>
        <a
          href="/api/auth/login"
          className="flex items-center gap-3 bg-[#1DB954] text-black px-10 py-5 rounded-3xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(29,185,84,0.4)]"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Conectar con Spotify
        </a>
      </div>
    );
  }

  // ── Pantalla: Inicio / Cargando ───────────────────────────────────────────
  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        <SpotifyPlayer />
        <h1 className="text-7xl font-black italic text-green-500 mb-4 tracking-tighter">HITAZOS</h1>
        <p className="mb-12 text-zinc-400 font-bold uppercase tracking-widest text-sm">484 canciones · 1960–2024</p>
        <button
          onClick={startGame}
          disabled={status === "loading"}
          className="bg-green-500 text-black px-16 py-6 rounded-3xl font-black text-3xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(34,197,94,0.4)] disabled:opacity-50"
        >
          {status === "loading" ? "CARGANDO..." : "▶ JUGAR"}
        </button>
      </div>
    );
  }

  // ── Pantalla de Juego ─────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes cardPulse {
          0%, 100% { background-color: rgb(24 24 27); border-color: rgb(82 82 91); box-shadow: none; }
          50% { background-color: rgb(20 83 45); border-color: rgb(34 197 94); box-shadow: 0 0 20px rgba(34,197,94,0.4); }
        }
        .card-pulse { animation: cardPulse 2s ease-in-out infinite; }
      `}</style>

      <main className="min-h-screen bg-black text-white p-4 font-sans pb-56">
        <SpotifyPlayer />

        {/* Toast de poder */}
        {powerMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-white text-black font-black px-6 py-3 rounded-2xl shadow-2xl text-sm whitespace-nowrap">
            {powerMsg}
          </div>
        )}

        {/* ── Marcador Superior ── */}
        <div
          className="flex justify-around items-center mb-6 p-4 rounded-3xl border border-zinc-800 backdrop-blur-md sticky top-4 z-50 transition-all duration-500"
          style={{ background: currentTurn === 0 ? "rgba(34,197,94,0.06)" : "rgba(99,102,241,0.08)" }}
        >
          {/* Equipo 1 */}
          <div className={`transition-all duration-500 px-4 py-2 rounded-2xl ${
            currentTurn === 0
              ? `${TEAM[0].scoreBg} scale-110 ${TEAM[0].glow}`
              : "opacity-30 bg-zinc-900 text-white"
          }`}>
            <p className="text-[10px] font-black uppercase">Equipo 1</p>
            <p className="text-3xl font-black leading-none">{points[0]}</p>
          </div>

          {/* Centro */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={resetGame}
              className={`text-xl font-black italic tracking-tighter hover:scale-105 transition-all active:scale-95 ${tc.text}`}
              title="Volver al inicio"
            >
              HITAZOS
            </button>
            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full ${tc.bg} ${tc.btnText}`}>
              {tc.label}
            </span>
          </div>

          {/* Equipo 2 */}
          <div className={`transition-all duration-500 px-4 py-2 rounded-2xl ${
            currentTurn === 1
              ? `${TEAM[1].scoreBg} scale-110 ${TEAM[1].glow}`
              : "opacity-30 bg-zinc-900 text-white"
          }`}>
            <p className="text-[10px] font-black uppercase">Equipo 2</p>
            <p className="text-3xl font-black leading-none">{points[1]}</p>
          </div>
        </div>

        {/* ── Botones de Poder ── */}
        <div className="flex gap-3 justify-center mb-5 px-4">
          <button
            onClick={handleChangeSong}
            disabled={teamPoints < 4 || !playlist?.length}
            className={`flex-1 max-w-[160px] py-2 px-3 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
              ${teamPoints >= 4 && playlist?.length ? `${tc.bg} ${tc.btnText} shadow-md` : "bg-zinc-800 text-zinc-500"}`}
          >
            🔄 Cambiar canción
            <span className="block text-[10px] font-bold opacity-75 mt-0.5">4 puntos</span>
          </button>
          <button
            onClick={handleAutoPlace}
            disabled={teamPoints < 10}
            className={`flex-1 max-w-[160px] py-2 px-3 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
              ${teamPoints >= 10 ? `${tc.bg} ${tc.btnText} shadow-md` : "bg-zinc-800 text-zinc-500"}`}
          >
            ✨ Auto-colocar
            <span className="block text-[10px] font-bold opacity-75 mt-0.5">10 puntos</span>
          </button>
        </div>

        {/* ── Título del tablero ── */}
        <h2 className={`text-center font-bold mb-4 tracking-[0.3em] uppercase text-sm ${tc.text}`}>
          Tablero {tc.label}
        </h2>

        {/* ── Timeline Horizontal Scrolleable ── */}
        <div
          className="w-full overflow-x-auto pb-3 mb-4"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          <div className="flex flex-nowrap items-center gap-2 px-4 min-w-max">
            <DropZone
              index={0}
              active={dragOverIndex === 0}
              tc={tc}
              onDragOver={() => setDragOverIndex(0)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={() => handleDrop(0)}
              onClick={() => confirmarYColocar(0)}
            />
            {timelineActiva.map((song, i) => (
              <div key={song.id + i} className="flex items-center gap-2">
                {/* Carta colocada */}
                <div className={`group relative w-24 h-36 bg-zinc-900 border-2 ${tc.border} rounded-2xl overflow-hidden cursor-default shadow-xl flex-shrink-0`}>
                  <div className={`absolute top-0 left-0 w-full h-1 ${tc.topBar}`} />
                  <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-200">
                    <p className="text-3xl font-black text-white">{song.year}</p>
                  </div>
                  <div className="absolute inset-0 p-3 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className={`text-xl font-black ${tc.text}`}>{song.year}</p>
                    <div className="leading-tight">
                      <p className="text-[10px] font-bold text-white truncate uppercase">{song.name}</p>
                      <p className="text-[9px] text-zinc-400 italic truncate">{song.artist}</p>
                    </div>
                  </div>
                </div>

                <DropZone
                  index={i + 1}
                  active={dragOverIndex === i + 1}
                  tc={tc}
                  onDragOver={() => setDragOverIndex(i + 1)}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={() => handleDrop(i + 1)}
                  onClick={() => confirmarYColocar(i + 1)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Panel Inferior Fijo ── */}
        <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-[100]">
          <div className="max-w-md mx-auto space-y-3">
            {activeSong && (
              <div className="flex items-center gap-3">
                {/* Carta pulsante — arrastrable (mouse + touch) */}
                <div
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  style={{ touchAction: "none", WebkitUserSelect: "none" } as React.CSSProperties}
                  className="card-pulse w-24 h-36 border-2 rounded-2xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shadow-xl shrink-0 select-none"
                >
                  <span className="text-3xl mb-1">🎵</span>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider text-center leading-tight px-2">
                    Arrastrá o<br />hacé click en +
                  </p>
                </div>

                {/* Inputs */}
                <div className="flex-1 space-y-2">
                  <input
                    value={trackGuess}
                    onChange={(e) => setTrackGuess(e.target.value)}
                    placeholder="¿Nombre del tema? (+1)"
                    className={`w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl outline-none focus:ring-2 ${tc.inputRing} text-xs`}
                  />
                  <input
                    value={artistGuess}
                    onChange={(e) => setArtistGuess(e.target.value)}
                    placeholder="¿Artista / Banda? (+1)"
                    className={`w-full bg-zinc-900 border border-zinc-700 p-3 rounded-xl outline-none focus:ring-2 ${tc.inputRing} text-xs`}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => togglePlay(!isPlaying)}
              className={`w-full h-14 rounded-2xl font-black text-lg transition-all duration-300 active:scale-95 shadow-xl ${
                isPlaying
                  ? `${tc.bg} ${tc.btnText} ring-4 ${tc.ring}`
                  : "bg-white text-black"
              }`}
            >
              {isPlaying ? "⏸ PAUSAR HIT" : "▶️ REPRODUCIR HIT"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

// ── DropZone ─────────────────────────────────────────────────────────────────
interface DropZoneProps {
  index: number;
  active: boolean;
  tc: typeof TEAM[0 | 1];
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onClick: () => void;
}

function DropZone({ active, tc, onDragOver, onDragLeave, onDrop, onClick }: DropZoneProps) {
  return (
    <button
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      onClick={onClick}
      onTouchEnd={(e) => {
        // Safari iOS: evita delay de 300ms y ghost clicks
        e.preventDefault();
        onClick();
      }}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
      className={`w-8 h-36 rounded-xl border-2 border-dashed transition-all flex items-center justify-center font-black text-xl active:scale-95 flex-shrink-0 ${
        active ? tc.dropActive : tc.dropIdle
      }`}
    >
      +
    </button>
  );
}
