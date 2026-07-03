import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateFcmTokenDto {
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
