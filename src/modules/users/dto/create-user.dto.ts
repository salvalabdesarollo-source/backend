import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '../enum/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'Unique username',
    example: 'john_doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  username: string;

  @ApiProperty({
    description: 'User password (plain text, will be hashed)',
    example: 'A123456',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    example: UserRole.Administrator,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+1 555 123 4567',
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;
}
