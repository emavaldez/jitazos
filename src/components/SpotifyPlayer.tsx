// src/components/SpotifyPlayer.tsx
"use client";

interface SpotifyPlayerButtonProps {
  isPaused: boolean;
  isReady: boolean;
  isActive: boolean;
  onToggle: () => void;
}

export function SpotifyPlayerButton({
  isPaused,
  isReady,
  isActive,
  onToggle,
}: SpotifyPlayerButtonProps) {
  const label = !isReady
    ? "Conectando..."
    : !isActive
    ? "▶ Cargar"
    : isPaused
    ? "▶ Play"
    : "⏸ Pause";

  return (
    <button
      onClick={onToggle}
      disabled={!isReady}
      className={`
        w-16 h-16 rounded-full font-black text-xs flex items-center justify-center
        transition-all duration-200 active:scale-90 shadow-xl disabled:opacity-40
        ${
          isReady && !isPaused
            ? "bg-green-500 text-black ring-4 ring-green-500/30"
            : "bg-white text-black"
        }
      `}
    >
      {label}
    </button>
  );
}
