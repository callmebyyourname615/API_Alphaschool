import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { AdminResponseDto, AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';// ← create this DTO

@ApiTags('Admins')
@ApiBearerAuth() // if you use JWT later
@Controller('admins')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Post()
@HttpCode(HttpStatus.CREATED)
@ApiOperation({ summary: 'Create a new admin (with optional profile picture)' })
@ApiConsumes('multipart/form-data')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/admin',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
      const ext = extname(file.originalname).toLowerCase();
      if (!allowedTypes.includes(ext)) {
        return cb(new BadRequestException('Only image files are allowed (.jpg, .jpeg, .png, .gif)'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  }),
)
async create(
  @Body() dto: CreateAdminDto,
  @UploadedFile() file?: Express.Multer.File,
): Promise<AdminResponseDto> {
  return this.adminsService.create(dto, file);
}

  @Get()
  @ApiOperation({ summary: 'Get all active admins' })
  @ApiResponse({ status: 200, type: [AdminResponseDto] })
  async findAll(): Promise<AdminResponseDto[]> {
    return this.adminsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single admin by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdminResponseDto })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminResponseDto> {
    return this.adminsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an admin (partial update)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdminResponseDto })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDto,
  ): Promise<AdminResponseDto> {
    return this.adminsService.update(id, dto, undefined); // file not supported here
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete an admin' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Admin soft deleted' })
  @ApiResponse({ status: 404, description: 'Admin not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.adminsService.softRemove(id);
  }
}