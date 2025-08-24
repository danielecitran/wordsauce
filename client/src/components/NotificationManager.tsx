import React, { useState, useCallback } from 'react';
import Notification, { NotificationData } from './Notification';

interface NotificationManagerProps {
  notifications: NotificationData[];
  onRemoveNotification: (id: string) => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
  notifications,
  onRemoveNotification,
}) => {
  return (
    <div className="fixed bottom-0 left-0 z-50 pointer-events-none">
      <div className="relative">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className="pointer-events-auto mb-2"
            style={{
              transform: `translateY(-${index * 10}px)`,
              zIndex: 50 - index,
            }}
          >
            <Notification
              notification={notification}
              onRemove={onRemoveNotification}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationManager;
