"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/store/useGameStore";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/spotify_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export const SpotifyPlayer = () => {
  const { activeSong, isPlaying } = useGameStore();

  const playerRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);

  const [sdkReady, setSdkReady] = useState(false);
  const [connected, setConnected] = useState(false);

  // ---------------------------
  // Cargar SDK
  // ---------------------------
  useEffect(() => {
    if (document.getElementById("spotify-sdk")) {
      if ((window as any).Spotify) {
        setSdkReady(true);
      }
      return;
    }

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      setSdkReady(true);
    };

    const script = document.createElement("script");
    script.id = "spotify-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // ---------------------------
  // Inicializar Player
  // ---------------------------
  useEffect(() => {
    if (!sdkReady) return;

    const token = getToken();
    if (!token) return;

    const Spotify = (window as any).Spotify;

    const player = new Spotify.Player({
      name: "HITAZOS Player",
      getOAuthToken: (cb: (token: string) => void) => {
        const t = getToken();
        if (t) cb(t);
      },
      volume: 0.8,
    });

    player.addListener("ready", async ({ device_id }: any) => {
      deviceIdRef.current = device_id;

      const t = getToken();
      if (!t) return;

      // Transfer playback al Web SDK
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${t}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [device_id],
        }),
      });

      setConnected(true);
    });

    player.addListener("not_ready", () => {
      setConnected(false);
    });

    player.connect().then((success: boolean) => {
      if (success) {
        playerRef.current = player;
      }
    });

    return () => {
      player.disconnect();
    };
  }, [sdkReady]);

  // ---------------------------
  // Play / Pause
  // ---------------------------
  useEffect(() => {
    const playSong = async () => {
      if (!playerRef.current) return;
      if (!deviceIdRef.current) return;
      if (!activeSong) return;

      const token = getToken();
      if (!token) return;

      const uri = `spotify:track:${activeSong.id}`;

      if (isPlaying) {
        await playerRef.current.activateElement();

        await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              uris: [uri],
            }),
          }
        );
      } else {
        await playerRef.current.pause();
      }
    };

    playSong();
  }, [isPlaying, activeSong]);

  if (!sdkReady || !connected) return null;

  return null;
};