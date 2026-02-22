"use client";
import { useGameStore, BASE_CARD_ID } from "@/store/useGameStore";
import { SpotifyPlayer } from "@/components/SpotifyPlayer";
import { useState } from "react";

interface TurnResult {
  placement: boolean;
  trackCorrect: boolean | null;
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
    guessTrack,
    guessArtist,
  } = useGameStore();

  const [trackGuess, setTrackGuess] = useState("");
  const [artistGuess, setArtistGuess] = useState("");
  const [result, setResult] = useState<TurnResult | null>(null);

  const timelineActiva = currentTurn === 0 ? team1Timeline : team2Timeline;

  const handlePlace = (index: number) => {
    if (!activeSong || result) return;
    const songToReveal = activeSong;

    // Evaluamos adivinanzas primero (antes de que el store cambie activeSong)
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

  // ── Pantalla de inicio ──────────────────────────────────────────
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

  // ── Pantalla de juego ───────────────────────────────────────────
  return (
    <main className="min-h-screen bg-black text-white p-4 font-sans pb-72">

      {/* Modal de resultado */}
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

            <div className="space-y-2 text-sm">
              {result.trackCorrect === null ? (
                <p className="text-zinc-600">No intentaste adivinar el nombre.</p>
              ) : (
                <p className={result.trackCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {result.trackCorrect ? "🎵 ¡Adivinaste el nombre! +1 pto" : "🎵 Nombre incorrecto."}
                </p>
              )}
              {result.artistCorrect === null ? (
                <p className="text-zinc-600">No intentaste adivinar la banda.</p>
              ) : (
                <p className={result.artistCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                  {result.artistCorrect ? "🎤 ¡Adivinaste la banda! +1 pto" : "🎤 Banda incorrecta."}
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

      {/* Marcador superior */}
      <div className="flex justify-around items-center mb-10 bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800 backdrop-blur-md sticky top-4 z-50">
        <div className={`transition-all duration-500 px-4 py-2 rounded-2xl ${currentTurn === 0 ? "bg-green-500 text-black scale-110 shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "opacity-40"}`}>
          <p className="text-[10px] font-black uppercase">Equipo 1</p>
          <p className="text-3xl font-black leading-none">{points[0]}</p>
        </div>
        <div className="text-2xl font-black italic text-green-500 tracking-tighter">HITAZOS</div>
        <div className={`transition-all duration-500 px-4 py-2 rounded-2xl ${currentTurn === 1 ? "bg-green-500 text-black scale-110 shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "opacity-40"}`}>
          <p className="text-[10px] font-black uppercase">Equipo 2</p>
          <p className="text-3xl font-black leading-none">{points[1]}</p>
        </div>
      </div>

      <h2 className="text-center text-zinc-500 font-bold mb-8 tracking-[0.3em] uppercase text-sm">
        Tablero Equipo {currentTurn + 1}
      </h2>

      {/* Timeline */}
      <div className="flex flex-wrap justify-center gap-3 items-center max-w-7xl mx-auto px-4">
        <DropZone index={0} onPlace={handlePlace} disabled={!!result} />

        {timelineActiva.map((song, i) => (
          <div key={song.id + i} className="flex items-center gap-3">
            <TimelineCard song={song} />
            <DropZone index={i + 1} onPlace={handlePlace} disabled={!!result} />
          </div>
        ))}
      </div>

      {/* Panel inferior */}
      <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black via-black to-transparent z-[100]">
        <div className="max-w-md mx-auto space-y-3">

          {/* Fila superior: carta activa + player de Spotify */}
          {activeSong && (
            <div className="flex items-center gap-4 justify-center">
              {/* Carta misteriosa */}
              <div className="w-28 h-36 bg-zinc-900 border-2 border-dashed border-zinc-600 rounded-2xl flex flex-col items-center justify-center text-center p-2 shadow-xl">
                <span className="text-3xl mb-2">💿</span>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">¿De qué año?</p>
                <p className="text-[9px] text-zinc-700 italic">Colocala en el tablero</p>
              </div>

              {/* Spotify player: solo el botón de play */}
              <div className="flex flex-col items-center gap-1">
                <SpotifyPlayer />
                <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Play</span>
              </div>
            </div>
          )}

          {/* Campo: adivinar nombre de la canción */}
          <input
            value={trackGuess}
            onChange={(e) => setTrackGuess(e.target.value)}
            disabled={!!result}
            placeholder="🎵 Nombre de la canción (+1 pto)"
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 ring-green-500 transition-all text-sm disabled:opacity-40"
          />

          {/* Campo: adivinar nombre de la banda */}
          <input
            value={artistGuess}
            onChange={(e) => setArtistGuess(e.target.value)}
            disabled={!!result}
            placeholder="🎤 Nombre de la banda (+1 pto)"
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 ring-green-500 transition-all text-sm disabled:opacity-40"
          />

          <p className="text-center text-zinc-700 text-[10px] font-bold uppercase tracking-widest">
            ↑ Colocá la carta en el tablero para confirmar
          </p>
        </div>
      </div>
    </main>
  );
}

// ── Carta del timeline ──────────────────────────────────────────
function TimelineCard({ song }: { song: { id: string; year: number; name: string; artist: string } }) {
  const isBase = song.id === BASE_CARD_ID;

  return (
    <div className="relative group w-28 h-40">
      {/* Cara principal: solo el año */}
      <div className="w-full h-full bg-zinc-900 border-2 border-green-500 rounded-2xl p-3 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-200 group-hover:opacity-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
        <p className="text-3xl font-black text-white">{song.year}</p>
      </div>

      {/* Cara hover: año + artista + canción (solo si no es la carta base) */}
      <div className="absolute inset-0 bg-zinc-800 border-2 border-green-400 rounded-2xl p-3 flex flex-col justify-between shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200">
        <div className="absolute top-0 left-0 w-full h-1 bg-green-400" />
        <p className="text-2xl font-black text-white">{song.year}</p>
        {isBase ? (
          <p className="text-[10px] text-zinc-500 italic">Carta de referencia</p>
        ) : (
          <div className="leading-tight">
            <p className="text-[10px] font-bold text-white truncate uppercase">{song.name}</p>
            <p className="text-[9px] text-zinc-400 italic truncate">{song.artist}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Drop zone ───────────────────────────────────────────────────
function DropZone({ index, onPlace, disabled }: { index: number; onPlace: (i: number) => void; disabled: boolean }) {
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
