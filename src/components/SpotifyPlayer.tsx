"use client";

import { useGameStore } from "@/store/useGameStore";
import { useEffect, useRef, useState } from "react";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/spotify_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

type SpotifyPlayerType = Spotify.Player;

export const SpotifyPlayer = () => {
  const { activeSong, isPlaying } = useGameStore();

  const playerRef = useRef<SpotifyPlayerType | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // 1️⃣ Cargar SDK
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).Spotify) {
      setSdkReady(true);
      return;
    }

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      setSdkReady(true);
    };

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // 2️⃣ Inicializar Player
  useEffect(() => {
    if (!sdkReady) return;

    const token = getToken();
    if (!token) return;

    const player = new (window as any).Spotify.Player({
      name: "HITAZOS",
      getOAuthToken: async (cb: (token: string) => void) => {
        let t = getToken();
        if (!t) {
          await fetch("/api/auth/refresh");
          t = getToken();
        }
        cb(t || "");
      },
      volume: 0.8,
    });

    player.addListener("ready", () => {
      console.log("✅ Spotify Player Ready");
      setIsPlayerReady(true);
    });

    player.addListener("initialization_error", ({ message }) =>
      console.error("init error:", message)
    );
    player.addListener("authentication_error", ({ message }) =>
      console.error("auth error:", message)
    );
    player.addListener("account_error", ({ message }) =>
      console.error("account error:", message)
    );
    player.addListener("playback_error", ({ message }) =>
      console.error("playback error:", message)
    );

    player.connect().then((success: boolean) => {
      if (success) {
        playerRef.current = player;
      }
    });

    return () => {
      player.disconnect();
    };
  }, [sdkReady]);

  // 3️⃣ Reproducir cuando cambia canción o estado
  useEffect(() => {
    const play = async () => {
      if (!playerRef.current || !isPlayerReady || !activeSong) return;

      const token = getToken();
      if (!token) return;

      const uri = `spotify:track:${activeSong.id}`;

      if (isPlaying) {
        // Necesario para autoplay policies del browser
        await playerRef.current.activateElement();

        await fetch("https://api.spotify.com/v1/me/player/play", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [uri],
          }),
        });
      } else {
        await playerRef.current.pause();
      }
    };

    play();
  }, [activeSong, isPlaying, isPlayerReady]);

  return null;
};