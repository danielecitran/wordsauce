import express from 'express';
import * as http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());

// Statische Files aus dem Client-Build servieren (für Production)
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  console.log(`Serviere statische Files aus: ${clientDistPath}`);
}

// Health-Check
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Wortliste laden
const wordsPath = path.join(__dirname, '../data/words.json');
const words: { word: string; hints: string[] }[] = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));

// Raumverwaltung
interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  hasGuessed?: boolean;
}
interface RoomState {
  players: Map<string, Player>;
  wordIndex: number;
  hintIndex: number;
  timer: number;
  interval?: NodeJS.Timeout;
  gameOver: boolean;
  guessedPlayers: Set<string>;
  gameStarted: boolean;
  roundSummaryTimeout?: NodeJS.Timeout;
}
const rooms = new Map<string, RoomState>();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

function checkAllPlayersGuessed(roomId: string, state: RoomState): boolean {
  // Prüfe ob alle Spieler das Wort erraten haben
  const totalPlayers = state.players.size;
  const guessedCount = state.guessedPlayers.size;
  
  console.log(`Raum ${roomId}: ${guessedCount}/${totalPlayers} Spieler haben erraten`);
  
  return totalPlayers > 0 && guessedCount === totalPlayers;
}

io.on('connection', (socket: Socket) => {
  let currentRoom: string | null = null;
  let player: Player | null = null;

  socket.on('join-room', ({ room, name }, cb) => {
    if (!room || !name) return cb({ success: false, error: 'Ungültige Daten.' });
    currentRoom = room;
    if (!rooms.has(room)) {
      rooms.set(room, {
        players: new Map(),
        wordIndex: Math.floor(Math.random() * words.length),
        hintIndex: 0,
        timer: 60,
        gameOver: false,
        guessedPlayers: new Set(),
        gameStarted: false,
      });
    }
    const avatar = ['🍀','🦊','🐧','🐸','🐼','🦄','🐝','🐙','🐵','🐶','🐱','🐰','🦉','🐢','🦋','🐞','🦕','🦖','🦩','🦜'][Math.floor(Math.random()*20)];
    player = { id: socket.id, name, avatar, score: 0, hasGuessed: false };
    rooms.get(room)!.players.set(socket.id, player);
    socket.join(room);
    
    // Sofort Spielerliste an alle senden UND dem neuen Spieler das aktuelle Spiel-State
    const roomState = rooms.get(room)!;
    const playerList = Array.from(roomState.players.values());
    io.to(room).emit('update-scores', playerList);
    
    // Wenn ein Spiel läuft, sende dem neuen Spieler die aktuellen Spielinformationen
    if (roomState.gameStarted && !roomState.gameOver) {
      const { word, hints } = words[roomState.wordIndex];
      socket.emit('game-start', { word: '_____ ', hints });
      socket.emit('new-hint', roomState.hintIndex);
      socket.emit('timer', roomState.timer);
    }
    
    console.log(`Spieler ${name} ist Raum ${room} beigetreten. Aktuelle Spieler:`, playerList.map(p => p.name));
    cb({ success: true });
  });

  socket.on('start-game', () => {
    if (!currentRoom) return;
    const state = rooms.get(currentRoom);
    if (!state) return;
    
    startNewRound(currentRoom, state);
  });

  function startNewRound(roomId: string, state: RoomState) {
    state.wordIndex = Math.floor(Math.random() * words.length);
    state.hintIndex = 0;
    state.timer = 60;
    state.gameOver = false;
    state.gameStarted = true;
    state.guessedPlayers.clear();
    
    state.players.forEach(player => {
      player.hasGuessed = false;
    });
    
    const { word, hints } = words[state.wordIndex];
    io.to(roomId).emit('game-start', { word: '_____ ', hints });
    io.to(roomId).emit('update-scores', Array.from(state.players.values()));
    
    console.log(`Neue Runde in Raum ${roomId} gestartet. Wort: ${word}`);
    
    if (state.interval) clearInterval(state.interval);
    state.interval = setInterval(() => {
      if (state.timer > 0 && !state.gameOver) {
        state.timer--;
        io.to(roomId).emit('timer', state.timer);
        if ([45, 30, 15, 0].includes(state.timer) && state.hintIndex < 4) {
          state.hintIndex++;
          io.to(roomId).emit('new-hint', state.hintIndex);
        }
        if (state.timer === 0) {
          endRound(roomId, state);
        }
      }
    }, 1000);
  }

  function endRound(roomId: string, state: RoomState) {
    state.gameOver = true;
    state.gameStarted = false;
    if (state.interval) clearInterval(state.interval);
    
    const { word } = words[state.wordIndex];
    
    console.log(`Runde beendet in Raum ${roomId}. Wort war: ${word}`);
    
    // Game Over Event zuerst senden
    io.to(roomId).emit('game-over');
    
    // Dann Round Summary nach kurzer Verzögerung
    setTimeout(() => {
      io.to(roomId).emit('round-summary', {
        word: word,
        scores: Array.from(state.players.values()),
      });
      
      // 5 Sekunden warten, dann neue Runde starten
      if (state.roundSummaryTimeout) clearTimeout(state.roundSummaryTimeout);
      state.roundSummaryTimeout = setTimeout(() => {
        if (state.players.size > 0) {
          startNewRound(roomId, state);
        }
      }, 5000);
    }, 500);
  }

  socket.on('player-answer', (answer: string) => {
    if (!currentRoom) return;
    const state = rooms.get(currentRoom);
    if (!state || state.gameOver || !state.gameStarted) return;
    
    const p = state.players.get(socket.id);
    if (!p || p.hasGuessed) return;
    
    const { word } = words[state.wordIndex];
    if (answer.trim().toLowerCase() === word.toLowerCase()) {
      const points = 4 - state.hintIndex >= 1 ? 4 - state.hintIndex : 1;
      p.score += points;
      p.hasGuessed = true;
      state.guessedPlayers.add(socket.id);
      
      io.to(currentRoom).emit('player-guessed', { 
        playerId: socket.id, 
        playerName: p.name, 
        points: points,
        word: word 
      });
      
      io.to(currentRoom).emit('chat-message', { 
        sender: 'System', 
        message: `🎉 ${p.name} hat das Wort erraten! (+${points} Punkte)` 
      });
      
      io.to(currentRoom).emit('update-scores', Array.from(state.players.values()));
      
      // NEUE LOGIK: Prüfe ob alle Spieler erraten haben
      if (checkAllPlayersGuessed(currentRoom, state)) {
        console.log(`Alle Spieler in Raum ${currentRoom} haben das Wort erraten! Beende Runde vorzeitig.`);
        // Beende die Runde sofort
        endRound(currentRoom, state);
      }
    } else {
      // Falsche Antwort als Chat-Nachricht senden
      io.to(currentRoom).emit('chat-message', { sender: p.name, message: answer });
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const state = rooms.get(currentRoom)!;
      state.players.delete(socket.id);
      state.guessedPlayers.delete(socket.id);
      
      console.log(`Spieler hat Raum ${currentRoom} verlassen. Verbleibende Spieler: ${state.players.size}`);
      
      io.to(currentRoom).emit('update-scores', Array.from(state.players.values()));
      if (state.players.size === 0) {
        console.log(`Raum ${currentRoom} ist leer, lösche Raum`);
        if (state.interval) clearInterval(state.interval);
        if (state.roundSummaryTimeout) clearTimeout(state.roundSummaryTimeout);
        rooms.delete(currentRoom);
      }
    }
  });
});

// Catch-All-Route für SPA (muss nach allen anderen API-Routen stehen)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../../client/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Frontend nicht gefunden' });
  }
});

server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
}); 