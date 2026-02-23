"use client";
import { useGameStore } from "@/store/useGameStore";
import { useEffect, useRef, useState } from "react";

interface SpotifySDKPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  resume: () => Promise<void>;
  pause: () => Promise<void>;
  addListener: (event: string, cb: (data: unknown) => void) => void;
}

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/spotify_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function playTrack(token: string, deviceId: string, spotifyUri: string) {
  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: [spotifyUri] }),
  });
}

export const SpotifyPlayer = () => {
  const { activeSong, isPlaying } = useGameStore();
  const playerRef = useRef<SpotifySDKPlayer | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const currentUriRef = useRef<string | null>(null);

  // Cargar el SDK una sola vez
  useEffect(() => {
    if (document.getElementById("spotify-sdk")) {
      // Ya cargado, ver si ya disparó el callback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).Spotify) setSdkReady(true);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).onSpotifyWebPlaybackSDKReady = () => setSdkReady(true);

    const script = document.createElement("script");
    script.id = "spotify-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Inicializar el Player cuando el SDK esté listo
  useEffect(() => {
    if (!sdkReady) return;

    const token = getTokenFromCookie();
    if (!token) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player = new (window as any).Spotify.Player({
      name: "HITAZOS",
      getOAuthToken: async (cb: (token: string) => void) => {
        let t = getTokenFromCookie();
        if (!t) {
          await fetch("/api/auth/refresh");
          t = getTokenFromCookie();
        }
        cb(t || "");
      },
      volume: 0.8,
    });

    player.addListener("ready", (data) => {
      const { device_id } = data as { device_id: string };
      deviceIdRef.current = device_id;
      setConnected(true);
    });

    player.addListener("not_ready", () => setConnected(false));

    player.connect().then((ok) => {
      if (ok) playerRef.current = player;
    });

    return () => player.disconnect();
  }, [sdkReady]);

  // Reaccionar a play/pause y cambio de canción
  useEffect(() => {
    if (!playerRef.current || !deviceIdRef.current || !activeSong) return;
    const token = getTokenFromCookie();
    if (!token) return;

    const uri = `spotify:track:${activeSong.id}`;

    if (isPlaying) {
      if (currentUriRef.current !== uri) {
        currentUriRef.current = uri;
        playTrack(token, deviceIdRef.current, uri);
      } else {
        playerRef.current.resume();
      }
    } else {
      playerRef.current.pause();
    }
  }, [isPlaying, activeSong]);

  if (!sdkReady || !connected) return null;
  return null; // No hay UI — el control está en page.tsx
};
