import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { AuthService } from "../../auth/auth.service";
import { WsException } from "@nestjs/websockets";

// Keep the user-to-socket mapping in memory for simplicity
// For production, consider a more robust solution (e.g., Redis)
const userSocketMap = new Map<string, string>(); // Map<userId, socketId>

@Injectable()
@WebSocketGateway({
  cors: {
    origin: "*", // Configure allowed origins properly in production
  },
  // Consider namespace if needed: namespace: '/notifications'
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  // Temporarily comment out Redis dependency
  // private redisSubscriber: Redis;

  constructor(
    // Temporarily comment out Redis Subscriber injection decorator
    // @Inject(REDIS_SUBSCRIBER)
    // private readonly injectedRedisSubscriber: Redis,
    private readonly authService: AuthService,
  ) {
    // Temporarily comment out assignment
    // this.redisSubscriber = this.injectedRedisSubscriber;
  }

  onModuleInit() {
    this.logger.warn(
      "Redis subscription logic in NotificationsGateway is temporarily disabled.",
    );
    // Temporarily disable Redis logic
    /* Original logic:
    this.logger.log('Initializing Redis subscription...');
    this.redisSubscriber.subscribe('notifications:new', (err, count) => {
      if (err) {
        this.logger.error('Failed to subscribe to Redis channel', err);
        return;
      }
      this.logger.log(`Subscribed successfully to ${count} channel(s). Listening for notifications...`);
    });

    this.redisSubscriber.on('message', (channel, message) => {
      this.logger.log(`Received message from channel ${channel}`);
      try {
        const notificationPayload = JSON.parse(message);
        const targetUserId = notificationPayload.userId;
        if (targetUserId) {
          this.sendNotificationToUser(targetUserId, notificationPayload);
        }
      } catch (error) {
        this.logger.error('Failed to parse notification message', error);
      }
    });
    */
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connecting: ${client.id}`);
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        throw new WsException("No token provided");
      }
      // Use the correct AuthService method
      const userContext = await this.authService.verifyJwtAndGetUser(token);
      if (!userContext) {
        throw new WsException("Invalid credentials.");
      }
      const userId = userContext.userId.toString(); // Ensure userId is string

      client.join(`user:${userId}`);
      userSocketMap.set(userId, client.id);
      this.logger.log(
        `Client ${client.id} authenticated as user ${userId} (username: ${userContext.username}) and joined room user:${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Connection error for socket ${client.id}: ${error.message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up user-socket associations
    // Find which user this socket belonged to and remove the mapping
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === client.id) {
        userSocketMap.delete(userId);
        this.logger.log(`Removed mapping for disconnected user ${userId}`);
        break;
      }
    }
    // Note: client automatically leaves rooms on disconnect
  }

  @SubscribeMessage("messageToServer")
  handleMessage(client: Socket, payload: any): string {
    this.logger.log(`Message from client ${client.id}:`, payload);
    return "Acknowledged";
  }

  sendNotificationToUser(userId: string, payload: any) {
    const room = `user:${userId}`;
    // Check if user is actually connected (optional optimization)
    // if (userSocketMap.has(userId)) {
    this.server.to(room).emit("notificationToClient", payload);
    this.logger.log(`Sent notification via WebSocket to room ${room}`);
    // } else {
    //   this.logger.log(`User ${userId} not connected, skipping WebSocket send.`);
    // }
  }
}
