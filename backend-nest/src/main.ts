import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
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
  console.log(`Application is running in ${configService.get('NODE_ENV') || 'development'} mode on: http://localhost:${port}`);
}
bootstrap();
