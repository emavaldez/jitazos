import { create } from 'zustand';

export interface Song {
  id: string;
  year: number;
  name: string;
  artist: string;
  uri: string;
}

interface GameState {
  team1Timeline: Song[];
  team2Timeline: Song[];
  points: [number, number];
  currentTurn: 0 | 1;
  activeSong: Song | null;
  playlist: Song[];
  status: 'idle' | 'playing' | 'won';
  isPlaying: boolean;

  // Acciones
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
  points: [0, 0],
  currentTurn: 0,
  activeSong: null,
  playlist: [],
  status: 'idle',
  isPlaying: false,

  togglePlay: (val: boolean) => set({ isPlaying: val }),

  loadCategory: async (category: string) => {
    try {
      const response = await fetch(`/api/songs?category=${category}`);
      const data = await response.json();
      const songsArray = Array.isArray(data) ? data : data.tracks?.items || [];

      if (songsArray.length < 2) return;

      const shuffled = [...songsArray].sort(() => Math.random() - 0.5);
      const cartaBase = shuffled[0];

      set({
        activeSong: shuffled[1],
        playlist: shuffled.slice(2),
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

  addPoint: (team) =>
    set((state) => {
      const newPoints = [...state.points] as [number, number];
      newPoints[team] += 1;
      return { points: newPoints };
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
      [currentTurn === 0 ? 'team1Timeline' : 'team2Timeline']: currentTimeline,
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
      t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const esCorrecto = normalizar(input) === normalizar(activeSong.name);

    if (esCorrecto) {
      addPoint(currentTurn);
    }
    return esCorrecto;
  },

  guessArtist: (input: string) => {
    const { activeSong, currentTurn, addPoint } = get();
    if (!activeSong) return false;

    const normalizar = (t: string) =>
      t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const esCorrecto = normalizar(input) === normalizar(activeSong.artist);

    if (esCorrecto) {
      addPoint(currentTurn);
      return true;
    }
    return false;
  },

  usePower: (type) => {
    const { points, currentTurn, activeSong, team1Timeline, team2Timeline, playlist } = get();

    if (type === 'change') {
      // Cuesta 4 puntos: cambiar la canción activa por la siguiente del playlist
      const cost = 4;
      if (points[currentTurn] < cost || !playlist.length) return;

      const newPoints = [...points] as [number, number];
      newPoints[currentTurn] -= cost;

      set({
        points: newPoints,
        activeSong: playlist[0] || null,
        playlist: playlist.slice(1),
      });
    } else if (type === 'auto') {
      // Cuesta 10 puntos: coloca la canción automáticamente en el lugar correcto
      const cost = 10;
      if (points[currentTurn] < cost || !activeSong) return;

      const currentTimeline = currentTurn === 0 ? [...team1Timeline] : [...team2Timeline];

      // Encontrar el índice correcto (orden cronológico)
      let insertIndex = currentTimeline.length;
      for (let i = 0; i < currentTimeline.length; i++) {
        if (activeSong.year <= currentTimeline[i].year) {
          insertIndex = i;
          break;
        }
      }
      currentTimeline.splice(insertIndex, 0, activeSong);

      const newPoints = [...points] as [number, number];
      newPoints[currentTurn] -= cost;

      set({
        points: newPoints,
        [currentTurn === 0 ? 'team1Timeline' : 'team2Timeline']: currentTimeline,
        activeSong: playlist[0] || null,
        playlist: playlist.slice(1),
        currentTurn: currentTurn === 0 ? 1 : 0,
        isPlaying: false,
      });
    }
  },
}));
