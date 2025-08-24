import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { useGameStore } from '../store';
import logo from '../assets/images/wordsauce.png';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 p-8 w-full max-w-md animate-slide-in-from-bottom">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Lobby: React.FC = () => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [room, setRoom] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const setRoomId = useGameStore((s) => s.setRoomId);
  const setCreatedRoom = useGameStore((s) => s.setCreatedRoom);

  const resetForm = () => {
    setRoom('');
    setName('');
    setError('');
  };

  const closeModals = () => {
    setShowJoinModal(false);
    setShowCreateModal(false);
    resetForm();
  };

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
    
    // Spezielle Anfrage nur zum Beitreten (nicht zum Erstellen)
    socket.emit('join-existing-room', { room, name }, (response: { success: boolean; error?: string; roomState?: any }) => {
      if (response.success) {
        setRoomId(room);
        setCreatedRoom(false); // Raum wurde nicht erstellt, sondern beigetreten
        
        // Sofort Raum-Daten im Store setzen wenn verfügbar
        if (response.roomState) {
          const { setPlayers, setHostId, setIsHost, setGameStarted, setCurrentRound, setMaxRounds, setGameFinished } = useGameStore.getState();
          setPlayers(response.roomState.players);
          setHostId(response.roomState.hostId);
          setIsHost(response.roomState.hostId === socket.id);
          setGameStarted(response.roomState.gameStarted);
          setCurrentRound(response.roomState.currentRound || 0);
          setMaxRounds(response.roomState.maxRounds || 3);
          setGameFinished(response.roomState.gameFinished || false);
        }
        
        navigate(`/game/${room}`);
      } else {
        // Spezifischere Fehlermeldungen
        if (response.error?.includes('existiert nicht')) {
          setError(`Raum "${room}" existiert nicht.\nÜberprüfe den Code oder erstelle einen neuen Raum.`);
        } else {
          setError(response.error || 'Beitritt fehlgeschlagen.');
        }
      }
    });
  };

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Bitte gib deinen Namen ein.');
      return;
    }
    setError('');
    setIsCreating(true);
    
    const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    socket.connect();
    socket.emit('join-room', { room: newRoom, name }, (response: { success: boolean; error?: string; roomState?: any }) => {
      setIsCreating(false);
      if (response.success) {
        setRoomId(newRoom);
        setCreatedRoom(true); // Raum wurde erstellt - dieser Spieler ist der Host
        
        // Sofort Raum-Daten im Store setzen wenn verfügbar
        if (response.roomState) {
          const { setPlayers, setHostId, setIsHost, setGameStarted, setCurrentRound, setMaxRounds, setGameFinished } = useGameStore.getState();
          setPlayers(response.roomState.players);
          setHostId(response.roomState.hostId);
          setIsHost(response.roomState.hostId === socket.id);
          setGameStarted(response.roomState.gameStarted);
          setCurrentRound(response.roomState.currentRound || 0);
          setMaxRounds(response.roomState.maxRounds || 3);
          setGameFinished(response.roomState.gameFinished || false);
        }
        
        navigate(`/game/${newRoom}`);
      } else {
        setError(response.error || 'Raum erstellen fehlgeschlagen.');
      }
    });
  };

  return (
    <>
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-neumorph p-8 flex flex-col gap-8 items-center">
        <div className="text-center">
          <div className="mb-4">
            <img 
              src={logo} 
              alt="wordsauce" 
              className="h-40 mx-auto drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>
          <p className="text-neutral-600 text-lg">
            Wähle eine Option, um mit dem Spielen zu beginnen
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Spiel beitreten Card */}
          <div
            onClick={() => setShowJoinModal(true)}
            className="group cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-800 mb-2">Spiel beitreten</h3>
              <p className="text-blue-600 text-sm">
                Tritt einem bestehenden Raum bei, indem du einen 6-stelligen Raumcode eingibst
              </p>
            </div>
          </div>

          {/* Raum erstellen Card */}
          <div
            onClick={() => setShowCreateModal(true)}
            className="group cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-purple-800 mb-2">Raum erstellen</h3>
              <p className="text-purple-600 text-sm">
                Erstelle einen neuen Raum und lade deine Freunde zum Spielen ein
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-neutral-400 text-center">
          Wähle eine Option aus, um fortzufahren. Dein Name wird für andere Spieler sichtbar sein.
        </div>
      </div>

      {/* Spiel beitreten Modal */}
      <Modal 
        isOpen={showJoinModal} 
        onClose={closeModals}
        title="Spiel beitreten"
      >
        <div className="flex flex-col gap-4">
          <p className="text-neutral-600 text-sm mb-4">
            Gib den 6-stelligen Raumcode ein, den du von deinem Freund erhalten hast.
          </p>
          
          <input
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-center font-mono tracking-widest"
            placeholder="RAUMCODE"
            maxLength={6}
            value={room}
            onChange={(e) => setRoom(e.target.value.toUpperCase())}
            autoFocus
          />
          
          <input
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            placeholder="Dein Name"
            maxLength={16}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200 whitespace-pre-line">
              {error}
            </div>
          )}
          
          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-sm transition-all duration-200"
            onClick={handleJoin}
          >
            Raum beitreten
          </button>
        </div>
      </Modal>

      {/* Raum erstellen Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={closeModals}
        title="Raum erstellen"
      >
        <div className="flex flex-col gap-4">
          <p className="text-neutral-600 text-sm mb-4">
            Erstelle einen neuen Raum und teile den generierten Code mit deinen Freunden.
          </p>
          
          <input
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
            placeholder="Dein Name"
            maxLength={16}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          
          {error && (
            <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-200 whitespace-pre-line">
              {error}
            </div>
          )}
          
          <button
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Erstelle Raum...
              </div>
            ) : (
              'Raum erstellen & beitreten'
            )}
          </button>
          
          <div className="text-xs text-neutral-500 text-center">
            Du wirst automatisch dem neuen Raum beitreten
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Lobby; 