import { Command, CommandRunner } from "nest-commander";
import { Injectable } from "@nestjs/common";
import { UsersService } from "../users.service";

@Injectable()
@Command({ name: "create-admin", description: "Create an admin user" })
export class CreateAdminCommand extends CommandRunner {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const [username, email, password] = passedParams;

    if (!username || !email || !password) {
      console.error("Please provide username, email, and password");
      return;
    }

    try {
      const user = await this.usersService.createAdminUser(
        username,
        email,
        password,
      );
      console.log(`Admin user created successfully: ${user.username}`);
    } catch (error) {
      console.error("Failed to create admin user:", error.message);
    }
  }
}
