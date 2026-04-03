import { Injectable } from '@nestjs/common';
import { BaseService } from '../common/generic/base.service';
import { AnswerDocument } from './answer.model';
import { CreateAnswerDto, UpdateAnswerDto } from './dto';
import { AnswerRepository } from './answer.repository';

@Injectable()
export class AnswerService extends BaseService<
  AnswerDocument,
  CreateAnswerDto,
  UpdateAnswerDto
> {
  constructor(repository: AnswerRepository) {
    super(repository, 'Answer');
  }

  async createForUser(
    createAnswerDto: CreateAnswerDto,
    userId: string,
  ): Promise<AnswerDocument> {
    return this.create({
      ...createAnswerDto,
      userId,
    } as CreateAnswerDto & { userId: string });
  }

  async getCountByQuestionnaireId(questionnaireId: string): Promise<number> {
    return await this.repository.count({ questionnaireId });
  }
}
