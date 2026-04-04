import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsObject, IsOptional } from 'class-validator';

export class CreateAnswerDto {
  @ApiProperty({ description: 'Related questionnaire id' })
  @IsMongoId()
  questionnaireId: string;

  @ApiProperty({
    description: 'Object containing the answers to the questionnaire',
    example: { q1: 'Yes', q2: 'No' },
  })
  @IsObject()
  answers: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata related to this answer',
    example: { source: 'mobile-app', locale: 'fa' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
