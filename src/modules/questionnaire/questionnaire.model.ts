import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createShortID } from '../common/utils/nanoid';

export type QuestionnaireDocument = Questionnaire & Document;

export enum QuestionnaireStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Questionnaire extends Document {
  @ApiProperty({
    example: 'A1B2C3D4',
    description: 'Short questionnaire identifier',
  })
  @Prop({ type: String, default: createShortID(8) })
  shortId: string;

  @ApiProperty({
    enum: QuestionnaireStatus,
    default: QuestionnaireStatus.DRAFT,
  })
  @Prop({
    type: String,
    enum: QuestionnaireStatus,
    default: QuestionnaireStatus.DRAFT,
  })
  status: QuestionnaireStatus;

  @ApiProperty({
    example: true,
    description:
      'Whether the questionnaire is currently active based on status',
  })
  isActive: boolean;

  @ApiProperty({
    example: 'Customer Satisfaction',
    description: 'Questionnaire title',
  })
  @Prop({ required: true })
  title: string;

  @ApiPropertyOptional({
    example: { locale: 'fa', allowAnonymous: false },
    description: 'Optional general settings object from the frontend',
  })
  @Prop({ type: Object, default: null })
  generalSettings?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: { label: 'in-review', color: '#F59E0B' },
    description: 'Optional detailed status metadata from the frontend',
  })
  @Prop({ type: Object, default: null })
  statusDetail?: Record<string, any> | null;

  @ApiProperty({
    example: 'Survey about product satisfaction',
    description: 'Questionnaire description',
  })
  @Prop({ default: '' })
  description: string;

  @ApiProperty({
    example: 'https://cdn.example.com/questionnaires/cover.jpg',
    description: 'Questionnaire cover image URL',
  })
  @Prop({ default: '' })
  imageUrl: string;

  @ApiProperty({
    example: 12,
    description: 'Number of questions in the questionnaire',
  })
  @Prop({ type: Number, default: 0 })
  questionCount: number;

  @ApiPropertyOptional({
    example: [{ name: 'General' }],
    description: 'Optional questionnaire groups definition',
  })
  @Prop({ type: [Object], default: [] })
  groups?: Record<string, any>[];

  @ApiPropertyOptional({
    example: [{ title: 'sample title' }],
    description: 'Optional questions array',
  })
  @Prop({ type: [Object], default: [] })
  questions?: Record<string, any>[];

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the questionnaire is unavailable',
  })
  @Prop({ type: Boolean, default: false })
  isUnavailable?: boolean;

  @ApiPropertyOptional({
    example: 'This questionnaire is temporarily unavailable',
    description: 'Unavailability message',
  })
  @Prop({ type: String, default: '' })
  unavailableMessage?: string;

  @ApiProperty({
    example: { type: 'coins', amount: 10 },
    description: 'Reward configuration of the questionnaire',
  })
  @Prop({ type: Object, default: {} })
  reward: Record<string, any>;

  @ApiProperty({
    example: { durationInMinutes: 20 },
    description: 'Timing configuration of the questionnaire',
  })
  @Prop({ type: Object, default: {} })
  timing: Record<string, any>;

  @ApiPropertyOptional({
    example: { canSkip: true },
    description: 'Optional navigation settings',
  })
  @Prop({ type: Object, default: null })
  navigation?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: [{ name: 'score', expression: 'q1 + q2' }],
    description: 'Optional computed variables',
  })
  @Prop({ type: [Object], default: [] })
  computedVariables?: Record<string, any>[];

  @ApiPropertyOptional({
    example: {
      presetKey: 'default-clean',
      questionColor: '#1F2937',
      answerColor: '#374151',
    },
    description: 'Optional questionnaire theme settings',
  })
  @Prop({ type: Object, default: null })
  theme?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: {
      totalResponsesEnabled: false,
      optionSelectionLimitsEnabled: false,
    },
    description: 'Optional response limits configuration',
  })
  @Prop({ type: Object, default: null })
  responseLimits?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: { title: 'Welcome' },
    description: 'Optional start page configuration',
  })
  @Prop({ type: Object, default: null })
  startPage?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: { title: 'Finished' },
    description: 'Optional end page configuration',
  })
  @Prop({ type: Object, default: null })
  endPage?: Record<string, any> | null;

  @ApiPropertyOptional({
    example: [{ title: 'Thanks for your feedback' }],
    description: 'Optional thank-you pages list',
  })
  @Prop({ type: [Object], default: [] })
  thankYouPages?: Record<string, any>[];

  @ApiProperty({
    example: [{ type: 'info', text: 'This questionnaire may be updated.' }],
    description: 'List of notices displayed to participants',
  })
  @Prop({ type: [Object], default: [] })
  notices: Record<string, any>[];

  @ApiPropertyOptional({
    example: { enabled: true, message: 'Survey closed early' },
    description: 'Optional early termination configuration',
  })
  @Prop({ type: Object, default: null })
  earlyTermination?: Record<string, any> | null;
}

export const QuestionnaireSchema = SchemaFactory.createForClass(Questionnaire);

QuestionnaireSchema.virtual('isActive').get(function () {
  return this.status === QuestionnaireStatus.ACTIVE;
});
