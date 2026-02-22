"use client";
import { useGameStore } from "@/store/useGameStore";
import { useEffect, useState } from "react";

export const SpotifyPlayer = () => {
  const { activeSong, isPlaying } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !activeSong || !isPlaying) return null;

  const trackId = activeSong.uri?.includes(":") 
    ? activeSong.uri.split(":")[2] 
    : activeSong.id;

  const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&autoplay=1`;

  return (
    // Lo ponemos visible y con borde rojo para encontrarlo fácil
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] border-4 border-red-500 bg-black p-2">
      <p className="text-[10px] text-red-500 font-mono">DEBUG MODE: IFRAME VISIBLE</p>
      <iframe
        key={trackId}
        src={embedUrl}
        width="300"
        height="80"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        className="rounded-lg"
          />
    </div>
  );
};