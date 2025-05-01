export interface JwtPayload {
  username: string;
  sub: string; // Standard JWT subject claim (usually user ID)
  role?: string; // Add optional role name
}
