import { IsEmail, IsString, Matches, MaxLength, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class AuthCredentialsDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak',
  })
  password: string;
}

export class LoginCredentialsDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
  
  @IsOptional()
  @IsString()
  verification_code?: string;
  
  @IsOptional()
  @IsBoolean()
  remember_me?: boolean;
} 