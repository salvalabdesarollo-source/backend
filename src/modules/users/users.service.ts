import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {
    super(userRepository);
  }

  async login(dto: LoginUserDto) {
    const username = dto.username.toLowerCase();
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .getOne();

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    const isValid = await user.comparePassword(dto.password);
    if (!isValid) {
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    }

    return user.toResponseObject();
  }
}
