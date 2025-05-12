import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { selectToken as selectAuthToken, logout } from '../store/slices/authSlice';
import { addIncomingNotification } from '../store/slices/notificationsSlice';
import { Notification as AppNotification } from '../services/notification'; // Renamed to avoid conflict with socket.on('notification') data

// Use Vite env variable syntax (ensure VITE_WEBSOCKET_URL is in your .env)
const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001'; // Default WebSocket URL (use ws:// or wss://)
const SOCKET_NAMESPACE = '/notifications'; // Make sure this matches your backend gateway namespace if you set one

interface WebSocketNotificationPayload {
  id: string | number; // Assuming ID from socket can be string or number
  userId: string;      // Assuming backend sends userId as string
  type: string;        // Raw type from socket
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityType?: string;
  relatedEntityId?: string | number;
  link?: string;
}

// Helper to assert type for notification types from backend
function isValidNotificationType(type: string): type is AppNotification['type'] {
  return [
    'task_created',
    'task_assigned',
    'task_status_changed',
    'collaborator_added',
    'task_due_soon',
    'task_overdue'
  ].includes(type);
}

export const useWebSocketNotifications = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);
  const token = useSelector(selectAuthToken);
  const dispatch = useDispatch();

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
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    };
    console.log('WebSocket Connection URL:', connectionUrl);
    console.log('WebSocket Connection Options:', JSON.stringify(connectionOptions));

    socketRef.current = io(connectionUrl, connectionOptions);

    const socket = socketRef.current;

    // Connection Events
    socket.on('connect', () => {
      console.log(`WebSocket: Connected successfully with id ${socket.id}`);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log(`WebSocket: Disconnected. Reason: ${reason}`);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        console.warn('WebSocket: Server forced disconnection. Logging out.');
        dispatch(logout());
      }
    });

    socket.on('connect_error', (error) => {
      console.error(`WebSocket: Connection Error: ${error.message}`, error);
      setIsConnected(false);
    });

    // Custom Events from Server
    socket.on('notification', (payload: WebSocketNotificationPayload) => {
      console.log('WebSocket: Received notification payload:', payload);

      const parsedId = parseInt(String(payload.id), 10);
      if (isNaN(parsedId)) {
        console.error('WebSocket: Received notification with invalid ID:', payload.id);
        return; // Don't process if ID is not a number
      }

      const parsedUserId = parseInt(payload.userId, 10);
      if (isNaN(parsedUserId)) {
        console.error('WebSocket: Received notification with invalid userId:', payload.userId);
        return; // Don't process if userId is not a number
      }

      if (!isValidNotificationType(payload.type)) {
        console.warn('WebSocket: Received notification with unknown type:', payload.type);
        // Optionally, still add it with a default type or ignore
        return; 
      }
      
      let taskId: number | undefined = undefined;
      if (payload.relatedEntityType === 'task' && payload.relatedEntityId !== undefined) {
        const parsedTaskId = parseInt(String(payload.relatedEntityId), 10);
        if (!isNaN(parsedTaskId)) {
          taskId = parsedTaskId;
        }
      }

      const notificationForStore: AppNotification = {
        id: parsedId,
        user_id: parsedUserId,
        type: payload.type, // Already validated by isValidNotificationType
        message: payload.message,
        read: payload.isRead,
        created_at: payload.createdAt,
        task_id: taskId, 
      };

      dispatch(addIncomingNotification(notificationForStore));

      toast.info(payload.message || 'You have a new notification!', {
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
    });

    // Cleanup on component unmount or token change
    return () => {
      if (socket) {
        console.log('WebSocket: Disconnecting due to cleanup...');
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, dispatch]);

  return { isConnected };
};