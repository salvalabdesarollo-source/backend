import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SendTestNotificationDto {
  @ApiProperty({
    description: 'Target user id',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  userId: number;

  @ApiPropertyOptional({
    description: 'Notification title',
    example: 'Notificación de prueba',
  })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({
    description: 'Notification body',
    example: 'Si ves esto, Firebase está funcionando correctamente.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  body?: string;
}
