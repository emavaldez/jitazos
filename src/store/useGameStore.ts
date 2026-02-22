// src/store/useGameStore.ts
import { create } from "zustand";

export interface Song {
  id: string;
  year: number;
  name: string;
  artist: string;
  uri: string;
}

export interface GameConfig {
  numTeams: number;
  numSongs: number;
  genres: string[];
}

export const BASE_CARD_ID = "__base__";

export const GENRE_LABELS: Record<string, string> = {
  rock_int: "Rock Internacional",
  rock_arg: "Rock Argentino",
  pop: "Pop",
  punk: "Punk",
};

interface GameState {
  status: "config" | "playing" | "won";
  config: GameConfig;
  timelines: Song[][];
  playlist: Song[];
  points: number[];
  currentTurn: number;
  activeSong: Song | null;

  setConfig: (config: Partial<GameConfig>) => void;
  startGame: () => Promise<void>;
  addPoint: (team: number) => void;
  placeSong: (index: number) => boolean;
  guessTrack: (input: string) => boolean;
  guessArtist: (input: string) => boolean;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: "config",
  config: { numTeams: 2, numSongs: 8, genres: ["rock_int"] },
  timelines: [],
  playlist: [],
  points: [],
  currentTurn: 0,
  activeSong: null,

  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  startGame: async () => {
    const { config } = get();
    const { numTeams, numSongs, genres } = config;
    try {
      const res = await fetch(
        `/api/songs?category=${genres.join(",")}&limit=${numSongs + 5}`
      );
      const data = await res.json();
      const songs: Song[] = Array.isArray(data) ? data : [];
      if (songs.length < 2) return;

      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      const year = Math.floor(Math.random() * (2025 - 1960 + 1)) + 1960;
      const baseCard: Song = { id: BASE_CARD_ID, year, name: "", artist: "", uri: "" };

      set({
        status: "playing",
        timelines: Array.from({ length: numTeams }, () => [{ ...baseCard }]),
        playlist: shuffled.slice(1),
        activeSong: shuffled[0],
        points: Array(numTeams).fill(0),
        currentTurn: 0,
      });
    } catch (e) {
      console.error("Error iniciando juego:", e);
    }
  },

  addPoint: (team) =>
    set((state) => {
      const pts = [...state.points];
      pts[team] += 1;
      return { points: pts };
    }),

  placeSong: (index) => {
    const { activeSong, currentTurn, timelines, playlist, config } = get();
    if (!activeSong) return false;

    const timeline = [...timelines[currentTurn]];
    const isCorrect =
      (!timeline[index - 1] || activeSong.year >= timeline[index - 1].year) &&
      (!timeline[index] || activeSong.year <= timeline[index].year);

    if (isCorrect) timeline.splice(index, 0, activeSong);

    const newTimelines = timelines.map((t, i) => (i === currentTurn ? timeline : t));
    const nextTurn = (currentTurn + 1) % config.numTeams;

    set({
      timelines: newTimelines,
      activeSong: playlist[0] || null,
      playlist: playlist.slice(1),
      currentTurn: nextTurn,
    });

    return isCorrect;
  },

  guessTrack: (input) => {
    const { activeSong, currentTurn, addPoint } = get();
    if (!activeSong) return false;
    const n = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const ok = n(input) === n(activeSong.name);
    if (ok) addPoint(currentTurn);
    return ok;
  },

  guessArtist: (input) => {
    const { activeSong, currentTurn, addPoint } = get();
    if (!activeSong) return false;
    const n = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const ok = n(input) === n(activeSong.artist);
    if (ok) addPoint(currentTurn);
    return ok;
  },
}));
