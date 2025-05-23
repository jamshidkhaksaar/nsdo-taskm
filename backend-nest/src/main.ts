import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import csurf from "csurf";
import helmet from "helmet";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";
import { ConfigService } from "@nestjs/config";
import { SettingsService } from "./settings/settings.service";
import { PrefixedIoAdapter } from './common/adapters/prefixed-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"], // Enable all log levels
  });
  // Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Enable security headers with Helmet
  app.use(helmet());
  const configService = app.get(ConfigService);

  // Initialize settings on app startup
  try {
    const settingsService = app.get(SettingsService);
    await settingsService.initializeSettings();
    console.log("Settings initialized successfully");
  } catch (error) {
    console.error("Error initializing settings:", error);
  }

  // Enable CORS with multiple origins
  app.enableCors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3001",
      "http://192.168.3.90:3000", // Add your local network IP if needed
      configService.get("FRONTEND_URL") || "http://localhost:3000",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // Set global prefix for API routes
  app.setGlobalPrefix("api/v1");

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  // Enable CSRF protection with cookies
  // CSRF protection temporarily disabled for development
  // app.use(
  //   csurf({
  //     cookie: true,
  //   }),
  // );
  // Setup Swagger API documentation
  if (configService.get("NODE_ENV") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("NSDO Task Management API")
      .setDescription("API documentation for NSDO Task Management backend")
      .setVersion("1.0")
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api-docs", app, swaggerDocument);
  }

  // Enable WebSocket adapter using the custom PrefixedIoAdapter
  const globalPrefix = configService.get<string>('API_PREFIX', 'api/v1'); // Get global prefix from config or default
  app.useWebSocketAdapter(new PrefixedIoAdapter(app.getHttpServer(), globalPrefix));

  // Use port from config
  const port = configService.get("PORT") || 3001;
  await app.listen(port);
  console.log(
    `Application is running in ${configService.get("NODE_ENV") || "development"} mode on: http://localhost:${port}/api/v1`,
  );

  // Try to log available routes but handle errors properly
  try {
    // This will only work if the router is available as expected
    const server = app.getHttpServer();
    if (
      server &&
      server._events &&
      server._events.request &&
      server._events.request._router
    ) {
      const router = server._events.request._router;
      const availableRoutes = router.stack
        .filter((layer) => layer.route)
        .map((layer) => {
          const route = layer.route;
          return {
            path: route.path,
            method: Object.keys(route.methods)[0].toUpperCase(),
          };
        });

      console.log("Available routes:", availableRoutes.length);
    } else {
      console.log("Router information not available in the expected format.");
    }
  } catch (error) {
    console.error("Error retrieving routes information:", error.message);
  }
}

bootstrap();
