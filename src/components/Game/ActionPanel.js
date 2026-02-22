// src/components/Game/ActionPanel.tsx
import { useGameStore } from "@/store/useGameStore";

export const ActionPanel = () => {
  const { points, currentTurn, usePower, activeSong } = useGameStore();
  const teamPoints = points[currentTurn];

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 w-full max-w-md">
      <div className="flex justify-between mb-4">
        <span className="text-zinc-400 font-bold">PUNTOS EQUIPO {currentTurn + 1}:</span>
        <span className="text-green-500 font-black text-2xl">{teamPoints}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => usePower('change')}
          disabled={teamPoints < 4}
          className="bg-blue-600 disabled:opacity-30 p-3 rounded-lg font-bold text-sm"
        >
          CAMBIAR CANCIÓN (4pts)
        </button>
        <button 
          onClick={() => usePower('auto')}
          disabled={teamPoints < 8}
          className="bg-purple-600 disabled:opacity-30 p-3 rounded-lg font-bold text-sm"
        >
          AUTO-COLOCAR (8pts)
        </button>
      </div>

      <button className="w-full mt-6 bg-green-500 text-black py-4 rounded-xl font-black text-xl hover:bg-green-400 transition">
        ¡CONFIRMAR POSICIÓN!
      </button>
    </div>
  );
};