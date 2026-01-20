import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  username: string;

  @ApiProperty({
    description: 'Password',
    example: 'A123456',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
