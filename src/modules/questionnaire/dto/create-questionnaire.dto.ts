import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';
import { QuestionnaireStatus } from '../questionnaire.model';

export class CreateQuestionnaireDto {
  @ApiProperty({
    example: 'Customer Satisfaction',
    description: 'Questionnaire title',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: { locale: 'fa', allowAnonymous: false },
    description: 'General settings object from the frontend',
  })
  @IsObject()
  @IsOptional()
  generalSettings?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: { label: 'in-review', color: '#F59E0B' },
    description: 'Detailed status metadata from the frontend',
  })
  @IsObject()
  @IsOptional()
  statusDetail?: Record<string, any> | null;

  @ApiProperty({
    example: 'Survey about product satisfaction',
    description: 'Questionnaire description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: 'https://cdn.example.com/questionnaires/cover.jpg',
    description: 'Questionnaire cover image URL',
  })
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the questionnaire is currently active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ enum: QuestionnaireStatus, required: false })
  @IsString()
  @IsOptional()
  status?: QuestionnaireStatus;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the questionnaire is unavailable',
  })
  @IsBoolean()
  @IsOptional()
  isUnavailable?: boolean;

  @ApiPropertyOptional({
    example: 'This questionnaire is temporarily unavailable',
    description: 'Unavailability message',
  })
  @IsString()
  @IsOptional()
  unavailableMessage?: string;

  @ApiProperty({
    example: 12,
    description: 'Number of questions in the questionnaire',
  })
  @IsOptional()
  questionCount?: number;

  @ApiPropertyOptional({
    description: 'Questionnaire groups',
  })
  @IsArray()
  @IsOptional()
  groups?: Record<string, any>[];

  @ApiPropertyOptional({
    description: 'Questions array',
  })
  @IsArray()
  @IsOptional()
  questions?: Record<string, any>[];

  @ApiProperty({
    example: { type: 'coins', amount: 10 },
    description: 'Reward configuration',
  })
  @IsObject()
  @IsOptional()
  reward?: Record<string, any>;

  @ApiProperty({
    example: { durationInMinutes: 20 },
    description: 'Timing configuration',
  })
  @IsObject()
  @IsOptional()
  timing?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Navigation settings',
  })
  @IsObject()
  @IsOptional()
  navigation?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Computed variables',
  })
  @IsArray()
  @IsOptional()
  computedVariables?: Record<string, any>[];

  @ApiPropertyOptional({
    example: {
      presetKey: 'default-clean',
      questionColor: '#1F2937',
      answerColor: '#374151',
    },
    description: 'Questionnaire theme settings',
  })
  @IsObject()
  @IsOptional()
  theme?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: {
      totalResponsesEnabled: false,
      optionSelectionLimitsEnabled: false,
    },
    description: 'Response limits configuration',
  })
  @IsObject()
  @IsOptional()
  responseLimits?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: { title: 'Welcome' },
    description: 'Start page configuration',
  })
  @IsObject()
  @IsOptional()
  startPage?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: { title: 'Finished' },
    description: 'End page configuration',
  })
  @IsObject()
  @IsOptional()
  endPage?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: [{ title: 'Thanks for your feedback' }],
    description: 'Thank you pages list',
  })
  @IsArray()
  @IsOptional()
  thankYouPages?: Record<string, any>[];

  @ApiProperty({
    example: [{ type: 'info', text: 'This questionnaire may be updated.' }],
    description: 'List of notices',
  })
  @IsArray()
  @IsOptional()
  notices?: Record<string, any>[];

  @ApiPropertyOptional({
    example: { enabled: true, message: 'Survey closed early' },
    description: 'Early termination configuration',
  })
  @IsObject()
  @IsOptional()
  earlyTermination?: Record<string, any> | null;
}
