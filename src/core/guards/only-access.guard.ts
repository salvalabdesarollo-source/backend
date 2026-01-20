import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class OnlyAccessGuard implements CanActivate {
  constructor(private readonly guards: CanActivate[]) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    for (const guard of this.guards) {
      try {
        const allowed = await guard.canActivate(context);
        if (allowed) {
          return true;
        }
      } catch (error) {}
    }
    return false;
  }
}
