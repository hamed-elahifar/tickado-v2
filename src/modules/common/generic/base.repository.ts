import { Document, FilterQuery, Model, Query, UpdateQuery } from 'mongoose';
import { MongoError } from 'mongodb';
import { ConflictException } from '@nestjs/common';

interface MongoErrorWithKeyPattern extends MongoError {
  keyPattern: Record<string, number>;
  keyValue: Record<string, any>;
}

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly entityModel: Model<T>) {}

  async create(createEntityData: Record<string, any>): Promise<T> {
    try {
      const entity = new this.entityModel(createEntityData) as T;
      return entity.save();
    } catch (error) {
      if (error instanceof MongoError && error.code === 11000) {
        const mongoError = error as MongoErrorWithKeyPattern;
        const field = Object.keys(mongoError.keyPattern)[0];
        const value: string = Object.values(mongoError.keyValue)[0] as string;
        throw new ConflictException(`${field} '${value}' already exists`);
      } else {
        throw error;
      }
    }
  }

  async findOne(
    entityFilterQuery: FilterQuery<T>,
    projection?: string[],
  ): Promise<T | null> {
    let query: Query<T | null, T>;

    query = this.entityModel.findOne(entityFilterQuery);

    if (projection) {
      query = query.select(projection) as Query<T | null, T>;
    }

    return query.exec();
  }

  async findAll(
    entityFilterQuery: FilterQuery<T> = {},
    projection?: string[],
    pagination?: { limit?: number; offset?: number },
  ): Promise<T[] | null> {
    let query: Query<T[] | null, T>;

    query = this.entityModel.find(entityFilterQuery);

    if (projection) {
      query = query.select(projection) as Query<T[] | null, T>;
    }

    if (pagination?.limit) {
      query = query.limit(pagination.limit);
    }

    if (pagination?.offset) {
      query = query.skip(pagination.offset);
    }

    return query.exec();
  }

  async update(
    entityFilterQuery: FilterQuery<T>,
    updateEntityData: UpdateQuery<T>,
  ): Promise<T | null> {
    return this.entityModel.findOneAndUpdate(
      entityFilterQuery,
      updateEntityData,
      {
        new: true,
      },
    );
  }

  async delete(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    const result = await this.entityModel.deleteMany(entityFilterQuery);
    return result.deletedCount >= 1;
  }

  async count(entityFilterQuery: FilterQuery<T> = {}): Promise<number> {
    return this.entityModel.countDocuments(entityFilterQuery);
  }

  async upsert(
    entityFilterQuery: FilterQuery<T>,
    updateEntityData: UpdateQuery<T>,
  ): Promise<T | null> {
    return this.entityModel
      .findOneAndUpdate(entityFilterQuery, updateEntityData, {
        new: true,
        upsert: true,
      })
      .exec();
  }
}
