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
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  return (
    <div className="bg-white rounded-3xl shadow-neumorph p-4 flex flex-col h-80">
      <h2 className="text-lg font-bold mb-2">Live Feed</h2>
      <div className="flex-1 overflow-y-auto mb-2 pr-2">
        {chat.length === 0 && (
          <div className="text-neutral-400 text-center mt-8">
            Hier erscheinen die Antworten der anderen Spieler...
          </div>
        )}
        {chat.map((c, i) => (
          <div key={i} className={`mb-1 text-sm ${
            c.sender === 'System' ? 'bg-blue-50 p-2 rounded-lg border-l-4 border-blue-400' : ''
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