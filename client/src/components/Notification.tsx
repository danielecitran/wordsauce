import React, { useEffect, useState } from 'react';

export interface NotificationData {
  id: string;
  type: 'join' | 'leave';
  playerName: string;
  playerId: string;
}

interface NotificationProps {
  notification: NotificationData;
  onRemove: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Debug: Log notification data
  console.log('Notification data:', notification);

  useEffect(() => {
    // Animation einblenden
    const timer = setTimeout(() => setIsVisible(true), 50);
    
    // Automatisches Entfernen nach 4 Sekunden
    const removeTimer = setTimeout(() => {
      setIsRemoving(true);
      setTimeout(() => onRemove(notification.id), 300);
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [notification.id, onRemove]);

  const getNotificationConfig = () => {
    if (notification.type === 'join') {
      return {
        icon: '👋',
        message: `${notification.playerName} ist beigetreten`,
        bgColor: 'bg-green-200',
        borderColor: 'border-green-400',
        textColor: 'text-green-900',
        iconBg: 'bg-green-300',
      };
    } else {
      return {
        icon: '👋',
        message: `${notification.playerName} hat den Raum verlassen`,
        bgColor: 'bg-orange-200',
        borderColor: 'border-orange-400',
        textColor: 'text-orange-900',
        iconBg: 'bg-orange-300',
      };
    }
  };

  const config = getNotificationConfig();

  return (
    <div 
      className={`
        fixed bottom-4 left-4 z-50 w-80
        transform transition-all duration-300 ease-out
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
        ${isRemoving ? 'scale-95' : 'scale-100'}
      `}
    >
      <div 
        className={`
          ${config.bgColor} ${config.borderColor}
          border-2 rounded-2xl p-4 shadow-xl w-full
          hover:shadow-2xl transition-shadow duration-200
        `}
      >
        <div className="flex items-center gap-3">
          <div 
            className={`
              ${config.iconBg} rounded-full w-10 h-10 
              flex items-center justify-center flex-shrink-0
              text-lg
            `}
          >
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${config.textColor} whitespace-nowrap overflow-hidden text-ellipsis`}>
              {config.message}
            </p>
          </div>
          <button
            onClick={() => {
              setIsRemoving(true);
              setTimeout(() => onRemove(notification.id), 300);
            }}
            className={`
              ${config.textColor} hover:opacity-60 
              p-1 rounded-full transition-opacity duration-200
              flex-shrink-0
            `}
            aria-label="Benachrichtigung schließen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
