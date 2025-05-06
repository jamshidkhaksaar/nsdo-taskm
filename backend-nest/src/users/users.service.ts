import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import * as bcrypt from "bcrypt";
import { ActivityLogService } from "../admin/services/activity-log.service";
import { MailService } from "../mail/mail.service";
import { ConfigService } from "@nestjs/config";
import { RoleService } from "../rbac/services/role.service";
import { Role } from "../rbac/entities/role.entity";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => ActivityLogService))
    private activityLogService: ActivityLogService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly roleService: RoleService,
  ) {}

  async findOne(username: string, relations: string[] = []): Promise<User> {
    try {
      this.logger.log(`Looking for user with username: ${username}`);

      const user = await this.usersRepository.findOne({
        where: { username },
        relations: relations,
      });
      this.logger.log(
        `[DEBUG] findOne result for username=${username}: ${user ? "found" : "not found"}`,
      );
      if (!user) {
        this.logger.warn(`User with username ${username} not found`);
        throw new NotFoundException(`User with username ${username} not found`);
      }

      this.logger.log(`Found user with username: ${username}, ID: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user with username ${username}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<User> {
    try {
      this.logger.log(`Looking for user with ID: ${id}`);

      const user = await this.usersRepository.findOne({
        where: { id },
        relations: ["departments"],
      });

      if (!user) {
        this.logger.warn(`User with ID ${id} not found`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(`Found user with ID: ${id}, username: ${user.username}`);
      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findUsersByDepartment(departmentId: string): Promise<User[]> {
    try {
      this.logger.log(`Finding users in department with ID: ${departmentId}`);

      const users = await this.usersRepository
        .createQueryBuilder("user")
        .innerJoin("user.departments", "department")
        .where("department.id = :departmentId", { departmentId })
        .getMany();

      this.logger.log(
        `Found ${users.length} users in department with ID: ${departmentId}`,
      );
      return users;
    } catch (error) {
      this.logger.error(
        `Error finding users in department ${departmentId}: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async findAll(): Promise<User[]> {
    try {
      this.logger.log("Finding all users");
      const users = await this.usersRepository.find({
        relations: ["departments"],
      });
      this.logger.log(`Found ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error(
        `Error finding all users: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async create(
    username: string,
    email: string,
    password: string,
    roleName: string = "USER",
  ): Promise<User> {
    this.logger.log(
      `Creating new user with username: ${username}, email: ${email}, role: ${roleName}`,
    );

    try {
      // Hash the password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      // Find the role entity
      const role = await this.roleService.findByName(roleName);
      if (!role) {
        throw new NotFoundException(`Role with name ${roleName} not found`);
      }

      // Create a new user
      const user = this.usersRepository.create({
        username,
        email,
        password: hashedPassword,
        role: role, // Assign the Role entity
      });

      // Save the user to the database
      const savedUser = await this.usersRepository.save(user);
      this.logger.log(
        `Successfully created user with username: ${username}, ID: ${savedUser.id}`,
      );

      // Send Welcome Email
      try {
        const loginLink =
          this.configService.get<string>("FRONTEND_URL") + "/login";
        await this.mailService.sendTemplatedEmail(
          savedUser.email,
          "WELCOME_EMAIL",
          {
            username: savedUser.username,
            password: password, // Send the original password for the first login
            loginLink: loginLink,
          },
        );
        this.logger.log(
          `Welcome email sent successfully to ${savedUser.email}`,
        );
      } catch (emailError) {
        this.logger.error(
          `Failed to send welcome email to ${savedUser.email}: ${emailError.message}`,
          emailError.stack,
        );
        // Decide if you want to throw an error here or just log it
        // For now, we log the error but don't block user creation
      }

      return savedUser;
    } catch (error) {
      this.logger.error(
        `Error creating user with username ${username}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async createAdminUser(
    username: string,
    email: string,
    password: string,
  ): Promise<User> {
    this.logger.log(
      `Creating new admin user with username: ${username}, email: ${email}`,
    );
    return this.create(username, email, password, "ADMIN"); // Pass the role name string
  }

  async findByRole(roleName: string): Promise<User[]> {
    try {
      this.logger.log(`Looking for users with role: ${roleName}`);
      const users = await this.usersRepository
        .createQueryBuilder("user")
        .innerJoin("user.role", "role")
        .where("role.name = :roleName", { roleName })
        .getMany();
      this.logger.log(`Found ${users.length} users with role: ${roleName}`);
      return users;
    } catch (error) {
      this.logger.error(
        `Error finding users with role ${roleName}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      this.logger.log(`Deleting user with ID: ${id}`);

      // First check if the user exists
      await this.findById(id);

      // Delete the user
      const result = await this.usersRepository.delete(id);

      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.log(`Successfully deleted user with ID: ${id}`);
    } catch (error) {
      this.logger.error(
        `Error deleting user with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    try {
      this.logger.log(`Updating password for user with ID: ${id}`);

      // First check if the user exists
      const user = await this.findById(id);

      // Update the password
      user.password = hashedPassword;

      // Save the updated user
      const updatedUser = await this.usersRepository.save(user);

      this.logger.log(`Successfully updated password for user with ID: ${id}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating password for user with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateStatus(id: string, isActive: boolean): Promise<User> {
    try {
      this.logger.log(
        `Updating status for user with ID: ${id} to ${isActive ? "active" : "inactive"}`,
      );

      // First check if the user exists
      const user = await this.findById(id);

      // Update the status
      user.isActive = isActive;

      // Save the updated user
      const updatedUser = await this.usersRepository.save(user);

      this.logger.log(
        `Successfully updated status for user with ID: ${id} to ${isActive ? "active" : "inactive"}`,
      );
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating status for user with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateUser(id: string, updateData: Partial<User> & { roleId?: string }): Promise<User> {
    try {
      this.logger.log(`Updating user with ID: ${id}`);
      const user = await this.findById(id);

      // 1. Handle Role Update
      if (updateData.roleId && updateData.roleId !== user.role?.id) {
        this.logger.log(`Updating role for user ${id} to roleId ${updateData.roleId}`);
        try {
          const newRole = await this.roleService.findById(updateData.roleId);
          user.role = newRole;
        } catch (roleError) {
          if (roleError instanceof NotFoundException) {
            throw new NotFoundException(`Role with ID "${updateData.roleId}" not found.`);
          }
          throw roleError;
        }
      }

      // 2. Update other allowed fields (match ACTUAL User entity properties)
      const allowedFields: (keyof User)[] = [
        'email',
        'isActive',   // Use this boolean field for status
        'bio',
        'avatarUrl',
        'skills',
        'socialLinks',
        'preferences',
        'position'    // <-- Add position here
        // Add any other relevant fields from the User entity that should be updatable
      ];

      for (const field of allowedFields) {
        // Check if the property exists on updateData before assigning
        if (field in updateData && updateData[field] !== undefined) {
          // Type assertion might be needed if TS still struggles with dynamic keys
          (user as any)[field] = updateData[field];
        }
      }

      // 4. Save the updated user
      const updatedUser = await this.usersRepository.save(user);
      this.logger.log(`Successfully updated user with ID: ${id}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating user with ID ${id}: ${error.message}`,
        error.stack,
      );
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      this.logger.log(`Looking for user with email: ${email}`);
      const user = await this.usersRepository.findOneBy({ email });
      if (user) {
        this.logger.log(`Found user with email ${email}, ID: ${user.id}`);
      } else {
        this.logger.log(`User with email ${email} not found.`);
      }
      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user by email ${email}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
