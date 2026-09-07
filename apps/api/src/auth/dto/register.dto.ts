import { IsString, IsOptional, IsEmail, IsEnum, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Invalid Indian mobile number' })
  phone: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ enum: ['CUSTOMER', 'OWNER', 'AGENT', 'SERVICE_PROVIDER'] })
  @IsEnum(['CUSTOMER', 'OWNER', 'AGENT', 'SERVICE_PROVIDER'])
  role: 'CUSTOMER' | 'OWNER' | 'AGENT' | 'SERVICE_PROVIDER';

  @ApiPropertyOptional({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
