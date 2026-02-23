"use client";
import { useGameStore } from "@/store/useGameStore";
import { SpotifyPlayer } from "@/components/SpotifyPlayer";
import { useState } from "react";

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
  } = useGameStore();

  const [trackGuess, setTrackGuess] = useState("");
  const [artistGuess, setArtistGuess] = useState("");
  const [dragging, setDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const timelineActiva = currentTurn === 0 ? team1Timeline : team2Timeline;

  // ── Pantalla de Inicio ────────────────────────────────────────────────────
  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        <h1 className="text-7xl font-black italic text-green-500 mb-4 tracking-tighter">
          HITAZOS
        </h1>
        <p className="mb-12 text-zinc-400 font-bold uppercase tracking-widest text-sm">
          484 canciones · 1960–2024
        </p>
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

  // ── Handlers drag & drop ──────────────────────────────────────────────────
  const handleDragStart = () => setDragging(true);
  const handleDragEnd = () => {
    setDragging(false);
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => {
    if (!dragging) return;
    setDragging(false);
    setDragOverIndex(null);
    confirmarYColocar(index);
  };

  const confirmarYColocar = (index: number) => {
    const confirmar = window.confirm("¿Colocar la carta en esta posición?");
    if (!confirmar) return;
    const exito = placeSong(index);
    setTrackGuess("");
    setArtistGuess("");
    if (exito) alert("✅ ¡CORRECTO! La carta se queda en el tablero.");
    else alert("❌ ¡INCORRECTO! Perdieron el turno.");
  };

  const handleGuessTrack = () => {
    if (!trackGuess.trim()) return;
    const ok = guessTrack(trackGuess);
    alert(ok ? "🎵 ¡Nombre correcto! +1 punto" : "❌ No es el nombre exacto.");
    if (ok) setTrackGuess("");
  };

  const handleGuessArtist = () => {
    if (!artistGuess.trim()) return;
    const ok = guessArtist(artistGuess);
    alert(ok ? "🎤 ¡Artista correcto! +1 punto" : "❌ No es el artista exacto.");
    if (ok) setArtistGuess("");
  };

  // ── Pantalla de Juego ─────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-black text-white p-4 font-sans pb-56">
      <SpotifyPlayer />

      {/* Marcador Superior */}
      <div className="flex justify-around items-center mb-10 bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800 backdrop-blur-md sticky top-4 z-50">
        <div className={`transition-all duration-500 px-4 py-2 rounded-2xl ${currentTurn === 0 ? "bg-green-500 text-black scale-110 shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "opacity-40"}`}>
          <p className="text-[10px] font-black uppercase">Equipo 1</p>
          <p className="text-3xl font-black leading-none">{points[0]}</p>
        </div>

        <button
          onClick={resetGame}
          className="text-2xl font-black italic text-green-500 tracking-tighter hover:scale-105 transition-all active:scale-95"
          title="Volver al inicio"
        >
          HITAZOS
        </button>

        <div className={`transition-all duration-500 px-4 py-2 rounded-2xl ${currentTurn === 1 ? "bg-green-500 text-black scale-110 shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "opacity-40"}`}>
          <p className="text-[10px] font-black uppercase">Equipo 2</p>
          <p className="text-3xl font-black leading-none">{points[1]}</p>
        </div>
      </div>

      <h2 className="text-center text-zinc-500 font-bold mb-8 tracking-[0.3em] uppercase text-sm">
        Tablero Equipo {currentTurn + 1}
      </h2>

      {/* ── Timeline ── */}
      <div className="flex flex-wrap justify-center gap-2 items-center max-w-7xl mx-auto px-4 mb-8">
        <DropZone
          index={0}
          active={dragOverIndex === 0}
          onDragOver={() => setDragOverIndex(0)}
          onDragLeave={() => setDragOverIndex(null)}
          onDrop={() => handleDrop(0)}
          onClick={() => confirmarYColocar(0)}
        />

        {timelineActiva.map((song, i) => (
          <div key={song.id + i} className="flex items-center gap-2">
            {/* Carta colocada: solo año visible, hover revela título y artista */}
            <div className="group relative w-24 h-36 bg-zinc-900 border-2 border-green-500 rounded-2xl overflow-hidden cursor-default shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />

              {/* Vista por defecto: solo año centrado */}
              <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-200">
                <p className="text-3xl font-black text-white">{song.year}</p>
              </div>

              {/* Vista hover: año + nombre + artista */}
              <div className="absolute inset-0 p-3 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-xl font-black text-green-400">{song.year}</p>
                <div className="leading-tight">
                  <p className="text-[10px] font-bold text-white truncate uppercase">{song.name}</p>
                  <p className="text-[9px] text-zinc-400 italic truncate">{song.artist}</p>
                </div>
              </div>
            </div>

            <DropZone
              index={i + 1}
              active={dragOverIndex === i + 1}
              onDragOver={() => setDragOverIndex(i + 1)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={() => handleDrop(i + 1)}
              onClick={() => confirmarYColocar(i + 1)}
            />
          </div>
        ))}
      </div>

      {/* ── Panel Inferior Fijo ── */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-[100]">
        <div className="max-w-md mx-auto space-y-3">

          {activeSong && (
            <div className="flex items-center gap-3">
              {/* Carta misteriosa — arrastrable */}
              <div
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className="w-24 h-36 bg-zinc-800 border-2 border-zinc-600 rounded-2xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shadow-xl shrink-0 select-none hover:border-green-500 transition-colors"
                title="Arrastrá al lugar en el timeline"
              >
                <span className="text-3xl mb-1">🎵</span>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider text-center leading-tight px-2">
                  Arrastrá o hacé click en el +
                </p>
              </div>

              {/* Inputs de adivinanza */}
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={trackGuess}
                    onChange={(e) => setTrackGuess(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGuessTrack()}
                    placeholder="¿Nombre del tema? (+1)"
                    className="flex-1 bg-zinc-900 border border-zinc-700 p-3 rounded-xl outline-none focus:ring-2 ring-green-500 text-xs"
                  />
                  <button
                    onClick={handleGuessTrack}
                    className="bg-zinc-800 px-3 rounded-xl font-black hover:bg-zinc-700 active:scale-90 transition-all text-xs uppercase"
                  >
                    OK
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    value={artistGuess}
                    onChange={(e) => setArtistGuess(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGuessArtist()}
                    placeholder="¿Artista / Banda? (+1)"
                    className="flex-1 bg-zinc-900 border border-zinc-700 p-3 rounded-xl outline-none focus:ring-2 ring-green-500 text-xs"
                  />
                  <button
                    onClick={handleGuessArtist}
                    className="bg-zinc-800 px-3 rounded-xl font-black hover:bg-zinc-700 active:scale-90 transition-all text-xs uppercase"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botón reproducir */}
          <button
            onClick={() => togglePlay(!isPlaying)}
            className={`w-full h-14 rounded-2xl font-black text-lg transition-all duration-300 active:scale-95 shadow-xl ${
              isPlaying
                ? "bg-green-500 text-black ring-4 ring-green-500/20"
                : "bg-white text-black"
            }`}
          >
            {isPlaying ? "⏸ PAUSAR HIT" : "▶️ REPRODUCIR HIT"}
          </button>
        </div>
      </div>
    </main>
  );
}

// ── DropZone ──────────────────────────────────────────────────────────────────
interface DropZoneProps {
  index: number;
  active: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onClick: () => void;
}

function DropZone({ active, onDragOver, onDragLeave, onDrop, onClick }: DropZoneProps) {
  return (
    <button
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      onClick={onClick}
      className={`w-8 h-36 rounded-xl border-2 border-dashed transition-all flex items-center justify-center font-black text-xl active:scale-95 ${
        active
          ? "border-green-400 bg-green-400/20 text-green-400 scale-110"
          : "border-zinc-700 hover:border-green-500 hover:bg-green-500/10 text-zinc-600 hover:text-green-500"
      }`}
    >
      +
    </button>
  );
}
