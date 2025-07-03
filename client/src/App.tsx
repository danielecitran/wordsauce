import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Lobby from './pages/Lobby';
import Game from './pages/Game';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral flex flex-col items-center justify-center">
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/game/:roomId" element={<Game />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App; 