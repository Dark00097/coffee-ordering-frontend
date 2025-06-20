// src/services/socket.js
import io from 'socket.io-client';
import { api } from './api';

const socket = io(import.meta.env.VITE_API_URL || 'https://coffee-ordering-backend-production.up.railway.app', {
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

export const initSocket = (
  onNewOrder = () => {},
  onOrderUpdate = () => {},
  onTableStatusUpdate = () => {},
  onReservationUpdate = () => {},
  onRatingUpdate = () => {},
  onOrderApproved = () => {},
  onNewNotification = () => {}
) => {
  let cleanup = () => {};

  const initializeSocket = async () => {
    try {
      const response = await api.getSession();
      const sessionId = response.data.sessionId;
      if (!sessionId) {
        console.error('Failed to retrieve session ID from server');
        return () => {};
      }

      socket.emit('join-session', sessionId);

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        socket.emit('join-session', sessionId);
      });

      socket.on('newOrder', (data) => {
        console.log('Received newOrder:', data);
        if (typeof onNewOrder === 'function') onNewOrder(data);
      });

      socket.on('orderUpdate', (data) => {
        console.log('Received orderUpdate:', data);
        if (typeof onOrderUpdate === 'function') onOrderUpdate(data);
      });

      socket.on('tableStatusUpdate', (data) => {
        console.log('Received tableStatusUpdate:', data);
        if (typeof onTableStatusUpdate === 'function') onTableStatusUpdate(data);
      });

      socket.on('reservationUpdate', (data) => {
        console.log('Received reservationUpdate:', data);
        if (typeof onReservationUpdate === 'function') onReservationUpdate(data);
      });

      socket.on('ratingUpdate', (data) => {
        console.log('Received ratingUpdate:', data);
        if (typeof onRatingUpdate === 'function') onRatingUpdate(data);
      });

      socket.on('order-approved', (data) => {
        console.log('Received order-approved:', data.orderId, 'for session:', sessionId);
        if (typeof onOrderApproved === 'function') onOrderApproved(data);
      });

      socket.on('orderApproved', (data) => {
        console.log('Received orderApproved:', data.orderId);
        if (typeof onOrderApproved === 'function') onOrderApproved(data);
      });

      socket.on('newNotification', (data) => {
        console.log('Received newNotification:', data);
        if (typeof onNewNotification === 'function') onNewNotification(data);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected, attempting to reconnect...');
      });

      socket.on('reconnect', (attempt) => {
        console.log('Socket reconnected after attempt:', attempt);
        socket.emit('join-session', sessionId);
      });

      socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
      });

      cleanup = () => {
        socket.off('connect');
        socket.off('newOrder');
        socket.off('orderUpdate');
        socket.off('tableStatusUpdate');
        socket.off('reservationUpdate');
        socket.off('ratingUpdate');
        socket.off('order-approved');
        socket.off('orderApproved');
        socket.off('newNotification');
        console.log('Socket listeners removed');
        socket.disconnect();
      };

      console.log('Socket initialized with session:', sessionId);
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  };

  initializeSocket();

  return cleanup;
};

export default socket;
