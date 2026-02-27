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
  // Acciones
  startGame: () => Promise<void>;
  addPoint: (team: 0 | 1) => void;
  placeSong: (index: number) => boolean;
  guessTrack: (input: string) => boolean;
  guessArtist: (input: string) => boolean;
  togglePlay: (val: boolean) => void;
  resetGame: () => void;
  usePower: (type: 'change' | 'auto') => void;
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

  togglePlay: (val) => set({ isPlaying: val }),

  resetGame: () => set({
    status: 'idle',
    isPlaying: false,
    activeSong: null,
    team1Timeline: [],
    team2Timeline: [],
    points: [0, 0],
    playlist: [],
  }),

  startGame: async () => {
    set({ status: 'loading' });
    try {
      const res = await fetch('/api/songs');
      const songs = await res.json();
      set({
        activeSong: songs[1],
        playlist: songs.slice(2),
        team1Timeline: [songs[0]],
        team2Timeline: [songs[0]],
        status: 'playing',
        isPlaying: false,
      });
    } catch (e) {
      console.error(e);
      set({ status: 'idle' });
    }
  },

  addPoint: (team) => set((state) => {
    const newPoints = [...state.points];
    newPoints[team] += 1;
    return { points: newPoints as [number, number] };
  }),

  placeSong: (index) => {
    const { activeSong, currentTurn, team1Timeline, team2Timeline, playlist } = get();
    if (!activeSong) return false;

    const timeline = currentTurn === 0 ? [...team1Timeline] : [...team2Timeline];
    const isCorrect =
      (!timeline[index - 1] || activeSong.year >= timeline[index - 1].year) &&
      (!timeline[index]     || activeSong.year <= timeline[index].year);

    if (isCorrect) timeline.splice(index, 0, activeSong);

    set({
      [currentTurn === 0 ? "team1Timeline" : "team2Timeline"]: timeline,
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

  // ── Poderes ────────────────────────────────────────────────────────────────
  usePower: (type) => {
    const { points, currentTurn, activeSong, team1Timeline, team2Timeline, playlist } = get();

    if (type === 'change') {
      // 4 puntos: cambiar canción activa por la siguiente del playlist
      if (points[currentTurn] < 4 || !playlist.length) return;
      const newPoints = [...points] as [number, number];
      newPoints[currentTurn] -= 4;
      set({
        points: newPoints,
        activeSong: playlist[0] || null,
        playlist: playlist.slice(1),
      });
    }

    if (type === 'auto') {
      // 10 puntos: colocar automáticamente en el lugar cronológico correcto
      if (points[currentTurn] < 10 || !activeSong) return;

      const timeline = currentTurn === 0 ? [...team1Timeline] : [...team2Timeline];

      // Encontrar posición correcta
      let insertIndex = timeline.length;
      for (let i = 0; i < timeline.length; i++) {
        if (activeSong.year <= timeline[i].year) {
          insertIndex = i;
          break;
        }
      }
      timeline.splice(insertIndex, 0, activeSong);

      const newPoints = [...points] as [number, number];
      newPoints[currentTurn] -= 10;

      set({
        points: newPoints,
        [currentTurn === 0 ? "team1Timeline" : "team2Timeline"]: timeline,
        activeSong: playlist[0] || null,
        playlist: playlist.slice(1),
        currentTurn: currentTurn === 0 ? 1 : 0,
        isPlaying: false,
      });
    }
  },
}));
