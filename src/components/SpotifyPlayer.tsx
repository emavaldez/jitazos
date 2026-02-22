"use client";
import { useGameStore } from "@/store/useGameStore";
import { useEffect, useState } from "react";

export const SpotifyPlayer = () => {
  const { activeSong } = useGameStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !activeSong || !activeSong.uri) return null;

  const trackId = activeSong.uri.includes(":")
    ? activeSong.uri.split(":")[2]
    : activeSong.id;

  // Sin autoplay — el user clickea el botón de play de Spotify directamente
  const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;

  return (
    /*
      El embed compacto de Spotify es 300x80px.
      El botón de play/pause está aprox. en x:10-50px, centrado verticalmente.
      Con overflow:hidden + posición negativa del iframe mostramos solo esa zona.
      El fondo negro hace que el resto del embed no se vea.
    */
    <div
      style={{
        position: "relative",
        width: "48px",
        height: "48px",
        overflow: "hidden",
        borderRadius: "50%",
        backgroundColor: "black",
        flexShrink: 0,
      }}
    >
      <iframe
        key={trackId}
        src={embedUrl}
        style={{
          position: "absolute",
          width: "300px",
          height: "80px",
          left: "-10px",
          top: "-16px",
          border: "none",
        }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};
