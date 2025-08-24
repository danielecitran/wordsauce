import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../store';
import { socket } from '../socket';

const Chat: React.FC = () => {
  const chat = useGameStore((s) => s.chat);
  const addChat = useGameStore((s) => s.addChat);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleChatMessage = (data: { sender: string; message: string }) => {
      console.log('Chat Nachricht:', data);
      addChat(data);
    };

    socket.on('chat-message', handleChatMessage);
    
    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [addChat]);

  useEffect(() => {
    // Nur scrollen wenn der Chat Container selbst gescrollt werden soll, nicht die ganze Seite
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [chat]);

  return (
    <div className="flex flex-col h-64">
      <div className="flex-1 overflow-y-auto pr-2 space-y-1">
        {chat.length === 0 && (
          <div className="text-neutral-400 text-center mt-4 text-sm">
            Hier erscheinen die Antworten der anderen Spieler...
          </div>
        )}
        {chat.map((c, i) => (
          <div key={i} className={`text-xs leading-relaxed ${
            c.sender === 'System' ? 'bg-blue-50 p-2 rounded-lg border-l-2 border-blue-400' : 'p-1'
          }`}>
            <span className={`font-bold ${
              c.sender === 'System' ? 'text-blue-600' : 'text-accent'
            }`}>
              {c.sender}: 
            </span>
            <span className="ml-1">{c.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default Chat; 