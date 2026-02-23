"use client";
import { useGameStore } from "@/store/useGameStore";
import { useEffect, useRef, useState } from "react";

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/spotify_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// URLs Oficiales de Spotify
const BASE_URL = "https://api.spotify.com/v1/me/player";

async function playTrack(token: string, deviceId: string, spotifyUri: string) {
  console.log(`[Player] Solicitando canción: ${spotifyUri}`);
  const res = await fetch(`${BASE_URL}/play?device_id=${deviceId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: [spotifyUri] }),
  });
  
  if (res.ok) {
    console.log("[Player] Cambio de canción exitoso (204)");
  } else {
    const err = await res.json().catch(() => ({}));
    console.error("[Player] Error al cambiar canción:", err);
  }
}

export const SpotifyPlayer = () => {
  const { activeSong, isPlaying } = useGameStore();
  const playerRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const currentUriRef = useRef<string | null>(null);

  // 1. Cargar SDK
  useEffect(() => {
    const w = window as any;
    if (w.Spotify) { setSdkReady(true); return; }
    w.onSpotifyWebPlaybackSDKReady = () => setSdkReady(true);
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // 2. Inicializar Player
  useEffect(() => {
    if (!sdkReady) return;
    const token = getTokenFromCookie();
    if (!token) return;

    const w = window as any;
    const player = new w.Spotify.Player({
      name: "HITAZOS",
      getOAuthToken: (cb: any) => cb(getTokenFromCookie() || ""),
      volume: 0.8,
    });

    player.addListener("ready", ({ device_id }: { device_id: string }) => {
      console.log("[Player] Dispositivo HITAZOS listo:", device_id);
      deviceIdRef.current = device_id;
      setConnected(true);

      // Transferimos pero SIN play automático para no pisar la lógica del juego
      fetch(BASE_URL, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ device_ids: [device_id], play: false }),
      });
    });

    player.connect();
    playerRef.current = player;
    return () => player.disconnect();
  }, [sdkReady]);

  // 3. Resetear el control de URI cuando cambia la canción en el Store
  useEffect(() => {
    console.log("[Player] La carta cambió a:", activeSong?.name, "ID:", activeSong?.id);
    currentUriRef.current = null; 
  }, [activeSong?.id]);

  // 4. Control de reproducción
  useEffect(() => {
    const handlePlayback = async () => {
      if (!playerRef.current || !deviceIdRef.current || !activeSong?.id) return;
      const token = getTokenFromCookie();
      const uri = `spotify:track:${activeSong.id}`;

      if (isPlaying) {
        await playerRef.current.activateElement();
        if (currentUriRef.current !== uri) {
          currentUriRef.current = uri;
          await playTrack(token!, deviceIdRef.current, uri);
        } else {
          await playerRef.current.resume();
        }
      } else {
        await playerRef.current.pause();
      }
    };
    handlePlayback();
  }, [isPlaying, activeSong?.id]);

  return null;
};