import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsObject } from 'class-validator';

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
}
