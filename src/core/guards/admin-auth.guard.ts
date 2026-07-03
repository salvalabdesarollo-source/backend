import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '../../modules/users/enum/user-role.enum';

type AuthTokenPayload = {
  id: number;
  username: string;
  role: UserRole;
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerToken = request.headers?.token as string | undefined;
    const authHeader = request.headers?.authorization as string | undefined;
    const tokenValue = headerToken ?? authHeader;

    if (!tokenValue) {
      throw new UnauthorizedException('Unauthorized');
    }

    const tokenToValidate = tokenValue.split(' ')[1] ?? tokenValue.split(' ')[0];

    try {
      const payload = jwt.verify(
        tokenToValidate,
        process.env.SECRET_USER ?? '',
      ) as AuthTokenPayload;

      if (payload.role !== UserRole.Administrator) {
        throw new ForbiddenException('Administrator access required');
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid user token');
    }
  }
}
