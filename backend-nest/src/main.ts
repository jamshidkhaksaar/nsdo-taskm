import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common'; // Uncomment if you use ValidationPipe

async function bootstrap() {
  try {
    console.error(`[${new Date().toISOString()}] NestJS Main: Attempting to bootstrap application...`);

    const app = await NestFactory.create(AppModule, {
      // You can enable more detailed NestJS logging if needed:
      // logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    console.error(`[${new Date().toISOString()}] NestJS Main: AppModule created.`);

    // If you have global pipes, interceptors, etc., they would be set up here
    // For example:
    // app.useGlobalPipes(new ValidationPipe()); // Make sure to import ValidationPipe
    
    // app.enableCors(); // If you need CORS - We will replace this
    app.enableCors({
      origin: [
        'http://localhost:5173', // Local frontend (Vite default)
        // 'https://task.nsdo.org.af' // Production frontend (commented out for local dev)
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
    });

    const port = process.env.PORT || 3000; // cPanel will inject process.env.PORT
    console.error(`[${new Date().toISOString()}] NestJS Main: Application bootstrapped. Attempting to listen on effective port: ${port}`);

    await app.listen(port);
    // If it reaches here, it's a good sign.
    console.error(`[${new Date().toISOString()}] NestJS Main: Application is successfully listening on port ${port}`);

  } catch (error) {
    const err = error as Error; // Type assertion
    const errorMessage = `[${new Date().toISOString()}] NestJS Main: CRITICAL BOOTSTRAP ERROR: ${err.message}\nFULL ERROR: ${JSON.stringify(err)}\nSTACK: ${err.stack}\n`;
    console.error(errorMessage);
    process.exit(1); // Exit on critical bootstrap failure
  }
}

bootstrap().catch(error => {
  // This catches errors if the bootstrap promise itself rejects unexpectedly
  const err = error as Error; // Type assertion
  const unhandledBootstrapErrorMessage = `[${new Date().toISOString()}] NestJS Main: UNHANDLED ERROR FROM BOOTSTRAP PROMISE: ${err.message}\nFULL ERROR: ${JSON.stringify(err)}\nSTACK: ${err.stack}\n`;
  console.error(unhandledBootstrapErrorMessage);
  process.exit(1);
});

// Optional: More global error handlers, though the try/catch in bootstrap is key for startup.
process.on('unhandledRejection', (reason, promise) => {
  const reasonErr = reason as Error; // Type assertion
  let message = `[${new Date().toISOString()}] NestJS Main: UNHANDLED REJECTION. `;
  if (reasonErr && reasonErr.message) {
    message += `Reason: ${reasonErr.message}\nStack: ${reasonErr.stack}`;
  } else {
    message += `Reason: ${JSON.stringify(reason)}`;
  }
  console.error(message);
  // process.exit(1); // Decide if you want to exit on unhandled rejections
});

process.on('uncaughtException', (error) => {
  const err = error as Error; // Type assertion
  const uncaughtExceptionMessage = `[${new Date().toISOString()}] NestJS Main: UNCAUGHT EXCEPTION. Error: ${err.message}\nStack: ${err.stack}\n`;
  console.error(uncaughtExceptionMessage);
  process.exit(1); // Recommended to exit on uncaught exceptions
});
