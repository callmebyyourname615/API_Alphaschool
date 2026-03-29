import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectService } from './subjects.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @UseInterceptors(
    AnyFilesInterceptor({
      storage: diskStorage({
        destination: './uploads/subjects',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto = {
      subject_type_id: body.subject_type_id,
      class_id: body.class_id,
      curriculum_id: body.curriculum_id,
      topic: body.topic ?? null,
      description: body.description ?? null,

      // Text fields (from frontend text inputs)
      s_year: body.s_year ?? null,
      t_year: body.t_year ?? null,

      // Files - Match the field names sent from Vue frontend
      file_s: files.find((f) => f.fieldname === 'file_s')?.filename ?? null,
      file_t: files.find((f) => f.fieldname === 'file_t')?.filename ?? null,
      file_e: files.find((f) => f.fieldname === 'file_e')?.filename ?? null,
    };

    return this.subjectService.create(dto);
  }

  @Get()
  findAll() {
    return this.subjectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectService.findOne(id);
  }

  // subjects.controller.ts
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file_s', maxCount: 1 }, // ← Changed
      { name: 'file_t', maxCount: 1 }, // ← Changed
      { name: 'file_e', maxCount: 1 }, // ← Changed
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() body: any, // Use any or proper DTO
    @UploadedFiles()
    files: {
      file_s?: Express.Multer.File[];
      file_t?: Express.Multer.File[];
      file_e?: Express.Multer.File[];
    },
  ) {
    const dto: UpdateSubjectDto = {
      subject_type_id: body.subject_type_id,
      class_id: body.class_id,
      curriculum_id: body.curriculum_id,
      s_year: body.s_year, // ← Important
      t_year: body.t_year, // ← Important
      file_s: files.file_s?.[0]?.filename,
      file_t: files.file_t?.[0]?.filename,
      file_e: files.file_e?.[0]?.filename,
    };

    return await this.subjectService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectService.remove(id);
  }
}
