// src/hooks/useSpotifyPlayer.ts
"use client";
import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface SpotifyPlayerHook {
  deviceId: string | null;
  isReady: boolean;
  isPaused: boolean;
  isActive: boolean;
  play: (uri: string) => Promise<void>;
  togglePlay: () => void;
  error: string | null;
}

export function useSpotifyPlayer(token: string | null): SpotifyPlayerHook {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<any>(null);
  const tokenRef = useRef<string | null>(null);

  // Mantener el token actualizado sin reinicializar el player
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (!token) return;

    // Si el SDK ya está cargado, inicializar directamente
    if (window.Spotify) {
      initPlayer(token);
      return;
    }

    // Cargar el script del SDK
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      initPlayer(token);
    };

    return () => {
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function initPlayer(accessToken: string) {
    if (playerRef.current) return; // ya inicializado

    const player = new window.Spotify.Player({
      name: "Hitazos 🎵",
      getOAuthToken: (cb: (t: string) => void) => {
        // Siempre provee el token más reciente
        cb(tokenRef.current || accessToken);
      },
      volume: 0.8,
    });

    playerRef.current = player;

    player.addListener("ready", ({ device_id }: { device_id: string }) => {
      setDeviceId(device_id);
      setIsReady(true);
      setError(null);
    });

    player.addListener("not_ready", () => {
      setIsReady(false);
    });

    player.addListener("player_state_changed", (state: any) => {
      if (!state) return;
      setIsPaused(state.paused);
      player.getCurrentState().then((s: any) => {
        setIsActive(!!s);
      });
    });

    player.addListener("initialization_error", ({ message }: any) => {
      setError(`Error de inicialización: ${message}`);
    });

    player.addListener("authentication_error", ({ message }: any) => {
      setError(`Error de autenticación: ${message}`);
    });

    player.addListener("account_error", ({ message }: any) => {
      setError(`Se requiere Spotify Premium: ${message}`);
    });

    player.connect();
  }

  // Reproducir una canción específica por URI
  const play = useCallback(async (uri: string) => {
    if (!deviceId || !tokenRef.current) return;

    await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [uri] }),
      }
    );
  }, [deviceId]);

  const togglePlay = useCallback(() => {
    playerRef.current?.togglePlay();
  }, []);

  return { deviceId, isReady, isPaused, isActive, play, togglePlay, error };
}
