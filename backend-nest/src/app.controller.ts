import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
// import { InjectDataSource } from "@nestjs/typeorm"; // No longer needed
// import { DataSource } from "typeorm"; // No longer needed

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    // @InjectDataSource() private dataSource: DataSource, // No longer needed
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // The /health endpoint below is redundant with HealthController and should be removed.
  // @Get("health")
  // async healthCheck() {
  //   let databaseConnected = false;
  //   let databaseMessage = "Database connection failed";
  //
  //   try {
  //     // Check database connection
  //     if (this.dataSource && this.dataSource.isInitialized) {
  //       await this.dataSource.query("SELECT 1");
  //       databaseConnected = true;
  //       databaseMessage = "Database connection successful";
  //     }
  //   } catch (error) {
  //     databaseMessage = `Database error: ${error.message}`;
  //   }
  //
  //   return {
  //     status: "ok",
  //     timestamp: new Date().toISOString(),
  //     message: "API is operational",
  //     database: {
  //       connected: databaseConnected,
  //       message: databaseMessage,
  //       type: this.dataSource?.options?.type || "unknown",
  //       name: this.dataSource?.options?.database || "unknown",
  //     },
  //     environment: {
  //       nodeEnv: process.env.NODE_ENV || "development",
  //     },
  //   };
  // }
}
