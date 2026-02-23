"use client";
import { useGameStore } from "@/store/useGameStore";
import { useEffect, useRef, useState } from "react";

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/spotify_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function transferPlayback(token: string, deviceId: string) {
  await fetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  });
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

async function pausePlayback(token: string) {
  await fetch("https://api.spotify.com/v1/me/player/pause", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPlayer = any;

export const SpotifyPlayer = () => {
  const { activeSong, isPlaying } = useGameStore();
  const playerRef = useRef<AnyPlayer>(null);
  const deviceIdRef = useRef<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [connected, setConnected] = useState(false);

  // Cargar el SDK una sola vez
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (document.getElementById("spotify-sdk")) {
      if (w.Spotify) setSdkReady(true);
      return;
    }
    w.onSpotifyWebPlaybackSDKReady = () => setSdkReady(true);
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
    const w = window as any;
    const player: AnyPlayer = new w.Spotify.Player({
      name: "HITAZOS",
      getOAuthToken: async (cb: (t: string) => void) => {
        let t = getTokenFromCookie();
        if (!t) {
          await fetch("/api/auth/refresh");
          t = getTokenFromCookie();
        }
        cb(t || "");
      },
      volume: 0.8,
    });

    player.addListener("ready", async ({ device_id }: { device_id: string }) => {
      deviceIdRef.current = device_id;
      // Registrar este dispositivo como activo en la cuenta ANTES de habilitar el botón
      const t = getTokenFromCookie();
      if (t) await transferPlayback(t, device_id);
      setConnected(true);
    });

    player.addListener("not_ready", () => setConnected(false));

    player.connect().then((ok: boolean) => {
      if (ok) playerRef.current = player;
    });

    return () => player.disconnect();
  }, [sdkReady]);

  // Reaccionar a play/pause
  useEffect(() => {
    const handlePlayback = async () => {
      if (!deviceIdRef.current || !activeSong) return;
      const token = getTokenFromCookie();
      if (!token) return;

      if (isPlaying) {
        if (playerRef.current) await playerRef.current.activateElement();
        // Re-transferir antes de reproducir para asegurarnos que este device está activo
        await transferPlayback(token, deviceIdRef.current);
        await playTrack(token, deviceIdRef.current, `spotify:track:${activeSong.id}`);
      } else {
        await pausePlayback(token);
      }
    };

    handlePlayback();
  }, [isPlaying, activeSong]);

  if (!sdkReady || !connected) return null;
  return null;
};
