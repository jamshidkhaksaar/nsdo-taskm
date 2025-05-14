import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  forwardRef,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { User } from "./entities/user.entity";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { ActivityLogService } from "../admin/services/activity-log.service";
import { MailService } from "../mail/mail.service";
import { ConfigService } from "@nestjs/config";
import { RoleService } from "../rbac/services/role.service";
import { Role } from "../rbac/entities/role.entity";
import { Department } from "../departments/entities/department.entity";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentsRepository: Repository<Department>,
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
        relations: ["role", "role.permissions"],
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

  async findById(id: string, relations: string[] = []): Promise<User> {
    try {
      this.logger.log(`Looking for user with ID: ${id}, loading relations: ${relations.join(', ')}`);

      const user = await this.usersRepository.findOne({
        where: { id },
        relations: ["role", "role.permissions"],
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
    roleName: string = "User",
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
    return this.create(username, email, password, "Administrator");
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

  async updateUser(id: string, updateData: Partial<User> & { roleId?: string; departmentIds?: string[] }): Promise<User> {
    try {
      this.logger.log(`Updating user with ID: ${id}`);
      const user = await this.usersRepository.findOne({ where: { id }, relations: ["role", "departments"] });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

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

      if (updateData.departmentIds) {
        this.logger.log(`Updating departments for user ${id} with department IDs: ${updateData.departmentIds.join(', ')}`);
        if (updateData.departmentIds.length === 0) {
          user.departments = [];
        } else {
          const departments = await this.departmentsRepository.findBy({
            id: In(updateData.departmentIds),
          });
          if (departments.length !== updateData.departmentIds.length) {
            this.logger.warn("Some department IDs provided for user update were not found.");
          }
          user.departments = departments;
        }
      }

      const allowedFields: (keyof User)[] = [
        'email',
        'isActive',
        'bio',
        'avatarUrl',
        'skills',
        'socialLinks',
        'preferences',
        'position',
        'loginOtp',
        'loginOtpExpiresAt',
        'rememberedBrowsers',
      ];

      for (const field of allowedFields) {
        if (field in updateData && updateData[field] !== undefined) {
          (user as any)[field] = updateData[field];
        }
      }
      
      if (updateData.username && updateData.username !== user.username) {
          user.username = updateData.username;
      }

      const updatedUser = await this.usersRepository.save(user);
      this.logger.log(`Successfully updated user with ID: ${id}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(
        `Error updating user with ID ${id}: ${error.message}`,
        error.stack,
      );
      if (!(error instanceof NotFoundException)) {
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`Finding user by email: ${email}`);
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      this.logger.warn(`User with email ${email} not found during findByEmail.`);
      return null;
    }
    this.logger.log(`User found by email ${email}: ${user.id}`);
    return user;
  }

  async initiatePasswordReset(email: string): Promise<void> {
    this.logger.log(`Initiating password reset for email: ${email}`);
    const user = await this.findByEmail(email);

    if (!user) {
      this.logger.warn(`Password reset attempted for non-existent email: ${email}. Silently returning.`);
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiryHours = this.configService.get<number>("PASSWORD_RESET_TOKEN_EXPIRY_HOURS", 1);
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + expiryHours * 3600000);

    try {
      await this.usersRepository.save(user);
      this.logger.log(`Password reset token set for user ${user.id}`);
    } catch (dbError) {
      this.logger.error(`Failed to save password reset token for user ${user.id}: ${dbError.message}`, dbError.stack);
      throw new InternalServerErrorException("Could not initiate password reset. Please try again later.");
    }

    const frontendUrl = this.configService.get<string>("FRONTEND_URL");
    if (!frontendUrl) {
        this.logger.error("FRONTEND_URL is not configured in .env. Cannot send password reset email.");
        throw new InternalServerErrorException("Server configuration error preventing password reset email.");
    }
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.mailService.sendTemplatedEmail(
        user.email,
        "PASSWORD_RESET_REQUEST_EMAIL",
        {
          username: user.username,
          resetLink: resetLink,
          expiryHours: expiryHours,
        },
      );
      this.logger.log(`Password reset email sent to ${user.email} using template.`);
    } catch (emailError) {
      this.logger.error(`Failed to send templated password reset email to ${user.email}: ${emailError.message}`, emailError.stack);
      throw new InternalServerErrorException("Could not send password reset email. Please try again later.");
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    this.logger.log(`Attempting to reset password with token`);

    const users = await this.usersRepository.find({
      where: { resetPasswordExpires: { $gt: new Date() } as any },
    });

    let userToUpdate: User | null = null;

    for (const user of users) {
      if (user.resetPasswordToken && await bcrypt.compare(token, user.resetPasswordToken)) {
        userToUpdate = user;
        break;
      }
    }

    if (!userToUpdate) {
      this.logger.warn(`Invalid or expired password reset token provided.`);
      throw new UnauthorizedException("Invalid or expired password reset token.");
    }

    userToUpdate.password = await bcrypt.hash(newPassword, 10);
    userToUpdate.resetPasswordToken = null;
    userToUpdate.resetPasswordExpires = null;

    const updatedUser = await this.usersRepository.save(userToUpdate);
    this.logger.log(`Password has been reset for user ID: ${updatedUser.id}`);
    return updatedUser;
  }

  async adminResetPassword(userId: string): Promise<{ user: User; newPassword: string }> {
    this.logger.log(`Admin initiated password reset for user ID: ${userId}`);
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const newPassword = crypto.randomBytes(9).toString('base64').replace(/[/+=]/g, '').substring(0, 12);
    this.logger.log(`Generated new temporary password for user ${user.username}`);

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);

    (user as any).passwordResetToken = null; 
    (user as any).passwordResetExpires = null;

    await this.usersRepository.save(user);
    this.logger.log(`Successfully reset password for user ${user.username}`);

    try {
        const loginLink = this.configService.get<string>("FRONTEND_URL") + "/login";
        await this.mailService.sendTemplatedEmail(
            user.email,
            "ADMIN_PASSWORD_RESET_NOTIFICATION",
            {
                username: user.username,
                temporaryPassword: newPassword,
                loginLink: loginLink,
            }
        );
        this.logger.log(`Admin password reset notification sent to ${user.email}`);
    } catch (emailError) {
        this.logger.error(`Failed to send admin password reset notification to ${user.email}: ${emailError.message}`);
    }

    return { user, newPassword };
  }

  // Added simple method to save user entity state
  async saveUser(user: User): Promise<User> {
      return this.usersRepository.save(user);
  }
}
