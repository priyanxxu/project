import { io } from 'socket.io-client';
import { API_URL } from './api';

const socketURL = API_URL ? API_URL.replace(/\/api$/, '') : window.location.origin;
export const socket = io(socketURL, {
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 8,
  transports: ['websocket', 'polling']
});
