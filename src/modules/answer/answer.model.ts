import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type AnswerDocument = Answer & Document;

export enum AnswerStatus {
  IN_PROGRESS = 'in-progress',
  FINISHED = 'finished',
}

@Schema({ timestamps: true })
export class Answer extends Document {
  @ApiProperty({
    example: '6530f9a5c2bd9f7c8c1e1b23',
    description: 'Related questionnaire id',
  })
  @Prop({ type: Types.ObjectId, ref: 'Questionnaire', required: true })
  questionnaireId: Types.ObjectId;

  @ApiProperty({
    example: '6530f9a5c2bd9f7c8c1e1b99',
    description: 'Related user id',
  })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({
    enum: AnswerStatus,
    default: AnswerStatus.IN_PROGRESS,
    description: 'Current lifecycle status of the answer',
  })
  @Prop({
    type: String,
    enum: AnswerStatus,
    default: AnswerStatus.IN_PROGRESS,
  })
  status: AnswerStatus;

  @ApiProperty({
    example: '2026-04-04T10:20:30.000Z',
    description: 'Timestamp indicating when the answer was started',
  })
  @Prop({ type: Date, default: Date.now })
  startTime: Date;

  @ApiProperty({
    example: '2026-04-04T10:30:30.000Z',
    required: false,
    nullable: true,
    description: 'Timestamp indicating when the answer was finished',
  })
  @Prop({ type: Date, default: null })
  finishTime?: Date | null;

  @ApiProperty({
    example: { q1: 'Yes', q2: 'No' },
    description: 'Object containing the answers to the questionnaire',
  })
  @Prop({ type: Object, default: {} })
  answers: Record<string, any>;

  @ApiProperty({
    example: { source: 'mobile-app', locale: 'fa' },
    description: 'Additional metadata related to this answer',
  })
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
