import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store';

const Timer: React.FC = () => {
  const timer = useGameStore((s) => s.timer);
  const gameOver = useGameStore((s) => s.gameOver);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && timer === 60) {
      ref.current.animate([
        { background: '#6366f1' },
        { background: '#f87171' },
      ], {
        duration: 60000,
        fill: 'forwards',
      });
    }
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={ref}
        className={`w-32 h-16 flex items-center justify-center rounded-3xl text-2xl font-bold shadow-neumorph transition-all duration-500 ${
          gameOver 
            ? 'bg-red-500 text-white' 
            : timer <= 10 
              ? 'bg-red-400 text-white animate-pulse' 
              : timer <= 30 
                ? 'bg-orange-400 text-white' 
                : 'bg-accent text-white'
        }`}
        aria-live="polite"
      >
        {gameOver ? '⏰' : formatTime(timer)}
      </div>
      {gameOver && (
        <div className="text-sm text-red-500 mt-2 font-semibold">
          Zeit abgelaufen!
        </div>
      )}
    </div>
  );
};

export default Timer; 