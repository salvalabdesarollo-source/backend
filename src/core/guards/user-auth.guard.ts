import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UserAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request.url?.toString() === '/users/login') {
      return true;
    }

    const headerToken = request.headers?.token as string | undefined;
    const authHeader = request.headers?.authorization as string | undefined;
    const tokenValue = headerToken ?? authHeader;

    if (!tokenValue) {
      throw new UnauthorizedException('Unauthorized');
    }

    const tokenToValidate = tokenValue.split(' ')[1] ?? tokenValue.split(' ')[0];
    try {
      jwt.verify(tokenToValidate, process.env.SECRET_USER ?? '');
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid user token');
    }
  }
}
