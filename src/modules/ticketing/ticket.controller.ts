import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BaseController } from '../common/generic/base.controller';
import { Ticket, TicketDocument } from './ticket.model';
import {
  AddTicketResponseDto,
  AssignTicketDto,
  CreateTicketDto,
  UpdateTicketDto,
  UpdateTicketStatusDto,
} from './dto';
import { TicketService } from './ticket.service';
import { PaginationQueryDto } from '../common/dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesEnum } from '../auth/enums/roles.enum';
import { GetJwt } from '../auth/decorators/jwt.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('tickets')
@Controller('tickets')
export class TicketController extends BaseController<
  TicketDocument,
  CreateTicketDto,
  UpdateTicketDto
>(Ticket, CreateTicketDto, UpdateTicketDto, 'Ticket') {
  constructor(private readonly ticketService: TicketService) {
    super(ticketService);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get tickets for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Return user tickets.',
    type: [Ticket],
  })
  findByUserId(
    @Param('userId') userId: string,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('projection') projection?: string | string[],
  ): Promise<TicketDocument[]> {
    return this.ticketService.findByUserId(userId, paginationQuery, projection);
  }

  @Patch(':id/status')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Update ticket status' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket status updated.',
    type: Ticket,
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ): Promise<TicketDocument> {
    return this.ticketService.updateStatus(id, dto);
  }

  @Patch(':id/assign')
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Assign or unassign a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket assignment updated.',
    type: Ticket,
  })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
  ): Promise<TicketDocument> {
    return this.ticketService.assign(id, dto);
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Add response to ticket thread' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({
    status: 201,
    description: 'Response added to ticket.',
    type: Ticket,
  })
  addResponse(
    @Param('id') id: string,
    @Body() dto: AddTicketResponseDto,
    @GetJwt() jwt: JwtPayload,
  ): Promise<TicketDocument> {
    return this.ticketService.addResponse(id, dto, jwt.userID, jwt.roles);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ticket by id' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket deleted.' })
  remove(
    @Param('id') id: string,
    @GetJwt() jwt: JwtPayload,
  ): Promise<{ deleted: boolean }> {
    return this.ticketService.remove(id, jwt.userID, jwt.roles);
  }
}
