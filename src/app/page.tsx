"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useGameStore, BASE_CARD_ID, GENRE_LABELS, Song } from "@/store/useGameStore";
import { SpotifyPlayerButton } from "@/components/SpotifyPlayer";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

// ─── Types ──────────────────────────────────────────────────────────────────
interface TurnResult {
  placement: boolean;
  trackCorrect: boolean | null;
  artistCorrect: boolean | null;
  songName: string;
  artistName: string;
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  // Fetch token from cookie via API
  useEffect(() => {
    fetch("/api/auth/token")
      .then((r) => r.json())
      .then((d) => {
        setToken(d.access_token || null);
        setTokenLoading(false);
      })
      .catch(() => setTokenLoading(false));
  }, []);

  if (tokenLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) return <LoginScreen />;

  return <GameApp token={token} />;
}

// ─── Login Screen ────────────────────────────────────────────────────────────
function LoginScreen() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
      <h1 className="text-7xl font-black italic text-green-500 mb-4 tracking-tighter">HITAZOS</h1>
      <p className="text-zinc-500 mb-16 font-bold uppercase tracking-[0.3em] text-sm">El juego de los hits</p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-xs w-full text-center space-y-6 shadow-2xl">
        <div className="text-4xl">🎵</div>
        <div>
          <p className="font-black text-lg mb-1">Conectate con Spotify</p>
          <p className="text-zinc-500 text-sm">Necesitás Spotify Premium para reproducir música.</p>
        </div>
        <a
          href="/api/auth/login"
          className="block w-full bg-green-500 text-black py-4 rounded-2xl font-black text-lg hover:bg-green-400 active:scale-95 transition-all text-center"
        >
          Conectar con Spotify
        </a>
      </div>
    </div>
  );
}

// ─── Game App (wrapper con Spotify SDK) ──────────────────────────────────────
function GameApp({ token }: { token: string }) {
  const { status } = useGameStore();
  const spotifyPlayer = useSpotifyPlayer(token);

  if (status === "config") return <ConfigScreen />;
  return <GameScreen token={token} spotifyPlayer={spotifyPlayer} />;
}

// ─── Config Screen ────────────────────────────────────────────────────────────
function ConfigScreen() {
  const { config, setConfig, startGame } = useGameStore();
  const [loading, setLoading] = useState(false);

  const toggleGenre = (g: string) => {
    const has = config.genres.includes(g);
    if (has && config.genres.length === 1) return; // mínimo uno
    setConfig({
      genres: has ? config.genres.filter((x) => x !== g) : [...config.genres, g],
    });
  };

  const handleStart = async () => {
    setLoading(true);
    await startGame();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
      <h1 className="text-5xl font-black italic text-green-500 mb-2 tracking-tighter">HITAZOS</h1>
      <p className="text-zinc-500 mb-10 font-bold uppercase tracking-[0.3em] text-xs">Nuevo juego</p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-7 shadow-2xl">

        {/* Equipos */}
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 block">
            Cantidad de equipos
          </label>
          <div className="flex gap-2">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setConfig({ numTeams: n })}
                className={`flex-1 py-3 rounded-2xl font-black text-lg transition-all active:scale-95 ${
                  config.numTeams === n
                    ? "bg-green-500 text-black"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Canciones */}
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 block">
            Canciones a adivinar
          </label>
          <div className="flex gap-2">
            {[5, 8, 12, 16].map((n) => (
              <button
                key={n}
                onClick={() => setConfig({ numSongs: n })}
                className={`flex-1 py-3 rounded-2xl font-black transition-all active:scale-95 ${
                  config.numSongs === n
                    ? "bg-green-500 text-black"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Géneros */}
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3 block">
            Géneros incluidos
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(GENRE_LABELS).map(([key, label]) => {
              const selected = config.genres.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleGenre(key)}
                  className={`py-3 px-2 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                    selected
                      ? "bg-green-500 text-black"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-green-500 text-black py-4 rounded-2xl font-black text-xl hover:bg-green-400 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "Cargando..." : "¡EMPEZAR!"}
        </button>
      </div>
    </div>
  );
}

// ─── Game Screen ─────────────────────────────────────────────────────────────
function GameScreen({
  token,
  spotifyPlayer,
}: {
  token: string;
  spotifyPlayer: ReturnType<typeof useSpotifyPlayer>;
}) {
  const { timelines, points, currentTurn, activeSong, config, placeSong, guessTrack, guessArtist } =
    useGameStore();

  const [trackGuess, setTrackGuess] = useState("");
  const [artistGuess, setArtistGuess] = useState("");
  const [result, setResult] = useState<TurnResult | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [hoveredZone, setHoveredZone] = useState<number | null>(null);
  const draggingRef = useRef(false);

  const currentTimeline = timelines[currentTurn] ?? [];

  // Cuando hay nueva canción activa, reproducirla automáticamente
  useEffect(() => {
    if (activeSong?.uri && spotifyPlayer.isReady) {
      spotifyPlayer.play(activeSong.uri);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSong?.uri, spotifyPlayer.isReady]);

  // ── Drag handlers ─────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent) => {
    draggingRef.current = true;
    e.dataTransfer.setData("text/plain", "active-card");
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setHoveredZone(index);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setHoveredZone(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      draggingRef.current = false;
      setHoveredZone(null);
      if (!activeSong || result || pendingIndex !== null) return;
      setPendingIndex(index);
    },
    [activeSong, result, pendingIndex]
  );

  // ── Confirmación / resultado ──────────────────────────────────
  const handleConfirm = () => {
    if (pendingIndex === null || !activeSong) return;
    const songToReveal = activeSong;
    const idx = pendingIndex;
    setPendingIndex(null);

    const trackResult = trackGuess.trim() !== "" ? guessTrack(trackGuess) : null;
    const artistResult = artistGuess.trim() !== "" ? guessArtist(artistGuess) : null;
    const ok = placeSong(idx);

    setResult({
      placement: ok,
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

  const isBlocked = !!result || pendingIndex !== null;

  return (
    <main className="min-h-screen bg-black text-white p-4 font-sans pb-72">

      {/* ── Modal de confirmación ── */}
      {pendingIndex !== null && !result && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
            <h2 className="text-xl font-black uppercase">¿Confirmás esta posición?</h2>
            <p className="text-zinc-400 text-sm">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingIndex(null)}
                className="flex-1 bg-zinc-800 text-white py-4 rounded-2xl font-black hover:bg-zinc-700 active:scale-95 transition-all"
              >
                CANCELAR
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-green-500 text-black py-4 rounded-2xl font-black hover:bg-green-400 active:scale-95 transition-all"
              >
                ¡CONFIRMAR!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de resultado ── */}
      {result && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
            <h2 className="text-2xl font-black uppercase">
              {result.placement ? "✅ ¡CORRECTO!" : "❌ ¡INCORRECTO!"}
            </h2>

            <div className="bg-zinc-800 rounded-2xl p-4 text-left space-y-1">
              <p className="text-xs text-zinc-400 uppercase font-bold">La canción era:</p>
              <p className="font-black text-white text-lg">{result.songName}</p>
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

      {/* ── Scoreboard ── */}
      <div className="flex justify-around items-center mb-8 bg-zinc-900/60 p-3 rounded-3xl border border-zinc-800 backdrop-blur-md sticky top-4 z-50 gap-2">
        {points.map((pts, i) => (
          <div
            key={i}
            className={`flex-1 text-center px-2 py-2 rounded-2xl transition-all duration-500 ${
              currentTurn === i
                ? "bg-green-500 text-black scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                : "opacity-40"
            }`}
          >
            <p className="text-[10px] font-black uppercase">Equipo {i + 1}</p>
            <p className="text-2xl font-black leading-none">{pts}</p>
          </div>
        ))}

        <div className="text-xl font-black italic text-green-500 tracking-tighter px-2">HITAZOS</div>
      </div>

      <h2 className="text-center text-zinc-500 font-bold mb-8 tracking-[0.3em] uppercase text-xs">
        Tablero · Equipo {currentTurn + 1}
      </h2>

      {/* ── Spotify error ── */}
      {spotifyPlayer.error && (
        <div className="text-center text-red-400 text-xs mb-4 font-bold">{spotifyPlayer.error}</div>
      )}

      {/* ── Timeline ── */}
      <div className="flex flex-wrap justify-center gap-2 items-center max-w-7xl mx-auto px-4 mb-6">
        <DropZone
          index={0}
          isHovered={hoveredZone === 0}
          blocked={isBlocked}
          onDragOver={(e) => handleDragOver(e, 0)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 0)}
        />
        {currentTimeline.map((song, i) => (
          <div key={song.id + i} className="flex items-center gap-2">
            <TimelineCard song={song} />
            <DropZone
              index={i + 1}
              isHovered={hoveredZone === i + 1}
              blocked={isBlocked}
              onDragOver={(e) => handleDragOver(e, i + 1)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, i + 1)}
            />
          </div>
        ))}
      </div>

      {/* ── Bottom panel ── */}
      <div className="fixed bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black via-black to-transparent z-[100]">
        <div className="max-w-md mx-auto space-y-3">

          {/* Active card + Spotify button */}
          {activeSong && (
            <div className="flex items-center gap-4 justify-center mb-2">
              {/* Draggable card */}
              <div
                draggable={!isBlocked}
                onDragStart={handleDragStart}
                className={`w-28 h-36 bg-zinc-900 border-2 border-dashed border-zinc-600 rounded-2xl flex flex-col items-center justify-center text-center p-2 shadow-xl select-none transition-all ${
                  !isBlocked ? "cursor-grab active:cursor-grabbing hover:border-green-500 hover:shadow-green-500/20" : "opacity-50"
                }`}
              >
                <span className="text-3xl mb-2">💿</span>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">¿De qué año?</p>
                <p className="text-[9px] text-zinc-700 italic mt-1">Arrastrá al tablero</p>
              </div>

              {/* Play button */}
              <div className="flex flex-col items-center gap-1">
                <SpotifyPlayerButton
                  isPaused={spotifyPlayer.isPaused}
                  isReady={spotifyPlayer.isReady}
                  isActive={spotifyPlayer.isActive}
                  onToggle={spotifyPlayer.togglePlay}
                />
                <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">
                  {spotifyPlayer.isReady ? "Spotify" : "Cargando..."}
                </span>
              </div>
            </div>
          )}

          {/* Guess fields */}
          <input
            value={trackGuess}
            onChange={(e) => setTrackGuess(e.target.value)}
            disabled={isBlocked}
            placeholder="🎵 Nombre de la canción (+1 pto)"
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 ring-green-500 transition-all text-sm disabled:opacity-40"
          />
          <input
            value={artistGuess}
            onChange={(e) => setArtistGuess(e.target.value)}
            disabled={isBlocked}
            placeholder="🎤 Nombre de la banda (+1 pto)"
            className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 ring-green-500 transition-all text-sm disabled:opacity-40"
          />

          <p className="text-center text-zinc-700 text-[10px] font-bold uppercase tracking-widest">
            ↑ Arrastrá la carta 💿 al lugar del tablero
          </p>
        </div>
      </div>
    </main>
  );
}

// ─── Timeline Card ────────────────────────────────────────────────────────────
function TimelineCard({ song }: { song: Song }) {
  const isBase = song.id === BASE_CARD_ID;
  return (
    <div className="relative group w-28 h-40">
      {/* Default: year only */}
      <div className="w-full h-full bg-zinc-900 border-2 border-green-500 rounded-2xl p-3 flex flex-col items-center justify-center shadow-xl relative overflow-hidden transition-opacity duration-200 group-hover:opacity-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
        <p className="text-3xl font-black text-white">{song.year}</p>
      </div>
      {/* Hover: year + info */}
      <div className="absolute inset-0 bg-zinc-800 border-2 border-green-400 rounded-2xl p-3 flex flex-col justify-between shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

// ─── Drop Zone ────────────────────────────────────────────────────────────────
function DropZone({
  index,
  isHovered,
  blocked,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  index: number;
  isHovered: boolean;
  blocked: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      onDragOver={blocked ? undefined : onDragOver}
      onDragLeave={onDragLeave}
      onDrop={blocked ? undefined : onDrop}
      className={`w-10 h-32 border-2 border-dashed rounded-2xl transition-all duration-150 flex items-center justify-center font-black text-2xl ${
        blocked
          ? "border-zinc-900 opacity-20"
          : isHovered
          ? "border-green-400 bg-green-500/20 text-green-400 scale-105"
          : "border-zinc-800 text-zinc-800 hover:border-zinc-600"
      }`}
    >
      {isHovered && <span>+</span>}
    </div>
  );
}
