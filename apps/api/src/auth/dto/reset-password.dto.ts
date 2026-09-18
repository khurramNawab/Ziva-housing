import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com or 9876543210' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({ example: 'NewSecurePassword@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
