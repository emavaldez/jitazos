import { create } from 'zustand';

export interface Song {
  id: string;
  year: number;
  name: string;
  artist: string;
}

interface GameState {
  team1Timeline: Song[];
  team2Timeline: Song[];
  playlist: Song[];
  points: [number, number];
  currentTurn: 0 | 1;
  activeSong: Song | null;
  status: 'idle' | 'loading' | 'playing' | 'won';
  isPlaying: boolean;
  startGame: () => Promise<void>;
  addPoint: (team: 0 | 1) => void;
  placeSong: (index: number) => boolean;
  guessTrack: (input: string) => boolean;
  guessArtist: (input: string) => boolean;
  togglePlay: (val: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  team1Timeline: [],
  team2Timeline: [],
  playlist: [],
  points: [0, 0],
  currentTurn: 0,
  activeSong: null,
  status: 'idle',
  isPlaying: false,

  togglePlay: (val: boolean) => set({ isPlaying: val }),

  resetGame: () => set({
    team1Timeline: [],
    team2Timeline: [],
    playlist: [],
    points: [0, 0],
    currentTurn: 0,
    activeSong: null,
    status: 'idle',
    isPlaying: false,
  }),

  startGame: async () => {
    set({ status: 'loading' });
    try {
      const response = await fetch('/api/songs');
      const data = await response.json();
      const songsArray: Song[] = Array.isArray(data) ? data : [];
      if (songsArray.length < 3) return;

      set({
        activeSong: songsArray[1], // La primera canción a adivinar
        playlist: songsArray.slice(2),
        team1Timeline: [songsArray[0]],
        team2Timeline: [songsArray[0]],
        status: 'playing',
        currentTurn: 0,
        isPlaying: false,
        points: [0, 0],
      });
    } catch (error) {
      console.error("Error cargando canciones:", error);
      set({ status: 'idle' });
    }
  },

  addPoint: (team) => set((state) => {
    const newPoints = [...state.points];
    newPoints[team] += 1;
    return { points: newPoints as [number, number] };
  }),

  placeSong: (index: number) => {
    const { activeSong, currentTurn, team1Timeline, team2Timeline, playlist } = get();
    if (!activeSong) return false;

    const currentTimeline = currentTurn === 0 ? [...team1Timeline] : [...team2Timeline];
    const leftSong = currentTimeline[index - 1];
    const rightSong = currentTimeline[index];

    const isCorrect =
      (!leftSong || activeSong.year >= leftSong.year) &&
      (!rightSong || activeSong.year <= rightSong.year);

    if (isCorrect) {
      currentTimeline.splice(index, 0, activeSong);
    }

    // Pasamos a la siguiente canción de la lista
    const nextSong = playlist[0] || null;
    const remainingPlaylist = playlist.slice(1);

    set({
      [currentTurn === 0 ? "team1Timeline" : "team2Timeline"]: currentTimeline,
      activeSong: nextSong,
      playlist: remainingPlaylist,
      currentTurn: currentTurn === 0 ? 1 : 0,
      isPlaying: false, // Forzamos pausa para que el nuevo jugador inicie su turno
    });

    return isCorrect;
  },

  guessTrack: (input: string) => {
    const { activeSong, currentTurn, addPoint } = get();
    if (!activeSong) return false;
    const normalizar = (t: string) =>
      t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const esCorrecto = normalizar(input) === normalizar(activeSong.name);
    if (esCorrecto) addPoint(currentTurn);
    return esCorrecto;
  },

  guessArtist: (input: string) => {
    const { activeSong, currentTurn, addPoint } = get();
    if (!activeSong) return false;
    const normalizar = (t: string) =>
      t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const esCorrecto = normalizar(input) === normalizar(activeSong.artist);
    if (esCorrecto) addPoint(currentTurn);
    return esCorrecto;
  },
}));