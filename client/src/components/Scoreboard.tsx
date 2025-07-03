import React, { useEffect } from 'react';
import { useGameStore } from '../store';
import { socket } from '../socket';

const avatarList = [
  '🍀', '🦊', '🐧', '🐸', '🐼', '🦄', '🐝', '🐙', '🐵', '🐶', '🐱', '🐰', '🦉', '🐢', '🦋', '🐞', '🦕', '🦖', '🦩', '🦜',
];

const Scoreboard: React.FC = () => {
  const players = useGameStore((s) => s.players);
  const setPlayers = useGameStore((s) => s.setPlayers);

  useEffect(() => {
    const handleUpdateScores = (playerList: any[]) => {
      console.log('Scoreboard Update:', playerList);
      setPlayers(playerList);
    };

    socket.on('update-scores', handleUpdateScores);
    
    return () => {
      socket.off('update-scores', handleUpdateScores);
    };
  }, [setPlayers]);

  return (
    <div className="bg-white rounded-3xl shadow-neumorph p-4 flex flex-col gap-2">
      <h2 className="text-lg font-bold mb-2">Punkte</h2>
      {players.length === 0 && <div className="text-neutral-400">Noch keine Spieler.</div>}
      <ul className="flex flex-col gap-2">
        {players
          .sort((a, b) => b.score - a.score)
          .map((p, i) => (
            <li 
              key={p.id} 
              className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 ${
                p.hasGuessed 
                  ? 'bg-green-100 border-2 border-green-400 animate-pulse' 
                  : 'bg-transparent'
              }`}
            >
              <span className="text-2xl">
                {p.avatar || avatarList[i % avatarList.length]}
              </span>
              <span className={`font-semibold flex-1 ${
                p.hasGuessed ? 'text-green-700' : 'text-dark'
              }`}>
                {p.name}
                {p.hasGuessed && (
                  <span className="ml-2 text-sm animate-bounce">✅ Erraten!</span>
                )}
              </span>
              <span className={`font-mono text-lg font-bold ${
                p.hasGuessed ? 'text-green-600' : 'text-accent'
              }`}>
                {p.score}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default Scoreboard; 