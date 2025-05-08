import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server, ServerOptions } from 'socket.io';
import { INestApplicationContext } from '@nestjs/common';

export class PrefixedIoAdapter extends IoAdapter {
  constructor(appOrHttpServer?: INestApplicationContext | any, private readonly globalPrefix?: string) {
    super(appOrHttpServer);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const calculatedPath = this.globalPrefix
      ? `/${this.globalPrefix.replace(/^\/|\/$/g, '')}/socket.io`
      : '/socket.io';

    console.log(`[PrefixedIoAdapter] Calculated Socket.IO path: ${calculatedPath}`);

    const serverOptions = {
      ...options,
      path: calculatedPath,
      serveClient: false,
      cors: options?.cors || {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    };
    
    console.log(`[PrefixedIoAdapter] Creating Socket.IO server with effective options: ${JSON.stringify(serverOptions).substring(0, 300)}...`);

    return super.createIOServer(port, serverOptions as any);
  }
} 