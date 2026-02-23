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
  placeSong: (index: number) => boolean;
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

  togglePlay: (val) => set({ isPlaying: val }),

  resetGame: () => set({ status: 'idle', isPlaying: false, activeSong: null }),

  startGame: async () => {
    set({ status: 'loading' });
    const res = await fetch('/api/songs');
    const songs = await res.json();
    
    set({
      activeSong: songs[1],
      playlist: songs.slice(2),
      team1Timeline: [songs[0]],
      team2Timeline: [songs[0]],
      status: 'playing',
      isPlaying: false
    });
  },

  placeSong: (index: number) => {
    const { activeSong, currentTurn, team1Timeline, team2Timeline, playlist } = get();
    if (!activeSong) return false;

    const timeline = currentTurn === 0 ? [...team1Timeline] : [...team2Timeline];
    const isCorrect = (!timeline[index - 1] || activeSong.year >= timeline[index - 1].year) &&
                      (!timeline[index] || activeSong.year <= timeline[index].year);
    
    if (isCorrect) timeline.splice(index, 0, activeSong);

    set({
      [currentTurn === 0 ? "team1Timeline" : "team2Timeline"]: timeline,
      activeSong: nextSong,
      playlist: playlist.slice(1),
      currentTurn: currentTurn === 0 ? 1 : 0,
      isPlaying: false, // Pausamos para que el reproductor detecte el cambio de ID en el siguiente click
    });
    return isCorrect;
  },
}));