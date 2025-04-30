import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/users.service";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { UserContext } from "../interfaces/user-context.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>("JWT_SECRET");
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    console.log("[JwtStrategy] Validating payload:", payload); // Log the incoming payload
    const { username, sub } = payload;
    // Fetch user primarily to check existence and potentially get roles/permissions
    const user = await this.usersService.findOne(username);

    if (!user) {
      console.error(`[JwtStrategy] User not found for username: ${username}`);
      throw new UnauthorizedException("User not found");
    }

    // Instead of returning the full entity, return essential info including the ID from the token payload (sub)
    // This becomes the `req.user` object in controllers
    const userContext = {
      userId: sub, // Use 'sub' from the JWT payload as the primary userId
      username: username,
      role: user.role, // Include role from the fetched user entity for authorization
    };
    console.log(
      "[JwtStrategy] Validation successful, returning user context:",
      userContext,
    );
    return userContext;
    // return user; // Old problematic return
  }
}
