import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from './settings/settings.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all log levels
  });
  const configService = app.get(ConfigService);
  
  // Initialize settings on app startup
  try {
    const settingsService = app.get(SettingsService);
    await settingsService.initializeSettings();
    console.log('Settings initialized successfully');
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
  
  // Enable CORS with multiple origins
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL') || 'http://localhost:3000',
      'http://192.168.3.90:3000',  // Add your local network IP
      'http://localhost:3000'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  // Set global prefix for API routes
  app.setGlobalPrefix('api');
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  // Use port from config
  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  console.log(`Application is running in ${configService.get('NODE_ENV') || 'development'} mode on: http://localhost:${port}/api`);
  
  // Try to log available routes but handle errors properly
  try {
    // This will only work if the router is available as expected
    const server = app.getHttpServer();
    if (server && server._events && server._events.request && server._events.request._router) {
      const router = server._events.request._router;
      const availableRoutes = router.stack
        .filter(layer => layer.route)
        .map(layer => {
          const route = layer.route;
          return {
            path: route.path,
            method: Object.keys(route.methods)[0].toUpperCase(),
          };
        });
      
      console.log('Available routes:', availableRoutes.length);
    } else {
      console.log('Router information not available in the expected format.');
    }
  } catch (error) {
    console.error('Error retrieving routes information:', error.message);
  }
}

bootstrap();
