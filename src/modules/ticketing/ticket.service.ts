import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '../common/generic/base.service';
import { TicketDocument } from './ticket.model';
import {
  AddTicketResponseDto,
  AssignTicketDto,
  CreateTicketDto,
  UpdateTicketDto,
  UpdateTicketStatusDto,
} from './dto';
import { TicketRepository } from './ticket.repository';
import { PaginationQueryDto } from '../common/dto';
import { RolesEnum } from '../auth/enums/roles.enum';

@Injectable()
export class TicketService extends BaseService<
  TicketDocument,
  CreateTicketDto,
  UpdateTicketDto
> {
  constructor(private readonly ticketRepository: TicketRepository) {
    super(ticketRepository, 'Ticket');
  }

  async findByUserId(
    userId: string,
    paginationQueryDto?: PaginationQueryDto,
    projection?: string | string[],
  ): Promise<TicketDocument[]> {
    if (!this.isValidObjectId(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    const { limit = 10, offset = 0 } = paginationQueryDto || {};
    const normalizedProjection = this.normalizeProjectionFields(projection);
    const tickets = await this.ticketRepository.findByUserId(
      userId,
      normalizedProjection,
      {
        limit,
        offset,
      },
    );

    return tickets || [];
  }

  async updateStatus(
    ticketId: string,
    dto: UpdateTicketStatusDto,
  ): Promise<TicketDocument> {
    if (!this.isValidObjectId(ticketId)) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    const ticket = await this.ticketRepository.updateStatus(
      ticketId,
      dto.status,
    );

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    return ticket;
  }

  async assign(
    ticketId: string,
    dto: AssignTicketDto,
  ): Promise<TicketDocument> {
    if (!this.isValidObjectId(ticketId)) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    if (dto.assignedTo && !this.isValidObjectId(dto.assignedTo)) {
      throw new BadRequestException('Invalid assignee id');
    }

    const ticket = await this.ticketRepository.assign(
      ticketId,
      dto.assignedTo ?? null,
    );

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    return ticket;
  }

  async addResponse(
    ticketId: string,
    dto: AddTicketResponseDto,
    requesterId: string,
    requesterRoles?: RolesEnum | RolesEnum[],
  ): Promise<TicketDocument> {
    if (!this.isValidObjectId(ticketId)) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    if (!this.isValidObjectId(requesterId)) {
      throw new BadRequestException('Invalid requester id');
    }

    if (dto.operatorId && !this.isValidObjectId(dto.operatorId)) {
      throw new BadRequestException('Invalid operator id');
    }

    const ticket = await this.ticketRepository.findOne({
      _id: ticketId,
    } as Record<string, unknown>);

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    const normalizedRoles = Array.isArray(requesterRoles)
      ? requesterRoles
      : requesterRoles
        ? [requesterRoles]
        : [];

    const isAdmin = normalizedRoles.includes(RolesEnum.ADMIN);
    const isOwner = ticket.userId?.toString() === requesterId;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You are not allowed to add response to this ticket',
      );
    }

    if (dto.createdBy === 'operator' && !isAdmin) {
      throw new ForbiddenException('Only admin can add operator responses');
    }

    const updatedTicket = await this.ticketRepository.appendResponse(ticketId, {
      message: dto.message,
      createdBy: dto.createdBy,
      operatorId: dto.operatorId ?? null,
    });

    if (!updatedTicket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    return updatedTicket;
  }

  async remove(
    ticketId: string,
    requesterId: string,
    requesterRoles?: RolesEnum | RolesEnum[],
  ): Promise<{ deleted: boolean }> {
    if (!this.isValidObjectId(ticketId)) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    if (!this.isValidObjectId(requesterId)) {
      throw new BadRequestException('Invalid requester id');
    }

    const ticket = await this.ticketRepository.findOne({
      _id: ticketId,
    } as Record<string, unknown>);

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    const normalizedRoles = Array.isArray(requesterRoles)
      ? requesterRoles
      : requesterRoles
        ? [requesterRoles]
        : [];

    const isAdmin = normalizedRoles.includes(RolesEnum.ADMIN);
    const isOwner = ticket.userId?.toString() === requesterId;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to delete this ticket');
    }

    const deleted = await this.ticketRepository.deleteById(ticketId);

    if (!deleted) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    return { deleted: true };
  }

  private normalizeProjectionFields(
    projection?: string[] | string,
  ): string[] | undefined {
    if (!projection) return undefined;

    const fields = Array.isArray(projection)
      ? projection
      : projection.split(',');

    const normalized = fields
      .map((field) => field.trim())
      .filter((field) => field.length > 0);

    return normalized.length > 0 ? normalized : undefined;
  }
}
