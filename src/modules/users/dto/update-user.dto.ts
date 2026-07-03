import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '../enum/user-role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Unique username',
    example: 'john_doe',
  })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  username?: string;

  @ApiPropertyOptional({
    description: 'New password (plain text, will be hashed)',
    example: 'A123456',
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    example: UserRole.Scanner,
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

  @ApiPropertyOptional({
    description: 'Firebase Cloud Messaging device token',
    example: 'dXyz123...',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @MaxLength(512)
  FCM_token?: string | null;
}
