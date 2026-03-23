import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesEnum } from '../auth/enums/roles.enum';
import { BaseController } from '../common/generic/base.controller';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User, UserDocument } from './users.model';
import { UserService } from './users.service';

@ApiTags('admin-users')
@Roles(RolesEnum.ADMIN)
@Controller('admin/users')
export class AdminUsersController extends BaseController<
  UserDocument,
  CreateUserDto,
  UpdateUserDto
>(User, CreateUserDto, UpdateUserDto, 'User') {
  constructor(private readonly userService: UserService) {
    super(userService);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a User by id (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiQuery({ name: 'projection', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Return the User.',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(
    @Param('id') id: string,
    @Query('projection') projection?: string | string[],
  ): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const user = await this.userService.findOne({ _id: id }, projection);

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return user;
  }
}
