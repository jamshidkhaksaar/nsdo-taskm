import { Task } from '../types/task';

interface WebSocketMessage {
  type: string;
  payload: any;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 3000; // 3 seconds
  private messageHandlers: { [key: string]: (payload: any) => void } = {};

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectTimeout);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private handleMessage(message: WebSocketMessage) {
    const handler = this.messageHandlers[message.type];
    if (handler) {
      handler(message.payload);
    }
  }

  public registerHandler(type: string, handler: (payload: any) => void) {
    this.messageHandlers[type] = handler;
  }

  public unregisterHandler(type: string) {
    delete this.messageHandlers[type];
  }

  public sendMessage(type: string, payload: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type, payload };
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // Task-specific methods
  public subscribeToTaskUpdates(taskId: string, callback: (task: Task) => void) {
    this.registerHandler(`task_update_${taskId}`, callback);
    this.sendMessage('subscribe_task', { task_id: taskId });
  }

  public unsubscribeFromTaskUpdates(taskId: string) {
    this.unregisterHandler(`task_update_${taskId}`);
    this.sendMessage('unsubscribe_task', { task_id: taskId });
  }

  public subscribeToUserTasks(userId: string, callback: (tasks: Task[]) => void) {
    this.registerHandler(`user_tasks_${userId}`, callback);
    this.sendMessage('subscribe_user_tasks', { user_id: userId });
  }

  public unsubscribeFromUserTasks(userId: string) {
    this.unregisterHandler(`user_tasks_${userId}`);
    this.sendMessage('unsubscribe_user_tasks', { user_id: userId });
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService; 