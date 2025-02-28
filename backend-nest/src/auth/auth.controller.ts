import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginCredentialsDto } from './dto/auth-credentials.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signin')
  signIn(
    @Body() loginCredentialsDto: LoginCredentialsDto,
  ): Promise<{ access: string, refresh: string, user: any }> {
    return this.authService.signIn(loginCredentialsDto);
  }

  @Post('/login')
  login(
    @Body() loginCredentialsDto: LoginCredentialsDto,
  ): Promise<{ access: string, refresh: string, user: any }> {
    return this.authService.signIn(loginCredentialsDto);
  }

  @Post('/refresh')
  refresh(@Body() body: { refresh_token: string }): Promise<{ access: string, refresh: string }> {
    return this.authService.refreshToken(body.refresh_token);
  }
} 