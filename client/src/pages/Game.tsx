import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '../store';
import Timer from '../components/Timer';
import Chat from '../components/Chat';
import Scoreboard from '../components/Scoreboard';
import NotificationManager from '../components/NotificationManager';
import { socket } from '../socket';
import logo from '../assets/images/wordsauce.png';

const Game: React.FC = () => {
  const { roomId } = useParams();
  const [answer, setAnswer] = useState('');
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  
  const word = useGameStore((s) => s.word);
  const hints = useGameStore((s) => s.hints);
  const currentHintIndex = useGameStore((s) => s.currentHintIndex);
  const timer = useGameStore((s) => s.timer);
  const gameOver = useGameStore((s) => s.gameOver);
  const gameStarted = useGameStore((s) => s.gameStarted);
  const players = useGameStore((s) => s.players);
  const hasGuessedWord = useGameStore((s) => s.hasGuessedWord);
  const roundSummary = useGameStore((s) => s.roundSummary);
  const showingSummary = useGameStore((s) => s.showingSummary);
  const summaryCountdown = useGameStore((s) => s.summaryCountdown);
  const isHost = useGameStore((s) => s.isHost);
  const createdRoom = useGameStore((s) => s.createdRoom);
  const currentRound = useGameStore((s) => s.currentRound);
  const maxRounds = useGameStore((s) => s.maxRounds);
  const gameFinished = useGameStore((s) => s.gameFinished);
  const finalResults = useGameStore((s) => s.finalResults);
  const showingFinalResults = useGameStore((s) => s.showingFinalResults);
  const notifications = useGameStore((s) => s.notifications);
  
  const setWord = useGameStore((s) => s.setWord);
  const setHints = useGameStore((s) => s.setHints);
  const setCurrentHintIndex = useGameStore((s) => s.setCurrentHintIndex);
  const setTimer = useGameStore((s) => s.setTimer);
  const setGameOver = useGameStore((s) => s.setGameOver);
  const setGameStarted = useGameStore((s) => s.setGameStarted);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const setHasGuessedWord = useGameStore((s) => s.setHasGuessedWord);
  const setRoundSummary = useGameStore((s) => s.setRoundSummary);
  const setShowingSummary = useGameStore((s) => s.setShowingSummary);
  const setSummaryCountdown = useGameStore((s) => s.setSummaryCountdown);
  const setHostId = useGameStore((s) => s.setHostId);
  const setIsHost = useGameStore((s) => s.setIsHost);
  const setCurrentRound = useGameStore((s) => s.setCurrentRound);
  const setMaxRounds = useGameStore((s) => s.setMaxRounds);
  const setGameFinished = useGameStore((s) => s.setGameFinished);
  const setFinalResults = useGameStore((s) => s.setFinalResults);
  const setShowingFinalResults = useGameStore((s) => s.setShowingFinalResults);
  const addNotification = useGameStore((s) => s.addNotification);
  const removeNotification = useGameStore((s) => s.removeNotification);

  useEffect(() => {
    socket.on('game-start', ({ word, hints, currentRound, maxRounds }) => {
      console.log('Spiel gestartet', { currentRound, maxRounds });
      setWord(word);
      setHints(hints);
      setCurrentRound(currentRound || 1);
      setMaxRounds(maxRounds || 3);
      setCurrentHintIndex(0);
      setTimer(60);
      setGameOver(false);
      setGameStarted(true);
      setHasGuessedWord(false);
      setShowingSummary(false);
      setRoundSummary(null);
      setShowingFinalResults(false);
      setGameFinished(false);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    });
    
    socket.on('new-hint', (index) => {
      setCurrentHintIndex(index);
    });
    
    socket.on('timer', (t) => setTimer(t));
    
    socket.on('game-over', () => {
      console.log('Game Over Event empfangen');
      setGameOver(true);
      setGameStarted(false);
      // NICHT sofort Round Summary anzeigen - warten auf round-summary Event
    });
    
    socket.on('update-scores', (playerList) => {
      setPlayers(playerList);
    });
    
    socket.on('player-guessed', ({ playerId, playerName, points, word }) => {
      console.log('Spieler hat erraten:', playerName);
      if (playerId === socket.id) {
        setHasGuessedWord(true);
      }
      // Spiel läuft weiter! Keine UI-Änderungen außer hasGuessedWord
    });
    
    // Round Summary Event - NUR hier wird die Summary angezeigt
    socket.on('round-summary', ({ word, scores, currentRound, maxRounds }) => {
      console.log('Round Summary empfangen:', { word, scores, currentRound, maxRounds });
      setRoundSummary({ word, scores, currentRound, maxRounds });
      setShowingSummary(true);
      setSummaryCountdown(5);
      
      // 5 Sekunden Countdown
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      let countdown = 5;
      setSummaryCountdown(countdown);
      countdownInterval.current = setInterval(() => {
        countdown -= 1;
        setSummaryCountdown(countdown);
        if (countdown <= 0) {
          console.log('Countdown beendet, verstecke Summary');
          if (countdownInterval.current) clearInterval(countdownInterval.current);
          setShowingSummary(false);
          setRoundSummary(null);
        }
      }, 1000);
    });

    // Game Finished Event - Finale Ergebnisse anzeigen
    socket.on('game-finished', ({ finalScores }) => {
      console.log('Spiel beendet - Finale Ergebnisse:', finalScores);
      setGameFinished(true);
      setGameStarted(false);
      setFinalResults({ finalScores });
      setShowingFinalResults(true);
      setShowingSummary(false);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    });
    
    // Host Info Event - empfange Host-Information
    socket.on('host-info', ({ hostId }) => {
      console.log('Host Info empfangen:', hostId);
      setHostId(hostId);
      setIsHost(hostId === socket.id);
    });

    // Spieler-Events für Benachrichtigungen
    socket.on('player-joined', ({ playerName, playerId }) => {
      console.log('Spieler beigetreten:', { playerName, playerId });
      addNotification({
        type: 'join',
        playerName: playerName || 'Unbekannter Spieler',
        playerId: playerId || 'unknown',
      });
    });

    socket.on('player-left', ({ playerName, playerId }) => {
      console.log('Spieler verlassen:', { playerName, playerId });
      addNotification({
        type: 'leave',
        playerName: playerName || 'Unbekannter Spieler',
        playerId: playerId || 'unknown',
      });
    });
    
    return () => {
      socket.off('game-start');
      socket.off('new-hint');
      socket.off('timer');
      socket.off('game-over');
      socket.off('update-scores');
      socket.off('player-guessed');
      socket.off('round-summary');
      socket.off('game-finished');
      socket.off('host-info');
      socket.off('player-joined');
      socket.off('player-left');
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
      }, [setWord, setHints, setCurrentHintIndex, setTimer, setGameOver, setGameStarted, setPlayers, setHasGuessedWord, setRoundSummary, setShowingSummary, setSummaryCountdown, setHostId, setIsHost, setCurrentRound, setMaxRounds, setGameFinished, setFinalResults, setShowingFinalResults, addNotification]);

  const handleStartGame = () => {
    socket.emit('start-game');
  };

  const handleRestartGame = () => {
    socket.emit('restart-game');
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() && gameStarted && !gameOver && !hasGuessedWord) {
      socket.emit('player-answer', answer.trim());
      setAnswer('');
    }
  };

  // Final Results Component
  const FinalResultsView = () => {
    const winner = finalResults?.finalScores[0];
    const otherPlayers = finalResults?.finalScores.slice(1) || [];

    return (
      <div className="w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-4xl mx-auto">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-bold mb-6 text-gray-800">Spiel beendet!</h1>
          
          {/* Winner Display */}
          {winner && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-yellow-200 to-yellow-400 rounded-2xl p-6 shadow-lg border-4 border-yellow-500">
                <div className="text-2xl mb-2">👑 GEWINNER 👑</div>
                <div className="flex items-center justify-center gap-4 mb-3">
                  <span className="text-6xl">{winner.avatar}</span>
                  <div>
                    <div className="text-3xl font-bold text-yellow-800">{winner.name}</div>
                    <div className="text-5xl font-bold text-yellow-600">{winner.score} Punkte</div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-yellow-700">
                  🎉 Herzlichen Glückwunsch! 🎉
                </div>
              </div>
            </div>
          )}

          {/* Other Players */}
          {otherPlayers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-700">🏅 Weitere Platzierungen</h3>
              <div className="grid gap-3 max-w-2xl mx-auto">
                {otherPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transform transition-transform hover:scale-105 ${
                      index === 0 ? 'bg-gradient-to-r from-gray-200 to-gray-300 border-gray-400' :
                      index === 1 ? 'bg-gradient-to-r from-orange-200 to-orange-300 border-orange-400' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md ${
                        index === 0 ? 'bg-gray-500' : index === 1 ? 'bg-orange-500' : 'bg-gray-400'
                      }`}>
                        {index + 2}
                      </div>
                      <span className="text-3xl">{player.avatar}</span>
                      <div className="text-lg font-bold text-gray-800">{player.name}</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{player.score} Punkte</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restart Button */}
          {isHost && (
            <div className="mt-8">
              <button
                onClick={handleRestartGame}
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 text-lg"
              >
                🎮 Neues Spiel starten
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Round Summary Component
  const RoundSummaryView = () => (
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center max-w-3xl mx-auto">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          Runde {roundSummary?.currentRound || 1} von {roundSummary?.maxRounds || 3} beendet!
        </h2>
        
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 mb-6">
          <div className="text-sm text-gray-600 mb-2">Das Wort war:</div>
          <div className="text-3xl font-bold text-purple-600 tracking-wide">{roundSummary?.word}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-inner border border-gray-100">
          <h3 className="text-xl font-bold mb-4 text-gray-700">🏆 Ergebnisse</h3>
          <div className="grid gap-3">
            {roundSummary?.scores
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transform transition-transform hover:scale-105 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-200 to-yellow-300 border-yellow-400 shadow-md' :
                    index === 1 ? 'bg-gradient-to-r from-gray-200 to-gray-300 border-gray-400' :
                    index === 2 ? 'bg-gradient-to-r from-orange-200 to-orange-300 border-orange-400' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-500' : index === 2 ? 'bg-orange-500' : 'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-2xl">{player.avatar}</span>
                    <div>
                      <div className="font-bold text-gray-800">{player.name}</div>
                      {player.hasGuessed && <div className="text-green-600 text-xs">✓ Erraten!</div>}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{player.score}</div>
                </div>
              ))}
          </div>
        </div>
        
        <div className="mt-6 bg-purple-100 rounded-xl p-3">
          <div className="text-purple-700 font-bold text-lg">
            ⏱️ Nächste Runde in {summaryCountdown} Sekunden...
          </div>
        </div>
      </div>
    </div>
  );

      return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 w-full game-container">
        <div className="max-w-7xl mx-auto p-2 lg:p-4 w-full">
        {showingFinalResults ? (
          <FinalResultsView />
        ) : showingSummary ? (
          <RoundSummaryView />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 w-full">
            
            {/* Main Game Area - Takes 3 columns on lg screens */}
            <div className="lg:col-span-3 space-y-3">
              
              {/* Header Card */}
              <div className="bg-white rounded-2xl shadow-lg p-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={logo} 
                      alt="wordsauce" 
                      className="h-12 drop-shadow-lg hover:scale-110 transition-transform duration-300"
                    />
                    <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full border border-green-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-semibold text-green-700 text-sm">Raum: {roomId}</span>
                    </div>
                  </div>
                  
                  {/* Spiel läuft bereits */}
                  {gameStarted || (word && !gameOver) ? (
                    <div className="bg-purple-100 border border-purple-300 text-purple-700 px-4 py-2 rounded-xl text-sm">
                      🎮 Runde {currentRound}/{maxRounds} - Viel Erfolg!
                    </div>
                  ) : /* Noch kein Spiel gestartet */ players.length === 0 && createdRoom ? (
                    <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-xl text-sm">
                      👥 Warte auf andere Spieler...
                    </div>
                  ) : players.length <= 1 ? (
                    players.length === 0 ? (
                      <div className="bg-blue-100 border border-blue-300 text-blue-700 px-4 py-2 rounded-xl text-sm">
                        ⏳ Lade Spiel...
                      </div>
                    ) : (
                      <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-xl text-sm">
                        👥 Warte auf andere Spieler...
                      </div>
                    )
                  ) : (isHost || createdRoom) ? (
                    <button
                      onClick={handleStartGame}
                      className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-2 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      🚀 Spiel starten
                    </button>
                  ) : (
                    <div className="bg-orange-100 border border-orange-300 text-orange-700 px-4 py-2 rounded-xl text-sm">
                      👑 Warte auf den Gastgeber...
                    </div>
                  )}
                </div>
              </div>

              {gameStarted && (
                <>
                  {/* Word Display Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-3 font-semibold">🎯 Erratet das Wort:</div>
                      <div className="bg-gradient-to-r from-purple-200 to-blue-200 rounded-xl p-4 mb-4">
                        <div className="text-2xl sm:text-3xl font-bold tracking-[0.2em] text-purple-700 font-mono">
                          {word || '_____'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-2 inline-block">
                        <Timer />
                      </div>
                    </div>
                  </div>

                  {/* Hints Card */}
                  <div className="bg-white rounded-2xl shadow-lg p-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-orange-600 mb-1">💡 Hinweise</h3>
                      <div className="text-gray-600 text-xs">Neue Hinweise alle 15 Sekunden</div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {hints.map((hint, i) => (
                        <div
                          key={i}
                          className={`relative p-3 rounded-xl border text-center font-semibold transition-all duration-300 text-sm ${
                            i <= currentHintIndex 
                              ? 'bg-gradient-to-r from-orange-300 to-yellow-300 border-orange-400 text-orange-800 shadow-md' 
                              : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {i <= currentHintIndex && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                              ✓
                            </div>
                          )}
                          <div className="text-lg mb-1">
                            {i <= currentHintIndex ? '🔓' : '🔒'}
                          </div>
                          <div className="text-xs">
                            {i <= currentHintIndex ? hint : '???'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Success Message */}
                  {hasGuessedWord && (
                    <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white p-3 rounded-2xl text-center shadow-lg">
                      <div className="text-2xl mb-1">🎉</div>
                      <div className="text-lg font-bold mb-1">Fantastisch! Du hast es erraten!</div>
                      <div className="text-sm opacity-90">Das Spiel läuft weiter - andere können noch raten!</div>
                    </div>
                  )}

                  {/* Answer Input Card */}
                  {!hasGuessedWord && (
                    <div className="bg-white rounded-2xl shadow-lg p-4">
                      <div className="text-center mb-3">
                        <h3 className="text-lg font-bold text-green-600">✏️ Deine Antwort</h3>
                      </div>
                      <form onSubmit={handleSubmitAnswer} className="flex gap-3">
                        <input
                          className="flex-1 px-4 py-3 rounded-xl border-2 border-green-300 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 font-semibold text-center transition-all"
                          placeholder="Schreibe deine Antwort hier..."
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          maxLength={50}
                        />
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                          📤 Senden
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Sidebar - Live Feed and Leaderboard */}
            <div className="lg:col-span-1 space-y-3 w-full">
              
              {/* Live Feed */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col" style={{ height: '320px' }}>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 flex-shrink-0">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    📡 Live Feed
                  </h3>
                </div>
                <div className="flex-1 p-2 overflow-hidden">
                  <Chat />
                </div>
              </div>
              
              {/* Leaderboard */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col" style={{ height: '320px' }}>
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-3 flex-shrink-0">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    🏆 Leaderboard
                  </h3>
                </div>
                <div className="flex-1 p-2 overflow-hidden">
                  <Scoreboard />
                </div>
              </div>
              
            </div>
          </div>
        )}
        
        {/* Notification Manager */}
        <NotificationManager 
          notifications={notifications}
          onRemoveNotification={removeNotification}
        />
      </div>
    </div>
  );
};

export default Game; 