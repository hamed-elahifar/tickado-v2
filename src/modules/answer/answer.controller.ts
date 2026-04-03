import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BaseController } from '../common/generic/base.controller';
import { AnswerService } from './answer.service';
import { Answer, AnswerDocument } from './answer.model';
import { CreateAnswerDto, UpdateAnswerDto } from './dto';
import { GetJwt } from '../auth/decorators/jwt.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createAnswerDto: CreateAnswerDto,
    @GetJwt() jwt: JwtPayload,
  ): Promise<AnswerDocument> {
    return this.answerService.createForUser(createAnswerDto, jwt.userID);
  }

  @Get('count/:questionnaireId')
  @ApiOperation({
    summary: 'Get count of answers for a specific questionnaire',
  })
  async getCountByQuestionnaire(
    @Param('questionnaireId') questionnaireId: string,
  ): Promise<{ count: number }> {
    const count =
      await this.answerService.getCountByQuestionnaireId(questionnaireId);
    return { count };
  }
}
