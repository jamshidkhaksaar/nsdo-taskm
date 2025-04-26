import { UserRole } from "../../users/entities/user.entity";

// Defines the structure of the user object attached to the request (req.user)
// or returned by WebSocket authentication.
export interface UserContext {
  userId: string;
  username: string;
  role: UserRole;
} 