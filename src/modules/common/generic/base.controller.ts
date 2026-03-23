import {
  Body,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Type,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Document } from 'mongoose';
import { BaseService } from './base.service';
import { PaginationQueryDto } from '../dto';

export function BaseController<T extends Document, CreateDto, UpdateDto>(
  EntityClass: Type<T>,
  CreateDtoClass: Type<CreateDto>,
  UpdateDtoClass: Type<UpdateDto>,
  entityName: string,
): Type<any> {
  class BaseControllerHost {
    constructor(
      private readonly baseService: BaseService<T, CreateDto, UpdateDto>,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: `Create a new ${entityName}` })
    @ApiResponse({
      status: 201,
      description: `${entityName} has been created successfully.`,
      type: EntityClass,
    })
    @ApiResponse({ status: 400, description: 'Bad Request.' })
    @ApiResponse({ status: 409, description: 'Conflict - Already exists.' })
    @ApiBody({ type: CreateDtoClass })
    async create(@Body() createDto: CreateDto): Promise<T> {
      return this.baseService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: `Get all ${entityName}s` })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiResponse({
      status: 200,
      description: `Return all ${entityName}s.`,
      type: [EntityClass],
    })
    async findAll(
      @Query('projection') projection?: string | string[],
      @Query() paginationQuery?: PaginationQueryDto,
    ): Promise<T[]> {
      return this.baseService.findAll({}, projection, paginationQuery);
    }

    @Get(':id')
    @ApiOperation({ summary: `Get a ${entityName} by id` })
    @ApiParam({ name: 'id', description: `${entityName} ID` })
    @ApiResponse({
      status: 200,
      description: `Return the ${entityName}.`,
      type: EntityClass,
    })
    @ApiResponse({ status: 404, description: `${entityName} not found.` })
    async findOne(
      @Param('id') id: string,
      @Query('projection') projection?: string | string[],
    ): Promise<T | null> {
      return this.baseService.findOne({ _id: id }, projection);
    }

    @Patch(':id')
    @ApiOperation({ summary: `Update a ${entityName}` })
    @ApiParam({ name: 'id', description: `${entityName} ID` })
    @ApiResponse({
      status: 200,
      description: `${entityName} has been updated successfully.`,
      type: EntityClass,
    })
    @ApiResponse({ status: 404, description: `${entityName} not found.` })
    @ApiBody({ type: UpdateDtoClass })
    async update(
      @Param('id') id: string,
      @Body() updateDto: UpdateDto,
    ): Promise<T> {
      return this.baseService.update(id, updateDto);
    }
  }

  return BaseControllerHost;
}
