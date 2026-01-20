import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud } from '@dataui/crud';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UserAuthGuard } from '../../core/guards/user-auth.guard';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Crud({
  model: {
    type: User,
  },
  dto: {
    create: CreateUserDto,
    update: UpdateUserDto,
    replace: UpdateUserDto,
  },
  query: {
    exclude: ['password'],
    sort: [
      {
        field: 'createdAt',
        order: 'DESC',
      },
    ],
  },
  routes: {
    getManyBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    getOneBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    createOneBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    createManyBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    updateOneBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    replaceOneBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
    deleteOneBase: {
      decorators: [ApiBearerAuth(), UseGuards(UserAuthGuard)],
    },
  },
})
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(public service: UsersService) {}

  @Post('login')
  async login(@Body() dto: LoginUserDto): Promise<any> {
    return await this.service.login(dto);
  }
}
