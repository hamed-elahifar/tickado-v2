import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';

const RESPONSE_AUTHORS = ['operator', 'user'] as const;
type ResponseAuthor = (typeof RESPONSE_AUTHORS)[number];

export class AddTicketResponseDto {
  @ApiProperty({
    example: 'We are checking this issue and will update you shortly.',
    description: 'Response message that will be appended to the ticket',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: 'operator',
    enum: RESPONSE_AUTHORS,
    description: 'Indicates whether this response is from operator or user',
  })
  @IsIn(RESPONSE_AUTHORS)
  createdBy: ResponseAuthor;

  @ApiProperty({
    example: '6530f9a5c2bd9f7c8c1e1b99',
    description: 'Identifier of the operator who posted the response',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsMongoId()
  operatorId?: string | null;
}
