import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

  @Post('start/:questionnaireId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start or resume an answer for a questionnaire',
  })
  @ApiParam({ name: 'questionnaireId', description: 'Questionnaire ID' })
  @ApiResponse({
    status: 200,
    description:
      'Returns the existing uncompleted answer or creates a new one.',
    type: Answer,
  })
  async start(
    @Param('questionnaireId') questionnaireId: string,
    @GetJwt() jwt: JwtPayload,
  ): Promise<AnswerDocument> {
    const answer = await this.answerService.startOrResumeForUser(
      questionnaireId,
      jwt.userID,
    );

    return answer;
  }

  @Patch('update/:questionnaireId')
  @ApiOperation({ summary: 'Patch the current uncompleted answer' })
  @ApiParam({ name: 'questionnaireId', description: 'Questionnaire ID' })
  @ApiBody({ type: UpdateAnswerDto })
  @ApiResponse({
    status: 200,
    description: 'Uncompleted answer updated successfully.',
    type: Answer,
  })
  async updateCurrentAnswer(
    @Param('questionnaireId') questionnaireId: string,
    @Body() updateAnswerDto: UpdateAnswerDto,
    @GetJwt() jwt: JwtPayload,
  ): Promise<AnswerDocument> {
    const answer = await this.answerService.updateCurrentAnswerForUser(
      questionnaireId,
      jwt.userID,
      updateAnswerDto,
    );

    return answer;
  }

  @Patch('finish/:questionnaireId')
  @ApiOperation({ summary: 'Finish the current uncompleted answer' })
  @ApiParam({ name: 'questionnaireId', description: 'Questionnaire ID' })
  @ApiResponse({
    status: 200,
    description: 'Uncompleted answer marked as finished.',
    type: Answer,
  })
  async finishCurrentAnswer(
    @Param('questionnaireId') questionnaireId: string,
    @GetJwt() jwt: JwtPayload,
  ): Promise<AnswerDocument> {
    const answer = await this.answerService.finishCurrentAnswerForUser(
      questionnaireId,
      jwt.userID,
    );

    return answer;
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
