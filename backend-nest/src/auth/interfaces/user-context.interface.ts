import { User } from "../../users/entities/user.entity";

// Defines the structure of the user object attached to the request (req.user)
// or returned by WebSocket authentication.
export interface UserContext extends User {
  userId: string;
  username: string;
}
