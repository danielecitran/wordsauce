import { create } from 'zustand';

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  hasGuessed?: boolean;
}

interface RoundSummary {
  word: string;
  scores: Player[];
}

interface GameState {
  roomId: string | null;
  players: Player[];
  word: string | null;
  hints: string[];
  currentHintIndex: number;
  timer: number;
  chat: { sender: string; message: string }[];
  gameOver: boolean;
  hasGuessedWord: boolean;
  roundSummary: RoundSummary | null;
  showingSummary: boolean;
  summaryCountdown: number;
  setRoomId: (roomId: string) => void;
  setPlayers: (players: Player[]) => void;
  setWord: (word: string) => void;
  setHints: (hints: string[]) => void;
  setCurrentHintIndex: (index: number) => void;
  setTimer: (timer: number) => void;
  addChat: (msg: { sender: string; message: string }) => void;
  setGameOver: (over: boolean) => void;
  setHasGuessedWord: (guessed: boolean) => void;
  setRoundSummary: (summary: RoundSummary | null) => void;
  setShowingSummary: (showing: boolean) => void;
  setSummaryCountdown: (countdown: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  roomId: null,
  players: [],
  word: null,
  hints: [],
  currentHintIndex: 0,
  timer: 60,
  chat: [],
  gameOver: false,
  hasGuessedWord: false,
  roundSummary: null,
  showingSummary: false,
  summaryCountdown: 5,
  setRoomId: (roomId) => set({ roomId }),
  setPlayers: (players) => set({ players }),
  setWord: (word) => set({ word }),
  setHints: (hints) => set({ hints }),
  setCurrentHintIndex: (index) => set({ currentHintIndex: index }),
  setTimer: (timer) => set({ timer }),
  addChat: (msg) => set((state) => ({ chat: [...state.chat, msg] })),
  setGameOver: (gameOver) => set({ gameOver }),
  setHasGuessedWord: (hasGuessedWord) => set({ hasGuessedWord }),
  setRoundSummary: (roundSummary) => set({ roundSummary }),
  setShowingSummary: (showingSummary) => set({ showingSummary }),
  setSummaryCountdown: (summaryCountdown) => set({ summaryCountdown }),
})); 