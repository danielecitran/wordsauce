import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '../store';
import Timer from '../components/Timer';
import Chat from '../components/Chat';
import Scoreboard from '../components/Scoreboard';
import { socket } from '../socket';

const Game: React.FC = () => {
  const { roomId } = useParams();
  const [answer, setAnswer] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  
  const word = useGameStore((s) => s.word);
  const hints = useGameStore((s) => s.hints);
  const currentHintIndex = useGameStore((s) => s.currentHintIndex);
  const timer = useGameStore((s) => s.timer);
  const gameOver = useGameStore((s) => s.gameOver);
  const players = useGameStore((s) => s.players);
  const hasGuessedWord = useGameStore((s) => s.hasGuessedWord);
  const roundSummary = useGameStore((s) => s.roundSummary);
  const showingSummary = useGameStore((s) => s.showingSummary);
  const summaryCountdown = useGameStore((s) => s.summaryCountdown);
  
  const setWord = useGameStore((s) => s.setWord);
  const setHints = useGameStore((s) => s.setHints);
  const setCurrentHintIndex = useGameStore((s) => s.setCurrentHintIndex);
  const setTimer = useGameStore((s) => s.setTimer);
  const setGameOver = useGameStore((s) => s.setGameOver);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const setHasGuessedWord = useGameStore((s) => s.setHasGuessedWord);
  const setRoundSummary = useGameStore((s) => s.setRoundSummary);
  const setShowingSummary = useGameStore((s) => s.setShowingSummary);
  const setSummaryCountdown = useGameStore((s) => s.setSummaryCountdown);

  useEffect(() => {
    socket.on('game-start', ({ word, hints }) => {
      console.log('Spiel gestartet');
      setWord(word);
      setHints(hints);
      setCurrentHintIndex(0);
      setTimer(60);
      setGameOver(false);
      setGameStarted(true);
      setHasGuessedWord(false);
      setShowingSummary(false);
      setRoundSummary(null);
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
    socket.on('round-summary', ({ word, scores }) => {
      console.log('Round Summary empfangen:', { word, scores });
      setRoundSummary({ word, scores });
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
    
    return () => {
      socket.off('game-start');
      socket.off('new-hint');
      socket.off('timer');
      socket.off('game-over');
      socket.off('update-scores');
      socket.off('player-guessed');
      socket.off('round-summary');
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [setWord, setHints, setCurrentHintIndex, setTimer, setGameOver, setPlayers, setHasGuessedWord, setRoundSummary, setShowingSummary, setSummaryCountdown]);

  const handleStartGame = () => {
    socket.emit('start-game');
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() && gameStarted && !gameOver && !hasGuessedWord) {
      socket.emit('player-answer', answer.trim());
      setAnswer('');
    }
  };

  // Round Summary Component
  const RoundSummaryView = () => (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-neumorph p-8 text-center">
      <h2 className="text-3xl font-bold mb-6 text-accent">🎉 Runde beendet!</h2>
      
      <div className="mb-6">
        <div className="text-lg text-neutral-600 mb-2">Das Wort war:</div>
        <div className="text-4xl font-bold text-dark">{roundSummary?.word}</div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">🏆 Punktestand</h3>
        <div className="space-y-3">
          {roundSummary?.scores
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                  index === 1 ? 'bg-gray-100 border-2 border-gray-400' :
                  index === 2 ? 'bg-orange-100 border-2 border-orange-400' :
                  'bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : player.avatar}
                  </span>
                  <span className="font-semibold">{player.name}</span>
                  {player.hasGuessed && <span className="text-green-600">✅</span>}
                </div>
                <span className="font-bold text-lg">{player.score}</span>
              </div>
            ))}
        </div>
      </div>
      
      <div className="text-accent font-bold text-xl">
        Nächste Runde in {summaryCountdown} Sekunden...
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 items-center p-4">
      {showingSummary ? (
        <RoundSummaryView />
      ) : (
        <>
          <div className="w-full flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold mb-2">wordsauce</h1>
            <div className="text-sm text-neutral-500">Raum: {roomId}</div>
            
            {!gameStarted && (
              <button
                onClick={handleStartGame}
                className="bg-accent text-white font-bold py-3 px-6 rounded-xl shadow hover:scale-105 transition-transform"
              >
                Spiel starten
              </button>
            )}
            
            {gameStarted && (
              <>
                <div className="text-2xl font-bold tracking-widest mb-1">
                  Wort: {word ? word.replace(/./g, '_ ') : '_____'}
                </div>
                <Timer />
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {hints.map((hint, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-3xl text-sm font-semibold ${
                        i <= currentHintIndex 
                          ? 'bg-accent text-white' 
                          : 'bg-neutral-200 text-neutral-400'
                      }`}
                    >
                      {i <= currentHintIndex ? hint : '???'}
                    </span>
                  ))}
                </div>
                
                {hasGuessedWord && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl text-center animate-pulse">
                    <span className="text-lg">🎉 Gut gemacht! Du hast das Wort erraten!</span>
                    <div className="text-sm mt-1">Das Spiel läuft weiter - andere können noch raten!</div>
                  </div>
                )}
                
                {!hasGuessedWord && (
                  <form onSubmit={handleSubmitAnswer} className="w-full max-w-md flex gap-2 mt-4">
                    <input
                      className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-accent text-lg"
                      placeholder="Deine Antwort..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      maxLength={50}
                    />
                    <button
                      type="submit"
                      className="bg-accent text-white font-bold px-6 py-3 rounded-xl shadow hover:scale-105 transition-transform"
                    >
                      Antworten
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
          
          <div className="w-full flex flex-col lg:flex-row gap-6 mt-6">
            <div className="flex-1">
              <Chat />
            </div>
            <div className="flex-1">
              <Scoreboard />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Game; 