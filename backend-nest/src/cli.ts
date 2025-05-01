import { CommandFactory } from "nest-commander";
import { AppModule } from "./app.module";
// import { CommandsModule } from "./users/commands/commands.module"; // Module doesn't exist

async function bootstrap() {
  // Use AppModule, which should provide the necessary commands
  await CommandFactory.run(AppModule, ["warn", "error"]);
}

bootstrap();
