"use client";
import { useGameStore } from "@/store/useGameStore";
import { useEffect, useRef, useState } from "react";

export const SpotifyPlayer = () => {
  const { activeSong, isPlaying } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const prevIsPlaying = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Forzar remount del iframe dentro del contexto del click del usuario
  useEffect(() => {
    if (isPlaying && !prevIsPlaying.current) {
      setPlayCount((c) => c + 1);
    }
    prevIsPlaying.current = isPlaying;
  }, [isPlaying]);

  if (!mounted || !activeSong) return null;

  const trackId = activeSong.id;

  return (
    <>
      {/* Preload invisible: carga el track antes de que el usuario haga play */}
      <div className="sr-only" aria-hidden="true">
        <iframe
          key={`preload-${trackId}`}
          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
          width="1"
          height="1"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      </div>

      {/* Reproductor visible solo cuando isPlaying */}
      {isPlaying && (
        <div className="fixed bottom-[200px] left-1/2 -translate-x-1/2 z-[9999]">
          <iframe
            key={`play-${trackId}-${playCount}`}
            src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&autoplay=1`}
            width="300"
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className="rounded-xl shadow-2xl"
          />
        </div>
      )}
    </>
  );
};
