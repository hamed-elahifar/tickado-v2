import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class AssignTicketDto {
  @ApiProperty({
    example: '6530f9a5c2bd9f7c8c1e1b99',
    description: 'Identifier of the assignee. Send null to unassign.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsMongoId()
  assignedTo?: string | null;
}
