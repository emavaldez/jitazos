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

  const trackId = activeSong.id;
  const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&autoplay=1`;

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[9999]">
      <iframe
        key={trackId}
        src={embedUrl}
        width="300"
        height="80"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        className="rounded-xl shadow-2xl"
      />
    </div>
  );
};
