import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ParentService } from './parent.service';
import { CreateParentDto } from './dto/CreateParentDto';
import { UpdateParentDto } from './dto/UpdateParentDto';
import { v4 as uuid } from 'uuid';

@Controller('parents')
export class ParentController {
  constructor(private readonly service: ParentService) {}

  // POST - create parent with profile_pic + id_card
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile_pic', maxCount: 1 },
        { name: 'id_card', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/parents',
          filename: (req, file, cb) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + ext);
          },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (req, file, cb) => {
          const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          const ext = extname(file.originalname).toLowerCase();
          if (!allowed.includes(ext)) {
            return cb(new BadRequestException(`File type '${ext}' not allowed. Allowed: ${allowed.join(', ')}`), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  create(
    @Body() dto: CreateParentDto,
    @UploadedFiles()
    files: {
      profile_pic?: Express.Multer.File[];
      id_card?: Express.Multer.File[];
    },
  ) {
    if (files?.profile_pic?.[0]) dto.profile_pic = files.profile_pic[0].path;
    if (files?.id_card?.[0]) dto.id_card = files.id_card[0].path;
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile_pic', maxCount: 1 },
        { name: 'id_card', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/parents',
          filename: (req, file, cb) => {
            const fileName = `${uuid()}${extname(file.originalname)}`;
            cb(null, fileName);
          },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
        fileFilter: (req, file, cb) => {
          const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
          const ext = extname(file.originalname).toLowerCase();
          if (!allowed.includes(ext)) {
            return cb(new BadRequestException(`File type '${ext}' not allowed. Allowed: ${allowed.join(', ')}`), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateParentDto,
    @UploadedFiles()
    files: {
      profile_pic?: Express.Multer.File[];
      id_card?: Express.Multer.File[];
    },
  ) {
    if (files.profile_pic && files.profile_pic.length > 0) {
      dto.profile_pic = files.profile_pic[0].path;
    }
    if (files.id_card && files.id_card.length > 0) {
      dto.id_card = files.id_card[0].path;
    }

    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.softDelete(id);
  }
}
