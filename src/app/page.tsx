"use client";
import { useGameStore } from "@/store/useGameStore";
import { SpotifyPlayer } from "@/components/SpotifyPlayer";
import { useState } from "react";

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
    guessTrack 
  } = useGameStore();
  
  const [trackGuess, setTrackGuess] = useState("");

  // Determinamos cuál timeline mostrar según el turno
  const timelineActiva = currentTurn === 0 ? team1Timeline : team2Timeline;

  // Pantalla de Inicio: Selección de Categoría
  if (status === 'idle') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
        <h1 className="text-7xl font-black italic text-green-500 mb-12 tracking-tighter">HITAZOS</h1>
        <p className="mb-8 text-zinc-400 font-bold uppercase tracking-widest">Elegí tu género</p>
        <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
          {['rock_int', 'rock_arg', 'pop', 'punk'].map((cat) => (
            <button 
              key={cat}
              onClick={() => loadCategory(cat)}
              className="bg-zinc-900 border border-zinc-700 p-5 rounded-2xl font-black text-xl hover:bg-green-500 hover:text-black transition-all active:scale-95 shadow-lg"
            >
              {cat.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Pantalla de Juego
  return (
    <main className="min-h-screen bg-black text-white p-4 font-sans pb-40">
      <SpotifyPlayer />

      {/* Marcador Superior */}
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

      {/* Tablero Dinámico (Timeline que se abre) */}
      <div className="flex flex-wrap justify-center gap-3 items-center max-w-7xl mx-auto px-4">
        
        {/* Espacio inicial antes de la primera carta */}
        <DropZone index={0} onClick={placeSong} />

        {timelineActiva.map((song, i) => (
          <div key={song.id + i} className="flex items-center gap-3">
            {/* La Carta ya colocada */}
            <div className="w-28 h-40 bg-zinc-900 border-2 border-green-500 rounded-2xl p-3 flex flex-col justify-between shadow-2xl relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
              <p className="text-2xl font-black text-white">{song.year}</p>
              <div className="leading-tight">
                <p className="text-[10px] font-bold text-white truncate uppercase">{song.name}</p>
                <p className="text-[9px] text-zinc-400 italic truncate">{song.artist}</p>
              </div>
            </div>

            {/* Espacio para colocar la siguiente canción */}
            <DropZone index={i + 1} onClick={placeSong} />
          </div>
        ))}
      </div>

      {/* Panel de Control Inferior */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black to-transparent z-[100]">
        <div className="max-w-md mx-auto">
          
          {/* Carta de la canción que suena (Vista Previa) */}
          {activeSong && (
            <div className="flex flex-col items-center mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-36 h-48 bg-white text-black rounded-3xl p-4 shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center text-center relative">
                 <div className="absolute -top-2 bg-green-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-md">
                   Escuchando ahora
                 </div>
                 <span className="text-4xl mb-3">💿</span>
                 <p className="text-xs font-black uppercase leading-tight mb-1">{activeSong.name}</p>
                 <p className="text-[10px] italic text-zinc-600">{activeSong.artist}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button 
              onClick={() => togglePlay(!isPlaying)}
              className={`w-full h-16 rounded-2xl font-black text-xl transition-all duration-300 active:scale-95 shadow-xl ${
                isPlaying 
                ? "bg-green-500 text-black border-none ring-4 ring-green-500/20" 
                : "bg-white text-black border-none"
              }`}
            >
              {isPlaying ? "⏸ PAUSAR HIT" : "▶️ REPRODUCIR HIT"}
            </button>
            
            <div className="flex gap-2">
              <input 
                value={trackGuess}
                onChange={(e) => setTrackGuess(e.target.value)}
                placeholder="¿Adivinás el nombre? (+1 pto)"
                className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 ring-green-500 transition-all text-sm"
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
                className="bg-zinc-800 px-6 rounded-2xl font-black hover:bg-zinc-700 active:scale-90 transition-all uppercase text-xs"
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

// Componente para los espacios donde se pueden poner cartas
function DropZone({ index, onClick }: { index: number; onClick: (i: number) => boolean }) {
  return (
    <button 
      onClick={() => {
        const confirmar = window.confirm(`¿Colocar aquí?`);
        if (confirmar) {
          const exito = onClick(index);
          if (exito) alert("¡CORRECTO! Se queda en el tablero.");
          else alert("¡INCORRECTO! Perdieron el turno.");
        }
      }}
      className="w-10 h-32 border-2 border-dashed border-zinc-800 rounded-2xl hover:border-green-500 hover:bg-green-500/10 transition-all flex items-center justify-center text-zinc-800 hover:text-green-500 font-black text-2xl group"
    >
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">+</span>
    </button>
  );
}