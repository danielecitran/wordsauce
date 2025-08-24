import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

// __dirname ist in CommonJS direkt verfügbar

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
  hostId: string; // Der erste Spieler der den Raum erstellt hat
  currentRound: number; // Aktuelle Runde (1-3)
  maxRounds: number; // Maximale Anzahl Runden
  gameFinished: boolean; // Spiel komplett beendet
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

function createWordPattern(word: string): string {
  // Erstelle Unterstrich-Pattern basierend auf der tatsächlichen Wortlänge
  return (
    word
      .split('')
      .map(() => '_')
      .join(' ') + ' '
  );
}

io.on('connection', (socket: Socket) => {
  let currentRoom: string | null = null;
  let player: Player | null = null;

  socket.on('join-room', ({ room, name }, cb) => {
    if (!room || !name) return cb({ success: false, error: 'Ungültige Daten.' });
    currentRoom = room;
    const isNewRoom = !rooms.has(room);

    // Prüfe Spieleranzahl wenn Raum bereits existiert
    if (!isNewRoom) {
      const existingRoom = rooms.get(room)!;
      if (existingRoom.players.size >= 5) {
        return cb({ success: false, error: 'Dieser Raum ist bereits voll (maximal 5 Spieler).' });
      }
    }

    if (isNewRoom) {
      rooms.set(room, {
        players: new Map(),
        wordIndex: Math.floor(Math.random() * words.length),
        hintIndex: 0,
        timer: 60,
        gameOver: false,
        guessedPlayers: new Set(),
        gameStarted: false,
        hostId: socket.id, // Der erste Spieler wird zum Host
        currentRound: 0, // Noch keine Runde gestartet
        maxRounds: 3, // 3 Runden insgesamt
        gameFinished: false, // Spiel nicht beendet
      });
    }
    const avatar = [
      '🍀',
      '🦊',
      '🐧',
      '🐸',
      '🐼',
      '🦄',
      '🐝',
      '🐙',
      '🐵',
      '🐶',
      '🐱',
      '🐰',
      '🦉',
      '🐢',
      '🦋',
      '🐞',
      '🦕',
      '🦖',
      '🦩',
      '🦜',
    ][Math.floor(Math.random() * 20)];
    player = { id: socket.id, name, avatar, score: 0, hasGuessed: false };
    rooms.get(room)!.players.set(socket.id, player);
    socket.join(room);

    // Sofort Spielerliste an alle senden UND dem neuen Spieler das aktuelle Spiel-State
    const roomState = rooms.get(room)!;
    const playerList = Array.from(roomState.players.values());

    // Erst direkt an den neuen Spieler senden (sicherstellen dass er es bekommt)
    socket.emit('update-scores', playerList);
    socket.emit('host-info', { hostId: roomState.hostId });

    // Dann an alle anderen im Raum
    socket.to(room).emit('update-scores', playerList);
    socket.to(room).emit('host-info', { hostId: roomState.hostId });

    // Benachrichtigung an alle anderen Spieler über neuen Spieler (nur wenn nicht neuer Raum)
    if (!isNewRoom) {
      socket.to(room).emit('player-joined', { playerName: name, playerId: socket.id });
    }

    // Wenn ein Spiel läuft, sende dem neuen Spieler die aktuellen Spielinformationen
    if (roomState.gameStarted && !roomState.gameOver) {
      const { word, hints } = words[roomState.wordIndex];
      socket.emit('game-start', {
        word: createWordPattern(word),
        hints,
        currentRound: roomState.currentRound,
        maxRounds: roomState.maxRounds,
      });
      socket.emit('new-hint', roomState.hintIndex);
      socket.emit('timer', roomState.timer);
    }

    console.log(
      `Spieler ${name} ist Raum ${room} beigetreten. Aktuelle Spieler:`,
      playerList.map((p) => p.name),
      isNewRoom ? '(Neuer Raum - Host)' : '',
    );
    cb({
      success: true,
      roomState: {
        players: playerList,
        hostId: roomState.hostId,
        gameStarted: roomState.gameStarted,
        gameOver: roomState.gameOver,
        currentRound: roomState.currentRound,
        maxRounds: roomState.maxRounds,
        gameFinished: roomState.gameFinished,
      },
    });
  });

  // Neues Event nur für das Beitreten zu existierenden Räumen
  socket.on('join-existing-room', ({ room, name }, cb) => {
    if (!room || !name) return cb({ success: false, error: 'Ungültige Daten.' });

    // Prüfe ob der Raum existiert
    if (!rooms.has(room)) {
      return cb({ success: false, error: `Raum "${room}" existiert nicht.` });
    }

    // Prüfe Spieleranzahl
    const existingRoom = rooms.get(room)!;
    if (existingRoom.players.size >= 5) {
      return cb({ success: false, error: 'Dieser Raum ist bereits voll (maximal 5 Spieler).' });
    }

    // Raum existiert - verwende die gleiche Logik wie join-room
    currentRoom = room;
    const avatar = [
      '🍀',
      '🦊',
      '🐧',
      '🐸',
      '🐼',
      '🦄',
      '🐝',
      '🐙',
      '🐵',
      '🐶',
      '🐱',
      '🐰',
      '🦉',
      '🐢',
      '🦋',
      '🐞',
      '🦕',
      '🦖',
      '🦩',
      '🦜',
    ][Math.floor(Math.random() * 20)];
    player = { id: socket.id, name, avatar, score: 0, hasGuessed: false };
    rooms.get(room)!.players.set(socket.id, player);
    socket.join(room);

    // Sofort Spielerliste an alle senden UND dem neuen Spieler das aktuelle Spiel-State
    const roomState = rooms.get(room)!;
    const playerList = Array.from(roomState.players.values());

    // Erst direkt an den neuen Spieler senden (sicherstellen dass er es bekommt)
    socket.emit('update-scores', playerList);
    socket.emit('host-info', { hostId: roomState.hostId });

    // Dann an alle anderen im Raum
    socket.to(room).emit('update-scores', playerList);
    socket.to(room).emit('host-info', { hostId: roomState.hostId });

    // Benachrichtigung an alle anderen Spieler über neuen Spieler
    socket.to(room).emit('player-joined', { playerName: name, playerId: socket.id });

    // Wenn ein Spiel läuft, sende dem neuen Spieler die aktuellen Spielinformationen
    if (roomState.gameStarted && !roomState.gameOver) {
      const { word, hints } = words[roomState.wordIndex];
      socket.emit('game-start', {
        word: createWordPattern(word),
        hints,
        currentRound: roomState.currentRound,
        maxRounds: roomState.maxRounds,
      });
      socket.emit('new-hint', roomState.hintIndex);
      socket.emit('timer', roomState.timer);
    }

    console.log(
      `Spieler ${name} ist bestehendem Raum ${room} beigetreten. Aktuelle Spieler:`,
      playerList.map((p) => p.name),
    );
    cb({
      success: true,
      roomState: {
        players: playerList,
        hostId: roomState.hostId,
        gameStarted: roomState.gameStarted,
        gameOver: roomState.gameOver,
        currentRound: roomState.currentRound,
        maxRounds: roomState.maxRounds,
        gameFinished: roomState.gameFinished,
      },
    });
  });

  socket.on('start-game', () => {
    if (!currentRoom) return;
    const state = rooms.get(currentRoom);
    if (!state) return;

    // Nur der Host kann das Spiel starten
    if (state.hostId !== socket.id) {
      console.log(
        `Spieler ${socket.id} versucht Spiel zu starten, aber ist nicht Host in Raum ${currentRoom}`,
      );
      return;
    }

    // Mindestens 2 Spieler erforderlich
    if (state.players.size < 2) {
      console.log(
        `Host ${socket.id} versucht Spiel zu starten, aber nur ${state.players.size} Spieler im Raum ${currentRoom}`,
      );
      return;
    }

    console.log(
      `Host ${socket.id} startet das Spiel in Raum ${currentRoom} mit ${state.players.size} Spielern`,
    );
    startNewRound(currentRoom, state);
  });

  // Neues Spiel starten Event
  socket.on('restart-game', () => {
    if (!currentRoom) return;
    const state = rooms.get(currentRoom);
    if (!state) return;

    // Nur der Host kann das Spiel neu starten
    if (state.hostId !== socket.id) {
      console.log(
        `Spieler ${socket.id} versucht Spiel neu zu starten, aber ist nicht Host in Raum ${currentRoom}`,
      );
      return;
    }

    // Mindestens 2 Spieler erforderlich
    if (state.players.size < 2) {
      console.log(
        `Host ${socket.id} versucht Spiel neu zu starten, aber nur ${state.players.size} Spieler im Raum ${currentRoom}`,
      );
      return;
    }

    console.log(
      `Host ${socket.id} startet neues Spiel in Raum ${currentRoom} mit ${state.players.size} Spielern`,
    );

    // Spiel-State zurücksetzen
    state.currentRound = 0;
    state.gameFinished = false;
    state.gameStarted = false;
    state.gameOver = false;

    // Alle Spieler-Scores zurücksetzen
    state.players.forEach((player) => {
      player.score = 0;
      player.hasGuessed = false;
    });

    // Neue erste Runde starten
    startNewRound(currentRoom, state);
  });

  function startNewRound(roomId: string, state: RoomState) {
    // Erhöhe Rundenzähler
    state.currentRound++;

    state.wordIndex = Math.floor(Math.random() * words.length);
    state.hintIndex = 0;
    state.timer = 60;
    state.gameOver = false;
    state.gameStarted = true;
    state.guessedPlayers.clear();

    state.players.forEach((player) => {
      player.hasGuessed = false;
    });

    const { word, hints } = words[state.wordIndex];

    // Sende Rundeninformationen mit
    io.to(roomId).emit('game-start', {
      word: createWordPattern(word),
      hints,
      currentRound: state.currentRound,
      maxRounds: state.maxRounds,
    });
    io.to(roomId).emit('update-scores', Array.from(state.players.values()));

    console.log(
      `Neue Runde ${state.currentRound}/${state.maxRounds} in Raum ${roomId} gestartet. Wort: ${word}`,
    );

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

    console.log(
      `Runde ${state.currentRound}/${state.maxRounds} beendet in Raum ${roomId}. Wort war: ${word}`,
    );

    // Game Over Event zuerst senden
    io.to(roomId).emit('game-over');

    // Prüfen ob das Spiel nach 3 Runden beendet werden soll
    const isGameFinished = state.currentRound >= state.maxRounds;

    // Dann Round Summary nach kurzer Verzögerung
    setTimeout(() => {
      if (isGameFinished) {
        // Spiel ist beendet - sende finale Ergebnisse
        state.gameFinished = true;
        console.log(`Spiel in Raum ${roomId} beendet nach ${state.maxRounds} Runden`);

        io.to(roomId).emit('game-finished', {
          finalScores: Array.from(state.players.values()).sort((a, b) => b.score - a.score),
        });
      } else {
        // Normale Rundenzusammenfassung
        io.to(roomId).emit('round-summary', {
          word: word,
          scores: Array.from(state.players.values()),
          currentRound: state.currentRound,
          maxRounds: state.maxRounds,
        });

        // 5 Sekunden warten, dann neue Runde starten
        if (state.roundSummaryTimeout) clearTimeout(state.roundSummaryTimeout);
        state.roundSummaryTimeout = setTimeout(() => {
          if (state.players.size > 0 && !state.gameFinished) {
            startNewRound(roomId, state);
          }
        }, 5000);
      }
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
        word: word,
      });

      io.to(currentRoom).emit('chat-message', {
        sender: 'System',
        message: `${p.name} hat das Wort erraten! (+${points} Punkte)`,
      });

      io.to(currentRoom).emit('update-scores', Array.from(state.players.values()));

      // NEUE LOGIK: Prüfe ob alle Spieler erraten haben
      if (checkAllPlayersGuessed(currentRoom, state)) {
        console.log(
          `Alle Spieler in Raum ${currentRoom} haben das Wort erraten! Beende Runde vorzeitig.`,
        );
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
      const wasHost = state.hostId === socket.id;
      const leavingPlayer = state.players.get(socket.id);
      const playerName = leavingPlayer?.name || 'Unbekannter Spieler';

      state.players.delete(socket.id);
      state.guessedPlayers.delete(socket.id);

      console.log(
        `Spieler ${playerName} hat Raum ${currentRoom} verlassen. Verbleibende Spieler: ${state.players.size}`,
        wasHost ? '(War Host)' : '',
      );

      if (state.players.size === 0) {
        console.log(`Raum ${currentRoom} ist leer, lösche Raum`);
        if (state.interval) clearInterval(state.interval);
        if (state.roundSummaryTimeout) clearTimeout(state.roundSummaryTimeout);
        rooms.delete(currentRoom);
      } else {
        // Benachrichtigung an alle verbleibenden Spieler über verlassenen Spieler
        io.to(currentRoom).emit('player-left', { playerName, playerId: socket.id });

        // Wenn der Host geht, mache den ersten verbleibenden Spieler zum neuen Host
        if (wasHost) {
          const newHostId = Array.from(state.players.keys())[0];
          state.hostId = newHostId;
          console.log(`Neuer Host in Raum ${currentRoom}: ${newHostId}`);

          // Informiere alle über den neuen Host
          io.to(currentRoom).emit('host-info', { hostId: state.hostId });
        }

        io.to(currentRoom).emit('update-scores', Array.from(state.players.values()));
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
