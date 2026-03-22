import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class SignUpDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'The name of the user',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: '+989123456789',
    description: 'The phone number of the user',
  })
  @IsPhoneNumber()
  phone: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'password123',
    description: 'The password of the user',
  })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'The locale of the user',
  })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiPropertyOptional({
    example: { bio: 'Software Engineer', interests: ['coding', 'hiking'] },
    description: 'Arbitrary key-value pairs for the user profile',
    type: Object,
    additionalProperties: true,
  })
  @IsObject()
  @IsOptional()
  profile?: Record<string, any>;
}
