import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from '../common/generic/base.controller';
import { AnswerService } from './answer.service';
import { Answer, AnswerDocument } from './answer.model';
import { CreateAnswerDto, UpdateAnswerDto } from './dto';

@ApiTags('answers')
@Controller('answers')
export class AnswerController extends BaseController<
  AnswerDocument,
  CreateAnswerDto,
  UpdateAnswerDto
>(Answer, CreateAnswerDto, UpdateAnswerDto, 'Answer') {
  constructor(private readonly answerService: AnswerService) {
    super(answerService);
  }
}
