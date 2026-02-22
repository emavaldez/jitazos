import { create } from 'zustand';

export interface Song {
  id: string;
  year: number;
  name: string;
  artist: string;
  uri: string;
}

// ID especial para identificar la carta base (solo año, sin canción real)
export const BASE_CARD_ID = '__base__';

interface GameState {
  team1Timeline: Song[];
  team2Timeline: Song[];
  playlist: Song[];
  points: [number, number];
  currentTurn: 0 | 1;
  activeSong: Song | null;
  status: 'idle' | 'playing' | 'won';
  isPlaying: boolean;

  setNextSong: (song: Song) => void;
  addPoint: (team: 0 | 1) => void;
  placeSong: (index: number) => boolean;
  guessTrack: (input: string) => boolean;
  guessArtist: (input: string) => boolean;
  usePower: (type: 'change' | 'auto') => void;
  loadCategory: (category: string) => Promise<void>;
  togglePlay: (val: boolean) => void;
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

  loadCategory: async (category: string) => {
    try {
      const response = await fetch(`/api/songs?category=${category}`);
      const data = await response.json();
      const songsArray = Array.isArray(data) ? data : data.tracks?.items || [];

      if (songsArray.length < 1) return;

      const shuffled = [...songsArray].sort(() => Math.random() - 0.5);

      // Carta base: solo un año aleatorio entre 1960 y 2025, sin canción real
      const randomYear = Math.floor(Math.random() * (2025 - 1960 + 1)) + 1960;
      const cartaBase: Song = {
        id: BASE_CARD_ID,
        year: randomYear,
        name: '',
        artist: '',
        uri: '',
      };

      set({
        // La primera canción real es la que el jugador debe posicionar
        activeSong: shuffled[0],
        playlist: shuffled.slice(1),
        // Ambos equipos empiezan con la misma carta base (solo el año)
        team1Timeline: [cartaBase],
        team2Timeline: [{ ...cartaBase }],
        status: 'playing',
        currentTurn: 0,
        isPlaying: false,
      });
    } catch (error) {
      console.error("Error cargando categoría:", error);
    }
  },

  setNextSong: (song) => set({ activeSong: song, status: 'playing' }),

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

    set({
      [currentTurn === 0 ? "team1Timeline" : "team2Timeline"]: currentTimeline,
      activeSong: playlist[0] || null,
      playlist: playlist.slice(1),
      currentTurn: currentTurn === 0 ? 1 : 0,
      isPlaying: false,
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

  usePower: (type) => {
    const { points, currentTurn } = get();
    const cost = type === 'change' ? 4 : 8;
    if (points[currentTurn] >= cost) {
      const newPoints = [...points];
      newPoints[currentTurn] -= cost;
      set({ points: newPoints as [number, number] });
    }
  },
}));
