import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../common/generic/base.repository';
import { Ticket, TicketDocument } from './ticket.model';
import { TicketStatus } from './enums/ticket-status.enum';

@Injectable()
export class TicketRepository extends BaseRepository<TicketDocument> {
  constructor(@InjectModel(Ticket.name) model: Model<TicketDocument>) {
    super(model);
  }

  async findByUserId(
    userId: string,
    projection?: string[],
    pagination?: { limit?: number; offset?: number },
  ): Promise<TicketDocument[] | null> {
    return this.findAll(
      { userId } as Record<string, unknown>,
      projection,
      pagination,
    );
  }

  async updateStatus(
    ticketId: string,
    status: TicketStatus,
  ): Promise<TicketDocument | null> {
    return this.update(
      { _id: ticketId } as Record<string, unknown>,
      { status } as Record<string, unknown>,
    );
  }

  async assign(
    ticketId: string,
    assignedTo: string | null,
  ): Promise<TicketDocument | null> {
    return this.update(
      { _id: ticketId } as Record<string, unknown>,
      { assignedTo } as Record<string, unknown>,
    );
  }

  async appendResponse(
    ticketId: string,
    response: {
      message: string;
      createdBy: 'operator' | 'user';
      operatorId?: string | null;
    },
  ): Promise<TicketDocument | null> {
    return this.entityModel
      .findOneAndUpdate(
        { _id: ticketId },
        {
          $push: {
            responses: {
              ...response,
              createdAt: new Date(),
            },
          },
        },
        { new: true },
      )
      .exec();
  }

  async deleteById(ticketId: string): Promise<boolean> {
    return this.delete({ _id: ticketId } as Record<string, unknown>);
  }
}
