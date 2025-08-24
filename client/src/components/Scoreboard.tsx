import React, { useEffect } from 'react';
import { useGameStore } from '../store';
import { socket } from '../socket';

const avatarList = [
  '🍀', '🦊', '🐧', '🐸', '🐼', '🦄', '🐝', '🐙', '🐵', '🐶', '🐱', '🐰', '🦉', '🐢', '🦋', '🐞', '🦕', '🦖', '🦩', '🦜',
];

const Scoreboard: React.FC = () => {
  const players = useGameStore((s) => s.players);
  const hostId = useGameStore((s) => s.hostId);
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
    <div className="flex flex-col gap-1">
      {players.length === 0 && <div className="text-neutral-400 text-sm p-2">Noch keine Spieler.</div>}
      <ul className="flex flex-col gap-1">
        {players
          .sort((a, b) => b.score - a.score)
          .map((p, i) => (
            <li 
              key={p.id} 
              className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${
                p.hasGuessed 
                  ? 'bg-green-100 border border-green-400' 
                  : 'bg-transparent hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">
                {p.avatar || avatarList[i % avatarList.length]}
              </span>
              <span className={`font-semibold flex-1 text-sm ${
                p.hasGuessed ? 'text-green-700' : 'text-dark'
              }`}>
                {p.name}
                {p.id === hostId && (
                  <span className="ml-1 text-xs">👑</span>
                )}
                {p.hasGuessed && (
                  <span className="ml-1 text-xs">✅</span>
                )}
              </span>
              <span className={`font-mono text-sm font-bold ${
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