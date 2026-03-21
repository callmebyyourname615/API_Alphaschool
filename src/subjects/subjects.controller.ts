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
import { AnyFilesInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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
        destination: './uploads/subjects', // ✅ make sure this folder exists
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async create(@Body() body: any, @UploadedFiles() files: Express.Multer.File[]) {
    // Map uploaded files to DTO fields
    const dto = {
      subject_type_id: body.subject_type_id,
      class_id: body.class_id,
      curriculum_id: body.curriculum_id,
      topic: body.topic,
      description: body.description,
      file_s: files.find(f => f.fieldname === 'student_file')?.filename ?? null,
      file_t: files.find(f => f.fieldname === 'teacher_file')?.filename ?? null,
      file_e: files.find(f => f.fieldname === 'evaluation_file')?.filename ?? null,
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.subjectService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectService.remove(id);
  }
}
