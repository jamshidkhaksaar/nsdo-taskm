import { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

// Define the structure of the notification payload expected from the backend
export interface NotificationPayload {
  id?: string; // ID from the saved Notification entity
  type: string;
  message: string;
  userId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt?: string | Date; // Include createdAt if sent from backend
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastNotification: NotificationPayload | null;
  notifications: NotificationPayload[]; // Store a list of notifications
  // socket: Socket | null; // Optionally expose the socket instance if needed directly
}

const useWebSocket = (token: string | null): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastNotification, setLastNotification] = useState<NotificationPayload | null>(null);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]); // Keep a list

  // Using useRef to hold the socket instance avoids re-connections on re-renders
  const socketRef = useRef<Socket | null>(null);

  // Get WebSocket URL from environment variable, fallback for development
  const socketURL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001'; // Default to common backend port + ws protocol

  useEffect(() => {
    // Only attempt connection if we have an auth token
    if (!token) {
      console.log('WebSocket: No token, connection skipped.');
      // Ensure cleanup if token becomes null while connected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Prevent multiple connections
    if (socketRef.current) {
      console.log('WebSocket: Already connected or connecting.');
      return;
    }

    console.log(`WebSocket: Attempting to connect to ${socketURL}...`);
    // Initialize socket connection with auth token
    // The backend gateway needs to be configured to look for this token
    socketRef.current = io(socketURL, {
      transports: ['websocket'], // Prefer WebSocket transport
      auth: { token }, // Send token for authentication
      // Add other options if needed, e.g., path: '/notifications' if using namespace
    });

    const socket = socketRef.current;

    // --- Event Listeners ---
    socket.on('connect', () => {
      console.log(`WebSocket: Connected with ID ${socket.id}`);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason: string) => {
      console.log(`WebSocket: Disconnected. Reason: ${reason}`);
      setIsConnected(false);
      // Handle potential reconnection logic if needed
      // socketRef.current = null; // Clear ref on disconnect? Depends on reconnection strategy
    });

    socket.on('connect_error', (error: Error) => {
      console.error('WebSocket: Connection Error:', error.message);
      setIsConnected(false);
      // Consider cleanup or retry logic here
      socketRef.current?.disconnect(); // Ensure disconnect on error
      socketRef.current = null;
    });

    socket.on('notification', (data: NotificationPayload) => {
      console.log('WebSocket: Received notification:', data);
      setLastNotification(data);
      // Add to the list of notifications (e.g., keep last 10)
      setNotifications(prev => [data, ...prev.slice(0, 9)]);

      // Display toast notification
      toast.info(data.message || 'New notification received');
    });

    // --- Cleanup ---
    // Return a cleanup function to disconnect when the component unmounts
    // or when the token changes (triggering useEffect rerun)
    return () => {
      if (socketRef.current) {
        console.log('WebSocket: Disconnecting...');
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('notification');
        socketRef.current.disconnect();
        socketRef.current = null; // Clear the ref on cleanup
        setIsConnected(false);
      }
    };
  }, [socketURL, token]); // Re-run effect if URL or token changes

  return { isConnected, lastNotification, notifications };
};

export default useWebSocket; 