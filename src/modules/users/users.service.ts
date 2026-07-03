import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { User } from './user.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';

type AuthTokenPayload = {
  id: number;
  username: string;
  role: string;
};

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {
    super(userRepository);
  }

  async login(dto: LoginUserDto) {
    const username = dto.username.toLowerCase();
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .getOne();

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    const isValid = await user.comparePassword(dto.password);
    if (!isValid) {
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    }

    if (dto.FCM_token) {
      user.FCM_token = dto.FCM_token;
      await this.userRepository.save(user);
    }

    return user.toResponseObject();
  }

  async updateFcmToken(authHeader: string | undefined, dto: UpdateFcmTokenDto) {
    const payload = this.decodeAuthToken(authHeader);
    const user = await this.userRepository.findOne({ where: { id: payload.id } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    user.FCM_token = dto.FCM_token ?? null;
    await this.userRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      FCM_token: user.FCM_token,
    };
  }

  private decodeAuthToken(headerToken: string | undefined): AuthTokenPayload {
    if (!headerToken) {
      throw new UnauthorizedException('Unauthorized');
    }

    const tokenValue = headerToken.split(' ')[1] ?? headerToken.split(' ')[0];

    try {
      return jwt.verify(tokenValue, process.env.SECRET_USER ?? '') as AuthTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid user token');
    }
  }
}
