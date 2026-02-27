"use client";
import { useGameStore } from "@/store/useGameStore";
import { SpotifyPlayer } from "@/components/SpotifyPlayer";
import { useState, useRef } from "react";

// ─── Colores por equipo ────────────────────────────────────────────────────────
const TEAM_COLORS = {
  0: {
    bg: "bg-green-500",
    text: "text-green-500",
    border: "border-green-500",
    ring: "ring-green-500/20",
    glow: "shadow-[0_0_20px_rgba(34,197,94,0.4)]",
    cardBorder: "border-green-500",
    cardTop: "bg-green-500",
    dropHover: "hover:border-green-500 hover:bg-green-500/10 hover:text-green-500",
    dropBorder: "border-green-800",
    label: "EQUIPO 1",
    bgSoft: "bg-green-500/10",
    btnBg: "bg-green-500",
    btnText: "text-black",
  },
  1: {
    bg: "bg-indigo-500",
    text: "text-indigo-400",
    border: "border-indigo-500",
    ring: "ring-indigo-500/20",
    glow: "shadow-[0_0_20px_rgba(99,102,241,0.5)]",
    cardBorder: "border-indigo-500",
    cardTop: "bg-indigo-500",
    dropHover: "hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-400",
    dropBorder: "border-indigo-900",
    label: "EQUIPO 2",
    bgSoft: "bg-indigo-500/10",
    btnBg: "bg-indigo-500",
    btnText: "text-white",
  },
} as const;

export default function Home() {
  const {
    status,
    loadCategory,
    activeSong,
    team1Timeline,
    team2Timeline,
    currentTurn,
    points,
    placeSong,
    isPlaying,
    togglePlay,
    guessTrack,
    usePower,
    playlist,
  } = useGameStore();

  const [trackGuess, setTrackGuess] = useState("");
  const [powerMsg, setPowerMsg] = useState<string | null>(null);

  const timelineActiva = currentTurn === 0 ? team1Timeline : team2Timeline;
  const tc = TEAM_COLORS[currentTurn as 0 | 1];
  const teamPoints = points[currentTurn];

  // ─── Funciones de poder ──────────────────────────────────────────────────────
  const handleChangeSong = () => {
    if (teamPoints < 4) return;
    usePower("change");
    setPowerMsg("🔄 ¡Canción cambiada!");
    setTimeout(() => setPowerMsg(null), 2000);
  };

  const handleAutoPlace = () => {
    if (teamPoints < 10) return;
    usePower("auto");
    setPowerMsg("✨ ¡Canción colocada automáticamente!");
    setTimeout(() => setPowerMsg(null), 2000);
  };

  // ─── Pantalla de inicio ──────────────────────────────────────────────────────
  if (status === "idle") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        <h1 className="text-7xl font-black italic text-green-500 mb-12 tracking-tighter">
          HITAZOS
        </h1>
        <p className="mb-8 text-zinc-400 font-bold uppercase tracking-widest">
          Elegí tu género
        </p>
        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
          {["rock_int", "rock_arg", "pop", "punk"].map((cat) => (
            <button
              key={cat}
              onClick={() => loadCategory(cat)}
              className="bg-zinc-900 border border-zinc-700 p-5 rounded-2xl font-black text-xl hover:bg-green-500 hover:text-black transition-all active:scale-95 shadow-lg"
            >
              {cat.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Pantalla de juego ───────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-black text-white p-4 font-sans pb-52">
      <SpotifyPlayer />

      {/* Mensaje de poder temporal */}
      {powerMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-white text-black font-black px-6 py-3 rounded-2xl shadow-2xl text-sm animate-bounce">
          {powerMsg}
        </div>
      )}

      {/* ── Marcador Superior ── */}
      <div
        className={`flex justify-around items-center mb-6 p-4 rounded-3xl border backdrop-blur-md sticky top-4 z-50 transition-all duration-500 ${tc.bgSoft} border-zinc-800`}
      >
        {/* Equipo 1 */}
        <div
          className={`transition-all duration-500 px-4 py-2 rounded-2xl ${
            currentTurn === 0
              ? `${TEAM_COLORS[0].bg} text-black scale-110 ${TEAM_COLORS[0].glow}`
              : "opacity-30 bg-zinc-900"
          }`}
        >
          <p className="text-[10px] font-black uppercase">Equipo 1</p>
          <p className="text-3xl font-black leading-none">{points[0]}</p>
        </div>

        {/* Título + indicador de turno */}
        <div className="flex flex-col items-center gap-1">
          <div className={`text-xl font-black italic tracking-tighter ${tc.text}`}>
            HITAZOS
          </div>
          <div
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full ${tc.bg} ${tc.btnText}`}
          >
            Turno {tc.label}
          </div>
        </div>

        {/* Equipo 2 */}
        <div
          className={`transition-all duration-500 px-4 py-2 rounded-2xl ${
            currentTurn === 1
              ? `${TEAM_COLORS[1].bg} text-white scale-110 ${TEAM_COLORS[1].glow}`
              : "opacity-30 bg-zinc-900"
          }`}
        >
          <p className="text-[10px] font-black uppercase">Equipo 2</p>
          <p className="text-3xl font-black leading-none">{points[1]}</p>
        </div>
      </div>

      {/* ── Botones de Poder ── */}
      <div className="flex gap-3 justify-center mb-6 px-4">
        <button
          onClick={handleChangeSong}
          disabled={teamPoints < 4 || !playlist || playlist.length === 0}
          className={`flex-1 max-w-[160px] py-2 px-3 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
            ${teamPoints >= 4 ? `${tc.btnBg} ${tc.btnText} shadow-lg` : "bg-zinc-800 text-zinc-400"}`}
        >
          🔄 Cambiar canción
          <span className="block text-[10px] font-bold opacity-80">4 puntos</span>
        </button>
        <button
          onClick={handleAutoPlace}
          disabled={teamPoints < 10}
          className={`flex-1 max-w-[160px] py-2 px-3 rounded-xl font-black text-xs transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
            ${teamPoints >= 10 ? `${tc.btnBg} ${tc.btnText} shadow-lg` : "bg-zinc-800 text-zinc-400"}`}
        >
          ✨ Auto-colocar
          <span className="block text-[10px] font-bold opacity-80">10 puntos</span>
        </button>
      </div>

      {/* ── Título del tablero ── */}
      <h2 className={`text-center font-bold mb-4 tracking-[0.3em] uppercase text-sm ${tc.text}`}>
        Tablero {tc.label}
      </h2>

      {/* ── Timeline Horizontal Scrolleable ── */}
      <div
        className={`w-full overflow-x-auto pb-4 mb-4`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex flex-nowrap items-center gap-2 px-4 min-w-max mx-auto">
          {/* Zona de drop inicial */}
          <DropZone index={0} onClick={placeSong} tc={tc} />

          {timelineActiva.map((song, i) => (
            <div key={song.id + i} className="flex items-center gap-2">
              {/* Carta colocada */}
              <div
                className={`w-24 h-36 bg-zinc-900 border-2 ${tc.cardBorder} rounded-2xl p-3 flex flex-col justify-between shadow-2xl relative overflow-hidden flex-shrink-0`}
              >
                <div className={`absolute top-0 left-0 w-full h-1 ${tc.cardTop}`} />
                <p className="text-2xl font-black text-white">{song.year}</p>
                <div className="leading-tight">
                  <p className="text-[10px] font-bold text-white truncate uppercase">
                    {song.name}
                  </p>
                  <p className="text-[9px] text-zinc-400 italic truncate">{song.artist}</p>
                </div>
              </div>

              {/* Zona de drop siguiente */}
              <DropZone index={i + 1} onClick={placeSong} tc={tc} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel de Control Inferior ── */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black to-transparent z-[100]">
        <div className="max-w-md mx-auto">
          {/* Carta de la canción activa */}
          {activeSong && (
            <div className="flex flex-col items-center mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-36 h-48 bg-white text-black rounded-3xl p-4 shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center text-center relative">
                <div
                  className={`absolute -top-2 ${tc.bg} ${tc.btnText} text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-md`}
                >
                  Escuchando ahora
                </div>
                <span className="text-4xl mb-3">💿</span>
                <p className="text-xs font-black uppercase leading-tight mb-1">
                  {activeSong.name}
                </p>
                <p className="text-[10px] italic text-zinc-600">{activeSong.artist}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => togglePlay(!isPlaying)}
              className={`w-full h-14 rounded-2xl font-black text-xl transition-all duration-300 active:scale-95 shadow-xl ${
                isPlaying
                  ? `${tc.btnBg} ${tc.btnText} ring-4 ${tc.ring}`
                  : "bg-white text-black"
              }`}
            >
              {isPlaying ? "⏸ PAUSAR HIT" : "▶️ REPRODUCIR HIT"}
            </button>

            <div className="flex gap-2">
              <input
                value={trackGuess}
                onChange={(e) => setTrackGuess(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const acerto = guessTrack(trackGuess);
                    if (acerto) {
                      alert("¡ADIVINASTE! Sumás 1 punto extra.");
                      setTrackGuess("");
                    } else {
                      alert("Casi... pero no es el nombre exacto.");
                    }
                  }
                }}
                placeholder="¿Adivinás el nombre? (+1 pto)"
                className={`flex-1 bg-zinc-900 border p-4 rounded-2xl outline-none focus:ring-2 transition-all text-sm ${tc.border} ring-${currentTurn === 0 ? "green" : "indigo"}-500`}
              />
              <button
                onClick={() => {
                  const acerto = guessTrack(trackGuess);
                  if (acerto) {
                    alert("¡ADIVINASTE! Sumás 1 punto extra.");
                    setTrackGuess("");
                  } else {
                    alert("Casi... pero no es el nombre exacto.");
                  }
                }}
                className={`${tc.bg} ${tc.btnText} px-5 rounded-2xl font-black active:scale-90 transition-all uppercase text-xs`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── DropZone ─────────────────────────────────────────────────────────────────
function DropZone({
  index,
  onClick,
  tc,
}: {
  index: number;
  onClick: (i: number) => boolean;
  tc: (typeof TEAM_COLORS)[0 | 1];
}) {
  const handlePlace = () => {
    const confirmar = window.confirm(`¿Colocar aquí?`);
    if (confirmar) {
      const exito = onClick(index);
      if (exito) alert("¡CORRECTO! Se queda en el tablero.");
      else alert("¡INCORRECTO! Perdieron el turno.");
    }
  };

  return (
    <button
      onClick={handlePlace}
      onTouchEnd={(e) => {
        // Soporte explícito para Safari iOS
        e.preventDefault();
        handlePlace();
      }}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      className={`w-10 h-32 border-2 border-dashed rounded-2xl transition-all flex items-center justify-center font-black text-2xl group flex-shrink-0
        border-zinc-800 text-zinc-800 ${tc.dropHover}`}
    >
      <span className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
        +
      </span>
    </button>
  );
}
