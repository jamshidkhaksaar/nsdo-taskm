import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  Inject,
  forwardRef,
  BadRequestException,
  NotFoundException,
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
import { randomBytes } from "crypto";
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { SettingsService } from '../settings/settings.service';
import { UAParser } from 'ua-parser-js';
import axios from 'axios';

// Define expected return types
interface LoginSuccessResponse {
  access: string;
  refresh: string;
  user: any; // Adjust user details as needed
}

interface TwoFactorRequiredResponse {
  twoFactorRequired: true;
  userId: string;
  method: string;
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
    private readonly settingsService: SettingsService,
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
    ipAddress: string,
    userAgent: string,
  ): Promise<LoginSuccessResponse | TwoFactorRequiredResponse> {
    this.logger.log(`[DEBUG] Entered signIn. IP: ${ipAddress}, User-Agent: ${userAgent}`);
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
      // Load the user WITH the role relation AND its permissions
      const user = await this.usersService.findOne(username, ["role", "role.permissions"]); 
      
      // DETAILED LOGGING HERE
      this.logger.debug(`[AuthService.signIn] User fetched: ${JSON.stringify(user, null, 2)}`);
      if (user && user.role) {
        this.logger.debug(`[AuthService.signIn] User Role: ${JSON.stringify(user.role, null, 2)}`);
        this.logger.debug(`[AuthService.signIn] User Role Permissions: ${JSON.stringify(user.role.permissions, null, 2)}`);
      }
      // END DETAILED LOGGING

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
          `[SignIn Check] 2FA is ENABLED for user: ${username} (ID: ${user.id}). Method: ${user.twoFactorMethod}.`,
        );

        // If 2FA method is email, send the OTP now
        if (user.twoFactorMethod === 'email') {
          this.logger.log(`[SignIn Check] Sending login OTP email to user: ${user.username}`);
          await this.sendLoginTwoFactorEmailCode(user.id); // Proactively send email
        }

        // Do NOT issue tokens yet. Signal frontend that 2FA is needed.
        return {
          twoFactorRequired: true,
          userId: user.id,
          method: user.twoFactorMethod,
        };
      }
      // --- End 2FA Check ---

      // If 2FA is not enabled, proceed with login and token generation
      this.logger.log(
        `[SignIn Check] 2FA is NOT enabled for user: ${username}. Generating tokens...`,
      );
      // Ensure role name is included in the payload if needed for permissions
      const payload: JwtPayload = { 
        username: user.username, 
        sub: user.id, 
        role: user.role?.name // Keep role name in JWT payload for brevity
      };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

      // Handle new login security checks
      await this.handleNewLoginSecurityChecks(user, ipAddress, userAgent);

      this.logger.log(`Login successful (no 2FA) for user: ${username}`);
      return {
        access: accessToken,
        refresh: refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email || "",
          // Pass the entire role object, not just the name
          role: user.role || null, 
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
    ipAddress: string,
    userAgent: string,
  ): Promise<LoginSuccessResponse> {
    this.logger.log(`Attempting 2FA login for userId: ${userId}. IP: ${ipAddress}, User-Agent: ${userAgent}`);

    // Load user with role and its permissions
    const user = await this.usersService.findById(userId, ["role", "role.permissions"]);
    if (!user) {
      this.logger.error(`login2FA: User not found for ID: ${userId}`);
      throw new UnauthorizedException("Invalid user or session for 2FA.");
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      this.logger.warn(
        `login2FA: 2FA is not enabled or secret is missing for user: ${user.username}`,
      );
      throw new BadRequestException(
        "Two-Factor Authentication is not properly configured for this account.",
      );
    }

    let isCodeValid = false;

    if (user.twoFactorMethod === 'app') {
      isCodeValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret, // This should be the BASE32 encoded secret
        encoding: 'base32',
        token: verificationCode,
        window: 1, // Allow for a 30-second window variance (1 step before or after)
      });
      this.logger.log(
        `TOTP app code verification for user ${user.username}: ${isCodeValid ? "Valid" : "Invalid"}`,
      );
    } else if (user.twoFactorMethod === 'email') {
      // Email 2FA Login - verify against temporary code
      if (user.loginOtp && user.loginOtpExpiresAt && new Date() < user.loginOtpExpiresAt) {
        // Convert received code to uppercase for case-insensitive comparison
        isCodeValid = user.loginOtp === verificationCode.toUpperCase(); 
        if (isCodeValid) {
          // Clear the OTP after successful use
          await this.usersService.updateUser(user.id, { loginOtp: null, loginOtpExpiresAt: null });
        }
      }
      this.logger.log(
        `Email OTP verification for user ${user.username}: ${isCodeValid ? "Valid" : "Invalid"} (Received: ${verificationCode}, Stored: ${user.loginOtp})`,
      );
    } else {
      this.logger.error(`Unsupported 2FA method: ${user.twoFactorMethod} for user ${user.username}`);
      throw new InternalServerErrorException('Unsupported 2FA method configured.');
    }
    

    // TODO: Step 2: If TOTP failed, check if it's a valid recovery code (Future enhancement)
    if (!isCodeValid && user.twoFactorMethod === 'app') { // Recovery codes typically for app-based 2FA
      this.logger.log(
        `Primary 2FA code invalid, checking recovery codes for user: ${user.username}`
      );
      // isCodeValid = await this.usersService.verifyAndUseRecoveryCode(userId, verificationCode);
      // For now, assume recovery code check fails if primary fails
       this.logger.log(`Recovery code check result: ${isCodeValid} (currently not implemented)`);
    }

    if (!isCodeValid) {
      // Increment failed attempts logic here potentially, using SecuritySettings max_login_attempts
      // For now, just log and throw
      this.logger.warn(
        `Invalid 2FA code for user: ${user.username}`
      );
      throw new UnauthorizedException(
        "Invalid Two-Factor Authentication code.",
      );
    }

    // If code is valid, generate tokens
    this.logger.log(
      `2FA verification successful for user: ${user.username}. Generating tokens...`,
    );
    const payload: JwtPayload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role?.name // Keep role name in JWT payload
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "7d" });

    // Handle new login security checks
    await this.handleNewLoginSecurityChecks(user, ipAddress, userAgent);

    return {
      access: accessToken,
      refresh: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || "",
        // Pass the entire role object
        role: user.role || null, 
      },
    };
  }

  async generateTwoFactorSetupDetails(userId: string): Promise<{ secret: string; qrCodeUrl: string; otpAuthUrl: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const appName = this.configService.get<string>('APP_NAME') || 'NSDO TaskManager';
    // Ensure a valid name is provided even if email/username are somehow null/empty
    const issuerName = `${appName} (${user.email || user.username || 'User'})`; 
    const secret = speakeasy.generateSecret({
      length: 20,
      name: issuerName,
    });

    // secret.base32 is the secret key for the user to save.
    // secret.otpauth_url is the URL for the QR code.
    const otpAuthUrl = secret.otpauth_url;
    if (!otpAuthUrl) {
      this.logger.error(`Failed to generate otpauth_url for user ${user.username}`);
      throw new InternalServerErrorException('Could not generate OTP Auth URL');
    }
    
    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);
    
    this.logger.log(`Generated 2FA setup details for user ${user.username}. Secret: ${secret.base32}, OTPAuthURL: ${otpAuthUrl}`);
    
    // DO NOT save the secret to the user yet. It's confirmed in the next step.
    return {
      secret: secret.base32, // Send this to the user to manually enter if QR fails
      qrCodeUrl,
      otpAuthUrl // Though QR code contains this, sometimes useful to have
    };
  }

  async confirmTwoFactorSetup(userId: string, tokenFromUser: string, secretFromSetup: string): Promise<{ success: boolean; recoveryCodes?: string[] }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = speakeasy.totp.verify({
      secret: secretFromSetup, // The BASE32 secret generated during setup
      encoding: 'base32',
      token: tokenFromUser,
      window: 1,
    });

    if (!isValid) {
      this.logger.warn(`2FA setup confirmation failed for user ${user.username}. Invalid token.`);
      throw new BadRequestException('Invalid verification code. Please try again.');
    }

    // If valid, save the secret and enable 2FA for the user
    user.twoFactorSecret = secretFromSetup;
    user.twoFactorEnabled = true;
    user.twoFactorMethod = 'app'; // Default to app when setting up via QR/secret
    
    // TODO: Generate and store recovery codes (hashed)
    // const recoveryCodes = this.generateRecoveryCodes();
    // user.hashedRecoveryCodes = await Promise.all(recoveryCodes.map(code => bcrypt.hash(code, 10)));
    // await this.usersService.saveUser(user);
    // For now, just save the main changes
    await this.usersService.updateUser(user.id, {
        twoFactorSecret: secretFromSetup,
        twoFactorEnabled: true,
        twoFactorMethod: 'app',
        // hashedRecoveryCodes: user.hashedRecoveryCodes // if implementing recovery codes
    });


    this.logger.log(`2FA setup confirmed and enabled for user ${user.username} with app method.`);
    return { success: true /*, recoveryCodes */ }; // Return plain text recovery codes to the user ONCE
  }
  
  async sendLoginTwoFactorEmailCode(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.email) {
      this.logger.error(`Cannot send 2FA email code: User ${userId} not found or has no email.`);
      throw new NotFoundException('User not found or email missing.');
    }

    const code = randomBytes(3).toString('hex').toUpperCase(); // Generates a 6-character alphanumeric code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Code valid for 10 minutes

    // Attempt to update the user
    await this.usersService.updateUser(user.id, {
      loginOtp: code,
      loginOtpExpiresAt: expiresAt,
    });
    this.logger.log(`[AuthService.sendLoginTwoFactorEmailCode] Attempted to set OTP to: ${code} for user ${user.id}`);

    // Diagnostic: Re-fetch user to confirm OTP persistence
    let otpPersistedCorrectly = false;
    try {
      // It's crucial to re-fetch the user entity from the database AFTER the update attempt.
      const updatedUser = await this.usersService.findById(user.id); 
      
      this.logger.log(`[AuthService.sendLoginTwoFactorEmailCode] User ${user.id} after update attempt - DB Stored OTP: ${updatedUser?.loginOtp}, DB Expires: ${updatedUser?.loginOtpExpiresAt}`);
      
      // Check if both OTP and its expiry were persisted as expected.
      // Compare timestamps for dates to ensure accuracy, allowing for a small margin of error (e.g., 2 seconds).
      const timeDifferenceSeconds = updatedUser?.loginOtpExpiresAt ? Math.abs(updatedUser.loginOtpExpiresAt.getTime() - expiresAt.getTime()) / 1000 : Infinity;

      if (updatedUser?.loginOtp === code && timeDifferenceSeconds <= 2) { // Allow up to a 2-second difference
        otpPersistedCorrectly = true;
      } else {
        this.logger.error(`[AuthService.sendLoginTwoFactorEmailCode] CRITICAL: OTP persistence failure for user ${user.id}. Expected OTP: ${code} (Found: ${updatedUser?.loginOtp}). Expected Expiry: ${expiresAt} (Found: ${updatedUser?.loginOtpExpiresAt}, Difference: ${timeDifferenceSeconds}s).`);
      }
    } catch (fetchError) {
      this.logger.error(`[AuthService.sendLoginTwoFactorEmailCode] CRITICAL: Failed to re-fetch user ${user.id} after OTP update attempt. Error: ${fetchError.message}. Cannot confirm OTP persistence.`);
      // otpPersistedCorrectly remains false, an error will be thrown below.
    }

    if (!otpPersistedCorrectly) {
      // Do not proceed to send an email if we cannot confirm the OTP was stored.
      // This error indicates a server-side issue with saving the OTP.
      throw new InternalServerErrorException('Failed to set up 2FA email code due to a server configuration issue. Please try again later or contact support.');
    }

    // If OTP persistence is confirmed, proceed to send email
    try {
      await this.mailService.sendTemplatedEmail(
        user.email,
        'TWO_FACTOR_LOGIN_CODE', // Ensure this template exists and is configured
        {
          username: user.username,
          code: code,
          validityMinutes: 10
        },
      );
      this.logger.log(`2FA login email code sent to ${user.email} for user ${user.username}.`);
    } catch (error) {
      this.logger.error(`Failed to send 2FA login email code to ${user.email}: ${error.message}`, error.stack);
      // Decide if this error should be propagated to the user or handled silently
      // For now, if email fails, 2FA via email login will also fail.
      throw new InternalServerErrorException('Failed to send 2FA email code.');
    }
  }
  
  // Method to disable 2FA for a user
  async disableTwoFactor(userId: string, currentPassword?: string): Promise<{success: boolean}> {
      const user = await this.usersService.findById(userId);
      if (!user) {
          throw new NotFoundException('User not found');
      }

      // Optional: Verify password before allowing disabling 2FA if currentPassword is provided
      if (currentPassword) {
          const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
          if (!isPasswordValid) {
              this.logger.warn(`Attempt to disable 2FA for user ${user.username} failed due to invalid password.`);
              throw new UnauthorizedException('Invalid password.');
          }
      }
      
      await this.usersService.updateUser(user.id, {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorMethod: 'app', // Reset to default or keep previous? Resetting is safer.
          loginOtp: null,
          loginOtpExpiresAt: null,
          // hashedRecoveryCodes: null, // Clear recovery codes
      });

      this.logger.log(`2FA disabled for user ${user.username}.`);
      return { success: true };
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ access: string; refresh: string }> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Optionally, re-fetch user from DB to ensure freshness of roles/permissions
      const user = await this.usersService.findById(payload.sub, ["role", "role.permissions"]);
      if (!user) throw new UnauthorizedException('User not found during refresh');

      // Create a new access token payload (ensure it has the role name)
      const accessPayload: JwtPayload = { 
        username: user.username, // Use fresh username
        sub: user.id,            // Use fresh sub/id
        role: user.role?.name    // Use fresh role name
      };
      const newAccessToken = this.jwtService.sign(accessPayload);

      // Optionally, generate a new refresh token as well for better security (token rotation)
      // For simplicity, we are re-using the old refresh token's original payload structure for a new refresh token
      // but ideally, the refresh token payload might also be updated or have its own structure.
      const refreshPayload: JwtPayload = {
        username: user.username,
        sub: user.id,
        role: user.role?.name,
      };
      const newRefreshToken = this.jwtService.sign(refreshPayload, { expiresIn: "7d" });

      return {
        access: newAccessToken,
        refresh: newRefreshToken, // Return the new refresh token
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

  async requestPasswordReset(email: string): Promise<void> {
    this.logger.log(`Requesting password reset for email: ${email}`);
    // Use UsersService to find by email
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // User not found, but don't reveal this to the client
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return; // Silently exit
    }

    // Generate a secure, unique token
    const token = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

    // Store the token and expiry on the user record
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;

    try {
      // Use UsersService to save the updated user
      await this.usersService.saveUser(user);
      this.logger.log(`Saved password reset token for user ${user.id}`);

      // Construct the reset URL
      // TODO: Get frontend URL from config/env variables
      const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; 
      const resetUrl = `${frontendBaseUrl}/reset-password?token=${token}`;

      // Send the email using MailService (assuming a template exists)
      await this.mailService.sendTemplatedEmail(
        user.email,
        'PASSWORD_RESET_REQUEST', // Key for the password reset email template
        {
          username: user.username,
          resetLink: resetUrl,
          expiryTime: "1 hour", // Or format the expiry time more precisely
        },
      );
      this.logger.log(`Password reset email sent to ${user.email}`);

    } catch (error) {
      this.logger.error(`Error during password reset request for ${email}: ${error.message}`, error.stack);
      // Don't throw error to client to prevent information leakage
      // Error is logged internally
    }
  }

  // The functionality of this method has been moved to UsersService.initiatePasswordReset
  // and is called directly from UsersController. It can be removed.
  /*
  async handleForgotPasswordRequest(
    email: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Handling forgot password request for email: ${email}`);
    // This now directly calls the new UsersService method
    // In a real app, you might add more logic here like rate limiting
    await this.usersService.initiatePasswordReset(email);
    return {
      message:
        "If your email address is in our database, you will receive a password recovery link at your email address in a few minutes.",
    };
  }
  */

  // NEW METHOD for handling login security checks
  private async handleNewLoginSecurityChecks(user: User, ipAddress: string, userAgentString: string): Promise<void> {
    this.logger.log(`[SecurityCheck] Handling new login for user ${user.username} (ID: ${user.id}) from IP: ${ipAddress}`);

    if (!userAgentString) {
      this.logger.warn(`[SecurityCheck] User-Agent string is empty for user ${user.id}. Skipping device fingerprinting.`);
      return;
    }

    const parser = new UAParser(userAgentString);
    const uaResult = parser.getResult();
    const browserName = uaResult.browser.name || 'Unknown Browser';
    const browserVersion = uaResult.browser.version || 'Unknown Version';
    const osName = uaResult.os.name || 'Unknown OS';
    const osVersion = uaResult.os.version || 'Unknown Version';

    const deviceFingerprint = `${browserName}_${osName}_${userAgentString}`;
    const now = new Date();
    let isNewDevice = true;

    if (user.rememberedBrowsers && user.rememberedBrowsers.length > 0) {
      const existingDevice = user.rememberedBrowsers.find(
        b => b.fingerprint === deviceFingerprint && b.expiresAt > now
      );
      if (existingDevice) {
        isNewDevice = false;
        this.logger.log(`[SecurityCheck] Recognized device for user ${user.id}: ${deviceFingerprint}`);
      }
    }

    if (isNewDevice) {
      this.logger.log(`[SecurityCheck] New or unrecognized device detected for user ${user.id}: ${deviceFingerprint}`);

      let locationInfo = 'Location details unavailable';
      // Exclude private/localhost IPs from geolocation lookup
      const isPrivateIp = /^(::1|127\.0\.0\.1|localhost|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(ipAddress);

      if (ipAddress && !isPrivateIp) {
        try {
          // ip-api.com returns 429 if rate limited (45 reqs/min for free tier)
          const response = await axios.get(`http://ip-api.com/json/${ipAddress}?fields=status,message,country,city,isp,query`);
          if (response.data && response.data.status === 'success') {
            locationInfo = `${response.data.city || ''}, ${response.data.country || ''} (ISP: ${response.data.isp || 'Unknown'})`;
          } else {
            this.logger.warn(`[SecurityCheck] Geolocation lookup failed for IP ${ipAddress}: ${response.data.message || 'Unknown reason'}`);
            locationInfo = `Unable to determine location (IP: ${ipAddress})`;
          }
        } catch (geoError) {
          this.logger.error(`[SecurityCheck] Geolocation API error for IP ${ipAddress}: ${geoError.message}`, geoError.stack);
          locationInfo = `Error determining location (IP: ${ipAddress})`;
        }
      } else if (isPrivateIp) {
        locationInfo = 'Local Network / Private IP Address';
        this.logger.log(`[SecurityCheck] IP address ${ipAddress} is private. Skipping public geolocation.`);
      } else {
        locationInfo = 'IP Address not available for geolocation.';
      }

      const appName = this.configService.get<string>('APP_NAME') || 'Our Application';
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
      const resetPasswordLink = `${frontendUrl}/reset-password`; // Or a more general security page if you have one

      try {
        this.logger.log(`[SecurityCheck] Sending 'New Login Notification' email to ${user.email} for user ${user.id}. Details - IP: ${ipAddress}, Location: ${locationInfo}, Browser: ${browserName} ${browserVersion}, OS: ${osName} ${osVersion}`);
        
        await this.mailService.sendTemplatedEmail(
          user.email,
          'NEW_LOGIN_NOTIFICATION', 
          {
            username: user.username,
            appName: appName,
            loginTime: now.toLocaleString(), // Consider formatting this more nicely or using a specific timezone
            ipAddress: ipAddress,
            location: locationInfo, 
            browserName: browserName,
            browserVersion: browserVersion,
            osName: osName,
            osVersion: osVersion,
            resetPasswordLink: resetPasswordLink 
          }
        );
        this.logger.log(`[SecurityCheck] Successfully sent 'New Login Notification' email to ${user.email}`);

      } catch (emailError) {
        this.logger.error(`[SecurityCheck] Failed to send new login notification for user ${user.id}: ${emailError.message}`, emailError.stack);
      }

      const newExpiry = new Date();
      newExpiry.setDate(now.getDate() + 90); // Remember for 90 days

      if (!user.rememberedBrowsers) {
        user.rememberedBrowsers = [];
      }
      // Remove old entry if it exists (e.g., expired or same fingerprint with old expiry)
      user.rememberedBrowsers = user.rememberedBrowsers.filter(b => b.fingerprint !== deviceFingerprint);
      user.rememberedBrowsers.push({ fingerprint: deviceFingerprint, expiresAt: newExpiry });

      try {
        await this.usersService.saveUser(user); // Save the updated user with the new remembered browser
        this.logger.log(`[SecurityCheck] Successfully remembered new device for user ${user.id}`);
      } catch (saveError) {
        this.logger.error(`[SecurityCheck] Failed to save remembered browser for user ${user.id}: ${saveError.message}`, saveError.stack);
      }
    }
  }
}
