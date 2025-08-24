import { create } from 'zustand';

interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  hasGuessed?: boolean;
}

interface NotificationData {
  id: string;
  type: 'join' | 'leave';
  playerName: string;
  playerId: string;
}

interface RoundSummary {
  word: string;
  scores: Player[];
  currentRound?: number;
  maxRounds?: number;
}

interface FinalResults {
  finalScores: Player[];
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
  gameStarted: boolean;
  hasGuessedWord: boolean;
  roundSummary: RoundSummary | null;
  showingSummary: boolean;
  summaryCountdown: number;
  hostId: string | null;
  isHost: boolean;
  createdRoom: boolean; // Flag um zu erkennen ob dieser Spieler den Raum erstellt hat
  currentRound: number;
  maxRounds: number;
  gameFinished: boolean;
  finalResults: FinalResults | null;
  showingFinalResults: boolean;
  notifications: NotificationData[];
  setRoomId: (roomId: string) => void;
  setPlayers: (players: Player[]) => void;
  setWord: (word: string) => void;
  setHints: (hints: string[]) => void;
  setCurrentHintIndex: (index: number) => void;
  setTimer: (timer: number) => void;
  addChat: (msg: { sender: string; message: string }) => void;
  setGameOver: (over: boolean) => void;
  setGameStarted: (started: boolean) => void;
  setHasGuessedWord: (guessed: boolean) => void;
  setRoundSummary: (summary: RoundSummary | null) => void;
  setShowingSummary: (showing: boolean) => void;
  setSummaryCountdown: (countdown: number) => void;
  setHostId: (hostId: string) => void;
  setIsHost: (isHost: boolean) => void;
  setCreatedRoom: (created: boolean) => void;
  setCurrentRound: (round: number) => void;
  setMaxRounds: (rounds: number) => void;
  setGameFinished: (finished: boolean) => void;
  setFinalResults: (results: FinalResults | null) => void;
  setShowingFinalResults: (showing: boolean) => void;
  addNotification: (notification: Omit<NotificationData, 'id'>) => void;
  removeNotification: (id: string) => void;
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
  gameStarted: false,
  hasGuessedWord: false,
  roundSummary: null,
  showingSummary: false,
  summaryCountdown: 5,
  hostId: null,
  isHost: false,
  createdRoom: false,
  currentRound: 0,
  maxRounds: 3,
  gameFinished: false,
  finalResults: null,
  showingFinalResults: false,
  notifications: [],
  setRoomId: (roomId) => set({ roomId }),
  setPlayers: (players) => set({ players }),
  setWord: (word) => set({ word }),
  setHints: (hints) => set({ hints }),
  setCurrentHintIndex: (index) => set({ currentHintIndex: index }),
  setTimer: (timer) => set({ timer }),
  addChat: (msg) => set((state) => ({ chat: [...state.chat, msg] })),
  setGameOver: (gameOver) => set({ gameOver }),
  setGameStarted: (gameStarted) => set({ gameStarted }),
  setHasGuessedWord: (hasGuessedWord) => set({ hasGuessedWord }),
  setRoundSummary: (roundSummary) => set({ roundSummary }),
  setShowingSummary: (showingSummary) => set({ showingSummary }),
  setSummaryCountdown: (summaryCountdown) => set({ summaryCountdown }),
  setHostId: (hostId) => set({ hostId }),
  setIsHost: (isHost) => set({ isHost }),
  setCreatedRoom: (createdRoom) => set({ createdRoom }),
  setCurrentRound: (currentRound) => set({ currentRound }),
  setMaxRounds: (maxRounds) => set({ maxRounds }),
  setGameFinished: (gameFinished) => set({ gameFinished }),
  setFinalResults: (finalResults) => set({ finalResults }),
  setShowingFinalResults: (showingFinalResults) => set({ showingFinalResults }),
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
})); 