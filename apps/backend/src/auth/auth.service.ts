import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  // In a real application, you would use a proper database and JWT tokens
  private users = new Map<string, { email: string; password: string; name: string }>();

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;
    
    if (this.users.has(email)) {
      throw new UnauthorizedException('User already exists');
    }

    // In a real app, hash the password
    this.users.set(email, { email, password, name });

    return {
      message: 'User registered successfully',
      user: { email, name },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = this.users.get(email);

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // In a real app, generate JWT token
    return {
      message: 'Login successful',
      user: { email: user.email, name: user.name },
      token: 'mock-jwt-token',
    };
  }
}
