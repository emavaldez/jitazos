"use client";
import { useGameStore } from "@/store/useGameStore";
import { useEffect, useRef, useState } from "react";

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/spotify_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Espera hasta que el device_id aparezca en la lista de dispositivos de Spotify
async function waitForDevice(token: string, deviceId: string, retries = 10): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch("https://api.spotify.com/v1/me/player/devices", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const devices: { id: string }[] = data.devices || [];
    if (devices.some((d) => d.id === deviceId)) return true;
    await new Promise((r) => setTimeout(r, 500)); // esperar 500ms entre intentos
  }
  return false;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPlayer = any;

export const SpotifyPlayer = () => {
  const { activeSong, isPlaying } = useGameStore();
  const playerRef = useRef<AnyPlayer>(null);
  const deviceIdRef = useRef<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const currentUriRef = useRef<string | null>(null);

  // Cargar el SDK script una sola vez
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

  // Crear el Player una vez que el SDK esté cargado
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
      const t = getTokenFromCookie();
      if (!t) { setConnected(true); return; }

      // Esperar a que Spotify registre el device antes de transferir
      const appeared = await waitForDevice(t, device_id);
      if (appeared) {
        await transferPlayback(t, device_id);
      }
      setConnected(true);
    });

    player.addListener("not_ready", () => {
      deviceIdRef.current = null;
      setConnected(false);
    });

    player.connect().then((ok: boolean) => {
      if (ok) playerRef.current = player;
    });

    return () => player.disconnect();
  }, [sdkReady]);

  // Resetear URI cuando cambia la canción (nuevo turno = tema nuevo)
  useEffect(() => {
    currentUriRef.current = null;
  }, [activeSong]);

  // Controlar reproducción
  useEffect(() => {
    const handlePlayback = async () => {
      if (!playerRef.current || !deviceIdRef.current || !activeSong) return;
      const token = getTokenFromCookie();
      if (!token) return;

      const uri = `spotify:track:${activeSong.id}`;

      if (isPlaying) {
        // activateElement vincula el gesto del usuario al contexto de audio del browser
        await playerRef.current.activateElement();
        if (currentUriRef.current !== uri) {
          currentUriRef.current = uri;
          await playTrack(token, deviceIdRef.current, uri);
        } else {
          await playerRef.current.resume();
        }
      } else {
        await playerRef.current.pause();
      }
    };

    handlePlayback();
  }, [isPlaying, activeSong]);

  if (!sdkReady || !connected) return null;
  return null;
};
