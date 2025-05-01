import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  Inject,
  forwardRef,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { LoginCredentialsDto } from "./dto/auth-credentials.dto";
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { User } from "../users/entities/user.entity";
import { MailService } from "../mail/mail.service";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { UserContext } from "./interfaces/user-context.interface";
import { CaptchaService } from "../captcha/captcha.service";
// TODO: Import speakeasy or otplib for TOTP verification later

// Define expected return types
interface LoginSuccessResponse {
  access: string;
  refresh: string;
  user: any; // Adjust user details as needed
}

interface TwoFactorRequiredResponse {
  twoFactorRequired: true;
  userId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly captchaService: CaptchaService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.findOne(username, ["roles"]);

      if (user && (await bcrypt.compare(password, user.password))) {
        this.logger.log(`User validation successful for: ${username}`);
        return user;
      }

      this.logger.warn(`User validation failed for: ${username}`);
      return null;
    } catch (error) {
      this.logger.error(
        `User validation error for ${username}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async signIn(
    loginCredentialsDto: LoginCredentialsDto,
  ): Promise<LoginSuccessResponse | TwoFactorRequiredResponse> {
    this.logger.log(`[DEBUG] Entered signIn`);
    const { username, password /*, captchaToken */ } = loginCredentialsDto; // captchaToken exists but is unused if commented out
    this.logger.log(`Login attempt for user: ${username}`);

    // --- CAPTCHA Verification (Assuming it's active) ---
    // const isCaptchaValid = await this.captchaService.verifyToken(captchaToken);
    // if (!isCaptchaValid) {
    //     this.logger.warn(`CAPTCHA verification failed for login attempt: ${username}`);
    //     throw new UnauthorizedException('CAPTCHA verification failed. Please try again.');
    // }
    // this.logger.log(`CAPTCHA verification successful for login attempt: ${username}`);
    // --- End CAPTCHA Verification ---

    try {
      // Load the user WITH the role relation
      const user = await this.usersService.findOne(username, ["role"]); 
      if (!user) {
        this.logger.warn(`User not found: ${username}`);
        throw new UnauthorizedException("Please check your login credentials");
      }
      this.logger.log(`User found: ${user.username}, ID: ${user.id}`);

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        this.logger.warn(`Password validation failed for user: ${username}`);
        throw new UnauthorizedException("Please check your login credentials");
      }

      this.logger.log(`Password validation successful for user: ${username}`);

      // --- 2FA Check ---
      if (user.twoFactorEnabled) {
        this.logger.log(
          `2FA is enabled for user: ${username}. Returning 2FA required response.`,
        );
        // Do NOT issue tokens yet. Signal frontend that 2FA is needed.
        return {
          twoFactorRequired: true,
          userId: user.id,
        };
      }
      // --- End 2FA Check ---

      // If 2FA is not enabled, proceed with login and token generation
      this.logger.log(
        `2FA is not enabled for user: ${username}. Generating tokens...`,
      );
      // Ensure role name is included in the payload if needed for permissions
      const payload: JwtPayload = { 
        username: user.username, 
        sub: user.id, 
        role: user.role?.name // Include role name in JWT payload
      };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

      this.logger.log(`Login successful (no 2FA) for user: ${username}`);
      return {
        access: accessToken,
        refresh: refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email || "",
          // Use role name from the loaded relation, default to 'user' if missing
          role: user.role?.name || "user", 
        },
      };
    } catch (error) {
      this.logger.error(
        `Login error for user ${username}: ${error.message} (type: ${error?.constructor?.name})`,
        error.stack,
      );
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "An unexpected error occurred during login.",
      );
    }
  }

  // Placeholder for the new 2FA verification endpoint logic
  async login2FA(
    userId: string,
    verificationCode: string,
  ): Promise<LoginSuccessResponse> {
    this.logger.log(`Attempting 2FA login for userId: ${userId}`);

    const user = await this.usersService.findById(userId);
    if (!user) {
      this.logger.error(`login2FA: User not found for ID: ${userId}`);
      throw new UnauthorizedException("Invalid user or session for 2FA.");
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      this.logger.warn(
        `login2FA: 2FA is not enabled or secret is missing for user: ${user.username}`,
      );
      throw new BadRequestException(
        "Two-Factor Authentication is not enabled for this account.",
      );
    }

    let isCodeValid = false;

    // TODO: Step 1: Verify TOTP code
    // Use speakeasy or otplib to verify `verificationCode` against `user.twoFactorSecret`
    // Example (using speakeasy - install it first: npm install speakeasy @types/speakeasy):
    /*
    import * as speakeasy from 'speakeasy';
    isCodeValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret, // Assuming this is the BASE32 encoded secret
      encoding: 'base32',
      token: verificationCode,
      window: 1 // Allow for a 30-second window variance
    });
    */
    this.logger.log(
      `TOTP check for user ${user.username}: ${isCodeValid ? "Valid" : "Invalid"}`,
    );

    // TODO: Step 2: If TOTP failed, check if it's a valid recovery code
    if (!isCodeValid) {
      this.logger.log(
        `TOTP code invalid, checking recovery codes for user: ${user.username}`,
      );
      // Logic to check if `verificationCode` matches one of the user's hashed recovery codes
      // 1. Retrieve user.hashedRecoveryCodes (assuming it's an array of hashes)
      // 2. Iterate and compare `bcrypt.compare(verificationCode, hashedCode)`
      // 3. If a match is found, mark that code as used (e.g., remove it from the array or store used codes)
      // 4. Set isCodeValid = true;
      // 5. Update the user entity with the modified recovery codes list.
      // isCodeValid = await this.usersService.verifyAndUseRecoveryCode(userId, verificationCode);
      // Placeholder:
      isCodeValid = false; // Assume recovery code check fails for now
      this.logger.log(`Recovery code check result: ${isCodeValid}`);
    }

    if (!isCodeValid) {
      this.logger.warn(
        `Invalid 2FA code (TOTP or Recovery) for user: ${user.username}`,
      );
      throw new UnauthorizedException(
        "Invalid Two-Factor Authentication code.",
      );
    }

    // If code is valid (either TOTP or Recovery), generate tokens
    this.logger.log(
      `2FA verification successful for user: ${user.username}. Generating tokens...`,
    );
    const payload: JwtPayload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role?.name // Also include role here if needed
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    return {
      access: accessToken,
      refresh: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || "",
        // Use role name from the loaded relation, default to 'user' if missing
        role: user.role?.name || "user", 
      },
    };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ access: string; refresh: string }> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Find the user WITH role to include in new access token payload
      const user = await this.usersService.findOne(payload.username, ["role"]);

      if (!user) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Generate a new access token including the role
      const accessPayload: JwtPayload = {
        username: user.username,
        sub: user.id,
        role: user.role?.name // Include role in new access token
      };
      const newAccessToken = this.jwtService.sign(accessPayload);
      // Optionally generate a new refresh token or reuse the old one depending on strategy
      // For simplicity, let's assume refresh token rotation isn't implemented here

      return {
        access: newAccessToken,
        refresh: refreshToken, // Return original refresh token
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  // New method to verify a JWT string and return the user payload
  async verifyJwtAndGetUser(token: string): Promise<UserContext | null> {
    try {
      this.logger.debug(
        `[verifyJwtAndGetUser] Verifying token: ${token ? token.substring(0, 10) + "..." : "null"}`,
      );
      const payload: JwtPayload = this.jwtService.verify(token); // Throws error if invalid/expired
      this.logger.debug(
        `[verifyJwtAndGetUser] Token verified. Payload: ${JSON.stringify(payload)}`,
      );

      // We trust the payload if verify succeeds, but check user existence for robustness
      const user = await this.usersService.findById(payload.sub); // Use findById
      if (!user) {
        this.logger.warn(
          `[verifyJwtAndGetUser] User with ID ${payload.sub} from token not found in DB.`,
        );
        return null; // Or throw UnauthorizedException?
      }

      // Construct the user context expected by the gateway/app
      // Spread the full user object and ensure userId is set
      const userContext: UserContext = {
        ...user,
        userId: payload.sub, // Ensure userId is set, often same as user.id
        // username: user.username, // Already included from ...user
        // role: user.role, // Already included from ...user
      };
      this.logger.debug(
        `[verifyJwtAndGetUser] Returning user context: ${JSON.stringify(userContext)}`,
      );
      return userContext;
    } catch (error) {
      this.logger.warn(
        `[verifyJwtAndGetUser] JWT verification failed: ${error.message}`,
      );
      return null; // Return null if token is invalid or expired
    }
  }

  async handleForgotPasswordRequest(
    email: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Forgot password request received for email: ${email}`);
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists - security best practice
        this.logger.warn(
          `Forgot password request for non-existent email: ${email}`,
        );
        return {
          message:
            "If an account with this email exists, a password reset link has been sent.",
        };
      }

      // Generate a secure, unique, time-limited reset token (implement proper storage/validation)
      // For demo purposes, using a simple UUID - **REPLACE with secure implementation**
      const resetToken = uuidv4();
      const expiryMinutes = 30; // Token expiry time
      const expiryTime = new Date(Date.now() + expiryMinutes * 60000);

      // TODO: Securely store the resetToken and expiryTime associated with user.id
      // Example: await this.passwordResetTokenRepository.save({ userId: user.id, token: hashedToken, expiresAt: expiryTime });
      this.logger.log(
        `Generated reset token ${resetToken} for user ${user.username} (expires: ${expiryTime.toISOString()}) - **STORE SECURELY**`,
      );

      const frontendUrl =
        this.configService.get<string>("FRONTEND_URL") ||
        "http://localhost:5173";
      const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

      this.logger.log(
        `Sending password reset email to ${user.email} for user ${user.username}`,
      );
      await this.mailService.sendTemplatedEmail(
        user.email,
        "PASSWORD_RESET_REQUEST",
        {
          username: user.username,
          resetLink: resetLink,
        },
      );

      return {
        message:
          "If an account with this email exists, a password reset link has been sent.",
      };
    } catch (error) {
      this.logger.error(
        `Error handling forgot password request for ${email}: ${error.message}`,
        error.stack,
      );
      // Return a generic message even on internal errors
      return {
        message:
          "An error occurred while processing your request. Please try again later.",
      };
    }
  }
}
