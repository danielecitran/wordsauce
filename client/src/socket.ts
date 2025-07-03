import { io, Socket } from 'socket.io-client';

// Automatische URL-Erkennung: Development vs Production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const WS_URL = isDevelopment 
  ? 'http://localhost:3001' // In Development: lokaler Server
  : window.location.origin;  // In Production: gleiche Domain verwenden

export const socket: Socket = io(WS_URL, {
  autoConnect: false,
}); 