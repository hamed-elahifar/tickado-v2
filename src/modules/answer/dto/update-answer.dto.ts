import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAnswerDto } from './create-answer.dto';

export class UpdateAnswerDto extends PartialType(
	OmitType(CreateAnswerDto, ['questionnaireId'] as const),
) {}
