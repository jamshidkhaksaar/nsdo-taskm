import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, JSX } from 'react';

// Types
export interface Notification {
  readonly id: string; // Make id readonly since it shouldn't change
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  readonly timestamp: number; // Make timestamp readonly
}

interface State {
  readonly notifications: ReadonlyArray<Notification>; // Make array readonly
  readonly webSocket: WebSocket | null;
}

interface ContextValue {
  readonly state: Readonly<State>; // Make state readonly
  showNotification: (message: string, type: Notification['type']) => void;
  initWebSocket: (url: string) => Promise<void>; // Make async
  closeWebSocket: () => void;
  removeNotification: (id: string) => void;
}

// Initial state as readonly
const initialState: Readonly<State> = {
  notifications: [],
  webSocket: null,
} as const;

// Create context with a meaningful name
const AppStateContext = createContext<ContextValue | null>(null);
AppStateContext.displayName = 'AppStateContext'; // Add display name for DevTools

// Custom hook for using the context
export const useAppState = (): Readonly<ContextValue> => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

// Provider component props
interface AppStateProviderProps {
  children: ReactNode;
}

interface ActivityLog {
  id: string;
  action: 'created' | 'updated' | 'deleted';
  model_name: string;
  details: string;
  timestamp: string;
}

// Provider component
export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }): JSX.Element => {
  const [state, setState] = useState<State>(initialState);
  const webSocketRef = useRef<WebSocket | null>(null);

  const removeNotification = (id: string): void => {
    setState((prevState): State => ({
      ...prevState,
      notifications: prevState.notifications.filter(n => n.id !== id)
    }));
  };

  const showNotification = (message: string, type: Notification['type']): void => {
    const newNotification: Readonly<Notification> = {
      id: crypto.randomUUID(),
      message,
      type,
      timestamp: Date.now(),
    };

    setState((prevState): State => ({
      ...prevState,
      notifications: [...prevState.notifications, newNotification]
    }));

    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  };

  const initWebSocket = async (url: string): Promise<void> => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(url);
      webSocketRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => {
          console.log('WebSocket connected');
          setState(prev => ({ ...prev, webSocket: ws }));
          resolve();
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as ActivityLog;
            console.log('WebSocket message received:', data);
            showNotification(data.details, 'info');
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setState(prev => ({ ...prev, webSocket: null }));
        };
      });
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      showNotification('Failed to initialize WebSocket connection', 'error');
      throw error; // Re-throw to allow error handling by caller
    }
  };

  const closeWebSocket = (): void => {
    const ws = webSocketRef.current;
    if (ws) {
      ws.close();
      webSocketRef.current = null;
      setState(prev => ({ ...prev, webSocket: null }));
    }
  };

  useEffect(() => {
    return closeWebSocket;
  }, []);

  return React.createElement(AppStateContext.Provider, {
    value: {
      state,
      showNotification,
      initWebSocket,
      closeWebSocket,
      removeNotification,
    },
    children
  });
};

export default AppStateProvider;