"use client";
import { useGameStore } from "@/store/useGameStore";
import { useEffect, useRef, useState } from "react";

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/spotify_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// 1. URL corregida para listar dispositivos
async function waitForDevice(token: string, deviceId: string, retries = 10): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch("https://api.spotify.com/v1/me/player/devices", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) continue;
    const data = await res.json();
    const devices: { id: string }[] = data.devices || [];
    if (devices.some((d) => d.id === deviceId)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

// 2. URL corregida para transferencia (usamos play: true como en tu test)
async function transferPlayback(token: string, deviceId: string) {
  await fetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ device_ids: [deviceId], play: true }),
  });
}

// 3. URL corregida con el query parameter device_id y el track ID
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

type AnyPlayer = any;

export const SpotifyPlayer = () => {
  const { activeSong, isPlaying } = useGameStore();
  const playerRef = useRef<AnyPlayer>(null);
  const deviceIdRef = useRef<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const currentUriRef = useRef<string | null>(null);

  useEffect(() => {
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

  useEffect(() => {
    if (!sdkReady) return;
    const token = getTokenFromCookie();
    if (!token) return;

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

  useEffect(() => {
    currentUriRef.current = null;
  }, [activeSong]);

  useEffect(() => {
    const handlePlayback = async () => {
      if (!playerRef.current || !deviceIdRef.current || !activeSong) return;
      const token = getTokenFromCookie();
      if (!token) return;

      const uri = `spotify:track:${activeSong.id}`;

      if (isPlaying) {
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

  return null;
};