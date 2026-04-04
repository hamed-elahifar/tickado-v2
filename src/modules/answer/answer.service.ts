import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '../common/generic/base.service';
import { AnswerDocument, AnswerStatus } from './answer.model';
import { CreateAnswerDto, UpdateAnswerDto } from './dto';
import { AnswerRepository } from './answer.repository';
import { QuestionnaireRepository } from '../questionnaire/questionnaire.repository';
import { Types } from 'mongoose';

@Injectable()
export class AnswerService extends BaseService<
  AnswerDocument,
  CreateAnswerDto,
  UpdateAnswerDto
> {
  constructor(
    repository: AnswerRepository,
    private readonly questionnaireRepository: QuestionnaireRepository,
  ) {
    super(repository, 'Answer');
  }

  async createForUser(
    createAnswerDto: CreateAnswerDto,
    userId: string,
  ): Promise<AnswerDocument> {
    return this.startOrResumeForUser(
      createAnswerDto.questionnaireId,
      userId,
      createAnswerDto.answers,
    );
  }

  async startOrResumeForUser(
    questionnaireId: string,
    userId: string,
    initialAnswers: Record<string, any> = {},
  ): Promise<AnswerDocument> {
    this.assertValidQuestionnaireId(questionnaireId);
    await this.assertQuestionnaireExists(questionnaireId);

    const existingAnswer = await this.repository.findOne({
      questionnaireId: new Types.ObjectId(questionnaireId),
      userId: new Types.ObjectId(userId),
      status: AnswerStatus.IN_PROGRESS,
    });

    if (existingAnswer) {
      return existingAnswer;
    }

    return this.create({
      questionnaireId,
      userId,
      answers: initialAnswers,
      status: AnswerStatus.IN_PROGRESS,
      startTime: new Date(),
    } as CreateAnswerDto & {
      userId: string;
      status: AnswerStatus;
      startTime: Date;
    });
  }

  async updateCurrentAnswerForUser(
    questionnaireId: string,
    userId: string,
    updateAnswerDto: UpdateAnswerDto,
  ): Promise<AnswerDocument> {
    this.assertValidQuestionnaireId(questionnaireId);

    const updatedAnswer = await this.repository.update(
      {
        questionnaireId: new Types.ObjectId(questionnaireId),
        userId: new Types.ObjectId(userId),
        status: AnswerStatus.IN_PROGRESS,
      },
      updateAnswerDto as Record<string, any>,
    );

    if (!updatedAnswer) {
      throw new NotFoundException('Uncompleted answer not found');
    }

    return updatedAnswer;
  }

  async finishCurrentAnswerForUser(
    questionnaireId: string,
    userId: string,
  ): Promise<AnswerDocument> {
    this.assertValidQuestionnaireId(questionnaireId);

    const finishedAnswer = await this.repository.update(
      {
        questionnaireId: new Types.ObjectId(questionnaireId),
        userId: new Types.ObjectId(userId),
        status: AnswerStatus.IN_PROGRESS,
      },
      {
        status: AnswerStatus.FINISHED,
        finishTime: new Date(),
      } as Record<string, any>,
    );

    if (!finishedAnswer) {
      throw new NotFoundException('Uncompleted answer not found');
    }

    return finishedAnswer;
  }

  async getCountByQuestionnaireId(questionnaireId: string): Promise<number> {
    return await this.repository.count({ questionnaireId });
  }

  private assertValidQuestionnaireId(questionnaireId: string): void {
    if (!Types.ObjectId.isValid(questionnaireId)) {
      throw new BadRequestException('Invalid questionnaireId');
    }
  }

  private async assertQuestionnaireExists(
    questionnaireId: string,
  ): Promise<void> {
    const questionnaire = await this.questionnaireRepository.findOne({
      _id: questionnaireId,
    });

    if (!questionnaire) {
      throw new NotFoundException(`Questionnaire ${questionnaireId} not found`);
    }
  }
}
