"use client";
import { useGameStore } from "@/store/useGameStore";
import { SpotifyPlayer } from "@/components/SpotifyPlayer";
import { useState } from "react";

interface TurnResult {
  placement: boolean;
  trackCorrect: boolean | null;   // null = no intentó adivinar
  artistCorrect: boolean | null;
  songName: string;
  artistName: string;
}

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
    guessArtist,
  } = useGameStore();

  const [trackGuess, setTrackGuess] = useState("");
  const [artistGuess, setArtistGuess] = useState("");
  const [result, setResult] = useState<TurnResult | null>(null);

  const timelineActiva = currentTurn === 0 ? team1Timeline : team2Timeline;

  // ────── Lógica al colocar una carta ──────
  const handlePlace = (index: number) => {
    if (!activeSong || result) return; // bloquea si ya se está mostrando resultado

    const songToReveal = activeSong; // guardamos antes de que el store avance

    // Evaluamos los intentos de adivinanza ANTES de avanzar el estado
    const trackResult = trackGuess.trim() !== "" ? guessTrack(trackGuess) : null;
    const artistResult = artistGuess.trim() !== "" ? guessArtist(artistGuess) : null;
    const placementOk = placeSong(index);

    setResult({
      placement: placementOk,
      trackCorrect: trackResult,
      artistCorrect: artistResult,
      songName: songToReveal.name,
      artistName: songToReveal.artist,
    });
  };

  const handleNextTurn = () => {
    setResult(null);
    setTrackGuess("");
    setArtistGuess("");
  };

  // ────── Pantalla de inicio ──────
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

  // ────── Pantalla de juego ──────
  return (
    <main className="min-h-screen bg-black text-white p-4 font-sans pb-56">
      {/* Spotify oculto */}
      <SpotifyPlayer />

      {/* Modal de resultado del turno */}
      {result && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
            <h2 className="text-2xl font-black uppercase tracking-tight">
              {result.placement ? "✅ ¡CORRECTO!" : "❌ ¡INCORRECTO!"}
            </h2>

            <div className="bg-zinc-800 rounded-2xl p-4 text-left space-y-1">
              <p className="text-xs text-zinc-400 uppercase font-bold">La canción era:</p>
              <p className="font-black text-white text-lg leading-tight">{result.songName}</p>
              <p className="text-zinc-400 italic text-sm">{result.artistName}</p>
            </div>

            {/* Resultados de adivinanzas */}
            <div className="space-y-2 text-sm">
              {result.trackCorrect === null ? (
                <p className="text-zinc-600">No intentaste adivinar el nombre.</p>
              ) : (
                <p className={result.trackCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {result.trackCorrect ? "🎵 ¡Adivinaste el nombre! +1 pto" : "🎵 No era el nombre correcto."}
                </p>
              )}
              {result.artistCorrect === null ? (
                <p className="text-zinc-600">No intentaste adivinar la banda.</p>
              ) : (
                <p className={result.artistCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {result.artistCorrect ? "🎤 ¡Adivinaste la banda! +1 pto" : "🎤 No era la banda correcta."}
                </p>
              )}
            </div>

            <button
              onClick={handleNextTurn}
              className="w-full bg-green-500 text-black py-4 rounded-2xl font-black text-lg hover:bg-green-400 active:scale-95 transition-all"
            >
              SIGUIENTE TURNO →
            </button>
          </div>
        </div>
      )}

      {/* Marcador Superior */}
      <div className="flex justify-around items-center mb-10 bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800 backdrop-blur-md sticky top-4 z-50">
        <div
          className={`transition-all duration-500 px-4 py-2 rounded-2xl ${
            currentTurn === 0
              ? "bg-green-500 text-black scale-110 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              : "opacity-40"
          }`}
        >
          <p className="text-[10px] font-black uppercase">Equipo 1</p>
          <p className="text-3xl font-black leading-none">{points[0]}</p>
        </div>

        <div className="text-2xl font-black italic text-green-500 tracking-tighter">HITAZOS</div>

        <div
          className={`transition-all duration-500 px-4 py-2 rounded-2xl ${
            currentTurn === 1
              ? "bg-green-500 text-black scale-110 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              : "opacity-40"
          }`}
        >
          <p className="text-[10px] font-black uppercase">Equipo 2</p>
          <p className="text-3xl font-black leading-none">{points[1]}</p>
        </div>
      </div>

      <h2 className="text-center text-zinc-500 font-bold mb-8 tracking-[0.3em] uppercase text-sm">
        Tablero Equipo {currentTurn + 1}
      </h2>

      {/* Tablero / Timeline */}
      <div className="flex flex-wrap justify-center gap-3 items-center max-w-7xl mx-auto px-4">
        <DropZone index={0} onPlace={handlePlace} disabled={!!result} />

        {timelineActiva.map((song, i) => (
          <div key={song.id + i} className="flex items-center gap-3">
            <div className="w-28 h-40 bg-zinc-900 border-2 border-green-500 rounded-2xl p-3 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
              <p className="text-2xl font-black text-white">{song.year}</p>
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-white truncate uppercase">{song.name}</p>
                <p className="text-[9px] text-zinc-400 italic truncate">{song.artist}</p>
              </div>
            </div>
            <DropZone index={i + 1} onPlace={handlePlace} disabled={!!result} />
          </div>
        ))}
      </div>

      {/* Panel de Control Inferior */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black to-transparent z-[100]">
        <div className="max-w-md mx-auto space-y-3">
          {/* Vista previa de la carta activa */}
          {activeSong && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-36 h-48 bg-white text-black rounded-3xl p-4 shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center text-center relative">
                <div className="absolute -top-2 bg-green-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-md">
                  Escuchando ahora
                </div>
                <span className="text-4xl mb-3">💿</span>
                <p className="text-xs font-black uppercase leading-tight mb-1">???</p>
                <p className="text-[10px] italic text-zinc-400">¿De qué año es?</p>
              </div>
            </div>
          )}

          {/* Botón reproducir */}
          <button
            onClick={() => togglePlay(!isPlaying)}
            className={`w-full h-14 rounded-2xl font-black text-xl transition-all duration-300 active:scale-95 shadow-xl ${
              isPlaying
                ? "bg-green-500 text-black ring-4 ring-green-500/20"
                : "bg-white text-black"
            }`}
          >
            {isPlaying ? "⏸ PAUSAR HIT" : "▶️ REPRODUCIR HIT"}
          </button>

          {/* Adivinanza: nombre de la canción */}
          <input
            value={trackGuess}
            onChange={(e) => setTrackGuess(e.target.value)}
            disabled={!!result}
            placeholder="🎵 ¿Sabés el nombre de la canción? (+1 pto)"
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 ring-green-500 transition-all text-sm disabled:opacity-40"
          />

          {/* Adivinanza: nombre de la banda */}
          <input
            value={artistGuess}
            onChange={(e) => setArtistGuess(e.target.value)}
            disabled={!!result}
            placeholder="🎤 ¿Sabés el nombre de la banda? (+1 pto)"
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 ring-green-500 transition-all text-sm disabled:opacity-40"
          />

          <p className="text-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
            ↑ Colocá la carta arriba para confirmar tu turno
          </p>
        </div>
      </div>
    </main>
  );
}

// ────── DropZone ──────
function DropZone({
  index,
  onPlace,
  disabled,
}: {
  index: number;
  onPlace: (i: number) => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onPlace(index)}
      disabled={disabled}
      className="w-10 h-32 border-2 border-dashed border-zinc-800 rounded-2xl hover:border-green-500 hover:bg-green-500/10 transition-all flex items-center justify-center text-zinc-800 hover:text-green-500 font-black text-2xl group disabled:opacity-20 disabled:pointer-events-none"
    >
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">+</span>
    </button>
  );
}
