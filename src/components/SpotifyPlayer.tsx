"use client";
import { useGameStore } from "@/store/useGameStore";
import { useEffect, useRef, useState } from "react";

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/spotify_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const SPOTIFY_API_BASE = "https://api.spotify.com/v1/me/player";

// Busca el device llamado "HITAZOS" en la lista de devices de Spotify
async function findHitazosDevice(token: string): Promise<string | null> {
  for (let i = 0; i < 10; i++) {
    const res = await fetch("https://api.spotify.com/v1/me/player/devices", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const devices: { id: string; name: string }[] = data.devices || [];
    console.log(`devices poll ${i}:`, devices.map((d) => `${d.name}:${d.id}`));
    const hitazos = devices.find((d) => d.name === "HITAZOS");
    if (hitazos) return hitazos.id;
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

export const SpotifyPlayer = () => {
  const { activeSong, isPlaying } = useGameStore();
  const playerRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const currentUriRef = useRef<string | null>(null);

  useEffect(() => {
    const w = window as any;
    if (w.Spotify) { setSdkReady(true); return; }
    w.onSpotifyWebPlaybackSDKReady = () => setSdkReady(true);
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

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

    player.addListener("ready", async () => {
      const t = getTokenFromCookie();
      if (!t) return;

      // Buscar el device "HITAZOS" en la lista real de Spotify
      const id = await findHitazosDevice(t);
      if (!id) { console.warn("No se encontró el device HITAZOS"); return; }

      console.log("Device HITAZOS encontrado:", id);
      deviceIdRef.current = id;

      // Transferir playback a ese device
      await fetch(SPOTIFY_API_BASE, {
        method: "PUT",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify({ device_ids: [id], play: false }),
      });

      setConnected(true);
    });

    player.addListener("not_ready", () => {
      deviceIdRef.current = null;
      setConnected(false);
    });

    player.connect();
    playerRef.current = player;
    return () => player.disconnect();
  }, [sdkReady]);

  // Resetear URI cuando cambia la canción (nuevo turno)
  useEffect(() => {
    currentUriRef.current = null;
  }, [activeSong?.id]);

  useEffect(() => {
    if (!connected) return;
    const updateAudio = async () => {
      if (!deviceIdRef.current || !activeSong?.id) return;
      const token = getTokenFromCookie();
      if (!token) return;
      const uri = `spotify:track:${activeSong.id}`;

      if (isPlaying) {
        await playerRef.current?.activateElement();
        if (currentUriRef.current !== uri) {
          currentUriRef.current = uri;
          await fetch(`${SPOTIFY_API_BASE}/play?device_id=${deviceIdRef.current}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ uris: [uri] }),
          });
        } else {
          await playerRef.current?.resume();
        }
      } else {
        await playerRef.current?.pause();
      }
    };
    updateAudio();
  }, [isPlaying, activeSong?.id, connected]);

  return null;
};
