import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { REDIS_SUBSCRIBER } from './notifications.module';
import Redis from 'ioredis';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // Configure allowed origins properly for production
  },
  // namespace: '/notifications' // Optional: Use a namespace
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');
  private connectedUsers: Map<string, string> = new Map(); // Map userId to socketId

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly redisSubscriber: Redis
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
    this.subscribeToNotifications();
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // Handle authentication and user mapping here
    // const userId = this.getUserIdFromAuth(client.handshake.auth); 
    // if (userId) {
    //   this.connectedUsers.set(userId, client.id);
    //   this.logger.log(`User ${userId} mapped to socket ${client.id}`);
    // }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove user mapping on disconnect
    // for (const [userId, socketId] of this.connectedUsers.entries()) {
    //   if (socketId === client.id) {
    //     this.connectedUsers.delete(userId);
    //     this.logger.log(`User ${userId} disconnected.`);
    //     break;
    //   }
    // }
  }

  private subscribeToNotifications() {
    const channel = 'notifications:new';
    this.redisSubscriber.subscribe(channel, (err, count) => {
      if (err) {
        this.logger.error(`Failed to subscribe to Redis channel ${channel}`, err);
        return;
      }
      this.logger.log(`Subscribed to Redis channel ${channel} (${count} total subscriptions).`);
    });

    this.redisSubscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
          this.logger.log(`Received message from Redis channel ${receivedChannel}`);
          try {
            this.handleNotification(JSON.parse(message));
          } catch (parseError) {
            this.logger.error(`Failed to parse message from Redis: ${parseError}`, message);
          }
      }
    });
  }

  private handleNotification(notification: any): void {
    // Logic to find the target user(s) and send via WebSocket
    const targetUserId = notification.userId; // Assuming payload has userId
    if (!targetUserId) {
        this.logger.warn('Received notification without target userId, cannot send via WebSocket.', notification);
        // Optionally, broadcast to an admin channel or handle differently
        return; 
    }
    
    const socketId = this.connectedUsers.get(targetUserId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification); // Emit a specific event name
      this.logger.log(`Notification sent to user ${targetUserId} via socket ${socketId}`);
    } else {
      this.logger.log(`User ${targetUserId} not connected via WebSocket.`);
    }
  }

  // Example: Message handler for testing or other purposes
  @SubscribeMessage('messageToServer')
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
    this.logger.log('Message received from client:', data);
    // Optionally broadcast or respond
    // this.server.emit('messageToClient', { sender: client.id, message: data });
  }

  // Add method for associating userId with socketId after auth
  addUserSocket(userId: string, socketId: string) {
    this.connectedUsers.set(userId, socketId);
    this.logger.log(`Manually mapped User ${userId} to socket ${socketId}`);
  }

} 