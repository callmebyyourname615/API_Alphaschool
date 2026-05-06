import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

import { AdminResponseDto, AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

// ── shared file upload config ─────────────────────────────────────
const adminFileInterceptorOptions = {
  storage: diskStorage({
    destination: './uploads/admin',
    filename: (_req, file, cb) => {
      cb(null, `${uuid()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(
        new BadRequestException(
          `File type '${ext}' not allowed. Allowed: ${allowed.join(', ')}`,
        ),
        false,
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
};

const adminFileFields = [
  { name: 'profile_pic', maxCount: 1 },
  { name: 'home_picture', maxCount: 1 },
];

type AdminUploadedFiles = {
  profile_pic?: Express.Multer.File[];
  home_picture?: Express.Multer.File[];
};

@ApiTags('Admins')
@ApiBearerAuth()
@Controller('admins')
@UsePipes(
  new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  // ───────────── CREATE ─────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new admin' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor(adminFileFields, adminFileInterceptorOptions))
  async create(
    @Body() dto: CreateAdminDto,
    @UploadedFiles() files: AdminUploadedFiles,
  ): Promise<AdminResponseDto> {
    if (files?.profile_pic?.[0]) {
      dto.profile_pic = `uploads/admin/${files.profile_pic[0].filename}`; // ✅
    }
    if (files?.home_picture?.[0]) {
      dto.home_picture_url = `uploads/admin/${files.home_picture[0].filename}`; // ✅
    }
    return this.adminsService.create(dto);
  }

  // ───────────── FIND ALL ─────────────
  @Get()
  @ApiOperation({ summary: 'Get all active admins' })
  @ApiResponse({ status: 200, type: [AdminResponseDto] })
  async findAll(): Promise<AdminResponseDto[]> {
    return this.adminsService.findAll();
  }

  // ───────────── FIND ONE ─────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get single admin by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminResponseDto> {
    return this.adminsService.findOne(id);
  }

  // ───────────── UPDATE ─────────────
  @Put(':id')
  @ApiOperation({ summary: 'Update an admin' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UseInterceptors(FileFieldsInterceptor(adminFileFields, adminFileInterceptorOptions))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDto,
    @UploadedFiles() files: AdminUploadedFiles,
  ): Promise<AdminResponseDto> {
    if (files?.profile_pic?.[0]) {
      dto.profile_pic = `uploads/admin/${files.profile_pic[0].filename}`; // ✅
    }
    if (files?.home_picture?.[0]) {
      dto.home_picture_url = `uploads/admin/${files.home_picture[0].filename}`; // ✅
    }
    return this.adminsService.update(id, dto);
  }

  // ───────────── SOFT DELETE ─────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete an admin' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.adminsService.softRemove(id);
  }
}