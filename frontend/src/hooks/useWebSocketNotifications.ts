import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { selectToken as selectAuthToken } from '../store/slices/authSlice';

// Use Vite env variable syntax (ensure VITE_WEBSOCKET_URL is in your .env)
const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001'; // Default WebSocket URL (use ws:// or wss://)
const SOCKET_NAMESPACE = '/notifications'; // Make sure this matches your backend gateway namespace if you set one

interface NotificationPayload {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  // Add any other fields sent from the backend payload
}

export const useWebSocketNotifications = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastNotification, setLastNotification] = useState<NotificationPayload | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const token = useSelector(selectAuthToken); // Get token from Redux store

  useEffect(() => {
    if (!token) {
      console.log('WebSocket: No auth token found, connection not established.');
      // If already connected, disconnect
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      return;
    }

    // Prevent multiple connections
    if (socketRef.current && socketRef.current.connected) {
      console.log('WebSocket: Already connected.');
      return;
    }

    console.log('WebSocket: Attempting to connect...');
    // Initialize socket connection with namespace, path, and auth token
    const connectionUrl = `${SOCKET_URL}${SOCKET_NAMESPACE}`;
    const connectionOptions = {
      path: '/api/v1/socket.io',
      auth: {
        token: token,
      },
      reconnectionAttempts: 5, // Optional: Limit reconnection attempts
      reconnectionDelay: 3000, // Optional: Delay between attempts
    };
    console.log('WebSocket Connection URL:', connectionUrl);
    console.log('WebSocket Connection Options:', JSON.stringify(connectionOptions));

    socketRef.current = io(connectionUrl, connectionOptions);

    const socket = socketRef.current;

    // Connection Events
    socket.on('connect', () => {
      console.log(`WebSocket: Connected successfully with id ${socket.id}`);
      setIsConnected(prev => {
        if (!prev) console.log('WebSocket state: Connected');
        return true;
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`WebSocket: Disconnected. Reason: ${reason}`);
      setIsConnected(prev => {
        if (prev) console.log('WebSocket state: Disconnected');
        return false;
      });
      // Handle potential cleanup or permanent disconnect reasons
      if (reason === 'io server disconnect') {
        // The server forced disconnection, maybe auth failed?
        socket.connect(); // Attempt to reconnect manually if desired
      }
    });

    socket.on('connect_error', (error) => {
      console.error(`WebSocket: Connection Error: ${error.message}`, error);
      setIsConnected(prev => {
        if (prev) console.log('WebSocket state: Connection Error - Disconnected');
        return false;
      });
      // Potentially handle auth errors specifically if server emits them
    });

    // Custom Events from Server
    socket.on('notification', (data: NotificationPayload) => {
      console.log('WebSocket: Received notification:', data);
      setLastNotification(data);
      // Show toast notification
      toast.info(data.message || 'You have a new notification!', {
         position: "top-right",
         autoClose: 5000,
         hideProgressBar: false,
         closeOnClick: true,
         pauseOnHover: true,
         draggable: true,
         progress: undefined,
      });
    });

    socket.on('connected', (data: { userId: string }) => {
       console.log(`WebSocket: Confirmed connection for user ${data.userId}`);
       // You could potentially fetch initial notifications here if needed
    });

    // Cleanup on component unmount or token change
    return () => {
      if (socket) {
        console.log('WebSocket: Disconnecting due to cleanup...');
        socket.disconnect();
        socketRef.current = null;
        // Don't set isConnected here in cleanup if component is unmounting,
        // let the disconnect event handler do it if it fires before unmount.
        // However, if the effect reruns due to token change, a fresh setIsConnected
        // will be called by the event handlers of the *new* socket instance.
        // For robustness on fast token changes/re-renders leading to effect re-run:
        setIsConnected(prev => {
          // if (prev) console.log('WebSocket state: Disconnected (cleanup)'); // Optional logging
          return false; // Ensure disconnected state on cleanup/re-run before new connection attempt
        });
      }
    };
  }, [token]); // Keep only token as dependency, as socket instance changes with token

  // Optionally expose a function to manually send messages if needed
  // const sendMessage = (event: string, data: any) => {
  //   if (socketRef.current && socketRef.current.connected) {
  //     socketRef.current.emit(event, data);
  //   }
  // };

  return { isConnected, lastNotification };
}; 