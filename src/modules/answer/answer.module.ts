import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Answer, AnswerSchema } from './answer.model';
import { AnswerController } from './answer.controller';
import { AnswerService } from './answer.service';
import { AnswerRepository } from './answer.repository';
import { QuestionnaireModule } from '../questionnaire/questionnaire.module';

@Module({
  imports: [
    QuestionnaireModule,
    MongooseModule.forFeature([
      {
        name: Answer.name,
        schema: AnswerSchema,
      },
    ]),
  ],
  controllers: [AnswerController],
  providers: [AnswerService, AnswerRepository],
  exports: [AnswerService, AnswerRepository, MongooseModule],
})
export class AnswerModule {}
