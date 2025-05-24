import { Injectable, Logger, Inject, forwardRef } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async getProfile(userId: string) {
    try {
      this.logger.log(`Getting profile for user: ${userId}`);
      const user = await this.usersService.findById(userId);

      // Return a sanitized user object without sensitive info
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        first_name: user.username.split(" ")[0] || user.username, // For now, derive from username
        last_name: user.username.split(" ").slice(1).join(" ") || "",
        bio: user.bio || "",
        avatar_url: user.avatarUrl || "",
        skills: user.skills || [],
        social_links: user.socialLinks || {},
        preferences: user.preferences || {},
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        `Error getting profile for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateProfile(userId: string, profileData: any) {
    try {
      this.logger.log(`Updating profile for user: ${userId}`);

      const user = await this.usersService.findById(userId);

      // Map the incoming profile data to the user entity
      // Only allow updating certain fields
      const allowedFields = [
        "username",
        "email",
        "bio",
        "avatarUrl",
        "skills",
        "socialLinks",
      ];

      const updateData = {};
      for (const field of allowedFields) {
        if (profileData[field] !== undefined) {
          updateData[field] = profileData[field];
        }
      }

      // Handle special field mappings from frontend to backend
      if (
        profileData.first_name !== undefined ||
        profileData.last_name !== undefined
      ) {
        const firstName =
          profileData.first_name || user.username.split(" ")[0] || "";
        const lastName = profileData.last_name || "";

        // Combine into username if the system uses full names as usernames
        if (firstName || lastName) {
          updateData["username"] = (firstName + " " + lastName).trim();
        }
      }

      // Handle avatar_url to avatarUrl mapping
      if (profileData.avatar_url !== undefined) {
        updateData["avatarUrl"] = profileData.avatar_url;
      }

      // Update the user with the sanitized data
      // const updatedUser = await this.usersService.updateUser( <-- COMMENT OUT
      await this.usersService.updateUser(
        // <-- MODIFY
        userId,
        updateData,
      );

      // Return sanitized user data that matches what getProfile returns
      return this.getProfile(userId);
    } catch (error) {
      this.logger.error(
        `Error updating profile for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      this.logger.log(`Verifying password for user: ${userId}`);

      const user = await this.usersService.findById(userId);

      // Compare the provided password with the stored hash
      const isMatch = await bcrypt.compare(password, user.password);

      return isMatch;
    } catch (error) {
      this.logger.error(
        `Error verifying password for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      this.logger.log(`Updating password for user: ${userId}`);

      // Generate salt and hash the new password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update the user's password
      await this.usersService.updatePassword(userId, hashedPassword);

      this.logger.log(`Password updated successfully for user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error updating password for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateSettings(userId: string, settingsData: any): Promise<any> {
    try {
      this.logger.log(`Updating settings for user: ${userId}`);

      const user = await this.usersService.findById(userId);

      // Create or update the preferences object
      const preferences = user.preferences || {};

      // Update with the new settings
      const updatedPreferences = {
        ...preferences,
        ...settingsData,
      };

      // Update the user's preferences
      await this.usersService.updateUser(userId, {
        preferences: updatedPreferences,
      });

      return {
        preferences: updatedPreferences,
        message: "Settings updated successfully",
      };
    } catch (error) {
      this.logger.error(
        `Error updating settings for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
