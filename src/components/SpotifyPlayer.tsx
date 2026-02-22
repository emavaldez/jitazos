"use client";
import { useGameStore } from "@/store/useGameStore";
import { useEffect, useState } from "react";

export const SpotifyPlayer = () => {
  const { activeSong, isPlaying } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !activeSong) return null;

  const trackId = activeSong.uri?.includes(":")
    ? activeSong.uri.split(":")[2]
    : activeSong.id;

  // La key cambia cuando isPlaying se vuelve true → fuerza recarga del iframe
  // con autoplay=1 justo después del click del usuario (gesto necesario para el browser)
  const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator${isPlaying ? "&autoplay=1" : ""}`;

  return (
    // Invisible pero presente en el DOM para que el autoplay funcione
    <div
      style={{
        position: "fixed",
        left: "-9999px",
        top: "-9999px",
        width: "1px",
        height: "1px",
        opacity: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <iframe
        key={`${trackId}-${isPlaying}`}
        src={embedUrl}
        width="300"
        height="80"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};
