import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
// Import necessary dependencies like Redis client, ConfigService, AuthService later

@WebSocketGateway({
  cors: {
    origin: '*', // Configure allowed origins properly in production
  },
  // Consider namespace if needed: namespace: '/notifications'
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Inject dependencies later (e.g., Redis subscriber, AuthService)
  constructor() {}

  async handleConnection(client: Socket, ...args: any[]) {
    // Handle new client connection
    // 1. Authenticate the user (e.g., via token in handshake query/headers)
    // 2. Associate client.id with userId
    // 3. Potentially subscribe the client to user-specific rooms (e.g., `user:${userId}`)
    console.log(`Client connected: ${client.id}`);
    // Example: const userId = await this.authService.getUserIdFromSocket(client);
    // if (userId) client.join(`user:${userId}`);

    // TODO: Start subscribing to relevant Redis channels AFTER successful connection/auth
  }

  handleDisconnect(client: Socket) {
    // Handle client disconnection
    // Clean up user-socket associations
    console.log(`Client disconnected: ${client.id}`);
  }

  // Example message handler (can be used for client->server communication if needed)
  @SubscribeMessage('messageToServer')
  handleMessage(client: Socket, payload: any): string {
    console.log('Message from client:', payload);
    return 'Acknowledged';
  }

  // Method to send notification to specific user(s)
  sendNotificationToUser(userId: string, payload: any) {
    // Emit to a user-specific room or filter sockets
    this.server.to(`user:${userId}`).emit('notificationToClient', payload);
    console.log(`Sent notification to user ${userId}`);
  }

  // This gateway will primarily LISTEN to Redis pub/sub and then use methods like sendNotificationToUser
  // The actual Redis subscription logic will likely be initiated in the constructor or onModuleInit
} 