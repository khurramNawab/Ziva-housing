import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '9876543210 or email@example.com' })
  @IsString()
  identifier: string;

  @ApiProperty()
  @IsString()
  password: string;
}
