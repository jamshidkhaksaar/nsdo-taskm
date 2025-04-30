import { CommandFactory } from "nest-commander";
import { AppModule } from "./app.module";
import { CommandsModule } from "./users/commands/commands.module";

async function bootstrap() {
  await CommandFactory.run(CommandsModule, ["warn", "error"]);
}

bootstrap();
