import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Injectable, Logger, Inject } from "@nestjs/common";
import { REDIS_SUBSCRIBER } from "./notifications.module";
import Redis from "ioredis";
import { AuthService } from "../auth/auth.service";
import { UserContext } from "../auth/interfaces/user-context.interface";

@Injectable()
@WebSocketGateway({
  cors: {
    origin: "*", // Configure allowed origins properly for production
  },
  // namespace: '/notifications' // Optional: Use a namespace
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger("NotificationsGateway");
  private connectedUsers: Map<string, Set<string>> = new Map();

  constructor(
    @Inject(REDIS_SUBSCRIBER) private readonly redisSubscriber: Redis,
    private readonly authService: AuthService,
  ) {}

  afterInit(server: Server) {
    this.logger.log("WebSocket Gateway Initialized");
    this.subscribeToNotifications();
  }

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connecting: ${client.id}`);
    const token = client.handshake.auth?.token;

    if (!token) {
      this.logger.warn(
        `Client ${client.id} connection attempt without token. Disconnecting.`,
      );
      client.disconnect(true);
      return;
    }

    try {
      const userContext: UserContext | null =
        await this.authService.verifyJwtAndGetUser(token);

      if (userContext) {
        this.logger.log(
          `Client ${client.id} authenticated as user ${userContext.userId} (${userContext.username}).`,
        );
        if (!this.connectedUsers.has(userContext.userId)) {
          this.connectedUsers.set(userContext.userId, new Set<string>());
        }
        this.connectedUsers.get(userContext.userId)?.add(client.id);
        this.logger.log(
          `Current connections for user ${userContext.userId}: ${this.connectedUsers.get(userContext.userId)?.size}`,
        );
      } else {
        this.logger.warn(
          `Client ${client.id} authentication failed (invalid token?). Disconnecting.`,
        );
        client.disconnect(true);
      }
    } catch (error) {
      this.logger.error(
        `Error during client ${client.id} authentication: ${error.message}`,
        error.stack,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    let foundUserId: string | null = null;
    for (const [userId, socketIds] of this.connectedUsers.entries()) {
      if (socketIds.has(client.id)) {
        foundUserId = userId;
        socketIds.delete(client.id);
        if (socketIds.size === 0) {
          this.connectedUsers.delete(userId);
          this.logger.log(`User ${userId} completely disconnected.`);
        }
        break;
      }
    }
    if (foundUserId) {
      this.logger.log(
        `Removed socket ${client.id} mapping for user ${foundUserId}. Remaining connections: ${this.connectedUsers.get(foundUserId)?.size || 0}`,
      );
    }
  }

  private subscribeToNotifications() {
    const channel = "notifications:new";
    this.redisSubscriber.subscribe(channel, (err, count) => {
      if (err) {
        this.logger.error(
          `Failed to subscribe to Redis channel ${channel}`,
          err,
        );
        return;
      }
      this.logger.log(
        `Subscribed to Redis channel ${channel} (${count} total subscriptions).`,
      );
    });

    this.redisSubscriber.on("message", (receivedChannel, message) => {
      if (receivedChannel === channel) {
        this.logger.log(
          `Received message from Redis channel ${receivedChannel}`,
        );
        try {
          this.handleNotification(JSON.parse(message));
        } catch (parseError) {
          this.logger.error(
            `Failed to parse message from Redis: ${parseError}`,
            message,
          );
        }
      }
    });
  }

  private handleNotification(notification: any): void {
    const targetUserId = notification.userId;
    if (!targetUserId) {
      this.logger.warn(
        "Received notification without target userId, cannot send via WebSocket.",
        notification,
      );
      return;
    }

    const socketIdsSet = this.connectedUsers.get(targetUserId);
    if (socketIdsSet && socketIdsSet.size > 0) {
      const socketIdsArray = Array.from(socketIdsSet);
      this.logger.log(
        `Sending notification to user ${targetUserId} via ${socketIdsArray.length} socket(s): ${socketIdsArray.join(", ")}`,
      );
      socketIdsArray.forEach((socketId) => {
        this.server.to(socketId).emit("notification", notification);
      });
    } else {
      this.logger.log(`User ${targetUserId} not connected via WebSocket.`);
    }
  }

  // Example: Message handler for testing or other purposes
  @SubscribeMessage("messageToServer")
  handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log("Message received from client:", data);
    // Optionally broadcast or respond
    // this.server.emit('messageToClient', { sender: client.id, message: data });
  }
}
