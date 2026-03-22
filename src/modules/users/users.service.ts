import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto } from './dto';
import { UserDocument } from './users.model';
import { UserRepository } from './users.repository';
import { BaseService } from '../common/generic/base.service';
import { UsersRedisRepository } from './users.redis-repository';

@Injectable()
export class UserService extends BaseService<
  UserDocument,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(
    repository: UserRepository,
    private readonly redisRepository: UsersRedisRepository,
  ) {
    super(repository, 'User');
  }

  async create(createDto: CreateUserDto): Promise<UserDocument> {
    if (createDto.email) {
      const existingEmailUser = await this.findOne({ email: createDto.email });
      if (existingEmailUser) {
        throw new ConflictException('Email already in use');
      }
    }

    if (createDto.phone) {
      const existingPhoneUser = await this.findOne({ phone: createDto.phone });
      if (existingPhoneUser) {
        throw new ConflictException('Phone already in use');
      }
    }

    return super.create(createDto);
  }

  async me(userID: string): Promise<UserDocument> {
    return this.findOneSafe({ _id: userID }, ['-__v']);
  }
}
