import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store';

const Lobby: React.FC = () => {
  const [room, setRoom] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setRoomId = useGameStore((s) => s.setRoomId);

  const handleJoin = () => {
    if (!room.match(/^\w{6}$/i)) {
      setError('Bitte gib einen 6-stelligen Raumcode ein.');
      return;
    }
    if (!name.trim()) {
      setError('Bitte gib deinen Namen ein.');
      return;
    }
    setError('');
    socket.connect();
    socket.emit('join-room', { room, name }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        setRoomId(room);
        navigate(`/game/${room}`);
      } else {
        setError(response.error || 'Beitritt fehlgeschlagen.');
      }
    });
  };

  const handleCreate = () => {
    const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoom(newRoom);
    setError('');
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-3xl shadow-neumorph p-8 flex flex-col gap-6 items-center">
      <h1 className="text-3xl font-bold mb-2">wordsauce</h1>
      <p className="text-neutral-500 text-center mb-4">Gib einen Raumcode ein oder erstelle einen neuen Raum, um mit Freunden zu spielen.</p>
      <input
        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-accent text-lg"
        placeholder="Raumcode (6 Zeichen)"
        maxLength={6}
        value={room}
        onChange={(e) => setRoom(e.target.value.toUpperCase())}
        autoFocus
      />
      <input
        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-accent text-lg"
        placeholder="Dein Name"
        maxLength={16}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <div className="flex w-full gap-2 mt-2">
        <button
          className="flex-1 bg-accent text-white font-bold py-3 rounded-xl shadow hover:scale-105 transition-transform"
          onClick={handleJoin}
        >
          Beitreten
        </button>
        <button
          className="flex-1 bg-neutral-200 text-dark font-bold py-3 rounded-xl shadow hover:scale-105 transition-transform"
          onClick={handleCreate}
        >
          Raum erstellen
        </button>
      </div>
      <div className="text-xs text-neutral-400 mt-4">Dein Name ist für andere Spieler sichtbar.</div>
    </div>
  );
};

export default Lobby; 