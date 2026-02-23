"use client";
import { useGameStore } from "@/store/useGameStore";
import { useEffect, useRef, useState } from "react";

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/spotify_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const SPOTIFY_API_BASE = "https://api.spotify.com/v1/me/player";

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

    player.addListener("ready", ({ device_id }: { device_id: string }) => {
      deviceIdRef.current = device_id;
      // Registrar device silenciosamente, sin arrancar reproducción
      fetch(SPOTIFY_API_BASE, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getTokenFromCookie()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ device_ids: [device_id], play: false }),
      }).then(() => setConnected(true))
        .catch(() => setConnected(true)); // conectado igual, el play lo manejamos aparte
    });

    player.addListener("not_ready", () => {
      deviceIdRef.current = null;
      setConnected(false);
    });

    player.connect();
    playerRef.current = player;
    return () => player.disconnect();
  }, [sdkReady]);

  // Resetear URI cacheado cuando cambia la canción activa (nuevo turno)
  useEffect(() => {
    currentUriRef.current = null;
  }, [activeSong?.id]);

  useEffect(() => {
    if (!connected) return; // no hacer nada hasta que el device esté registrado
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
