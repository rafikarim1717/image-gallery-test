import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const payload = await this.authService.validateToken(token);
      request.user = payload; // Attach user to request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}