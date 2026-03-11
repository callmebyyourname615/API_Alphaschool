import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LessonInfosService } from './lesson-infos.service';
import { CreateLessonInfoDto } from './dto/create-lesson-info.dto';
import { UpdateLessonInfoDto } from './dto/update-lesson-info.dto';
import { LessonInfo } from './lesson_info.entity';

@Controller('lesson-infos')
export class LessonInfosController {
  constructor(private readonly lessonInfosService: LessonInfosService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'infoImage', maxCount: 1 },
        { name: 'attachment', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/lesson-info',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
          },
        }),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
      },
    ),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files: { infoImage?: Express.Multer.File[]; attachment?: Express.Multer.File[] },
  ): Promise<LessonInfo> {
    console.log('Body:', body);
    console.log('Files:', files);

    if (!body.lessonId || !body.lessonInfoNo || !body.title) {
      throw new BadRequestException('lessonId, lessonInfoNo and title are required');
    }

    const dto: CreateLessonInfoDto = {
      lessonId: body.lessonId,
      lessonInfoNo: Number(body.lessonInfoNo),
      title: body.title,
      info: body.info || undefined,
      isEvaluation: body.isEvaluation === 'true',
      evaluationMaxScore: body.evaluationMaxScore ? Number(body.evaluationMaxScore) : undefined,
      evaluationSample: body.evaluationSample || undefined,
      infoImage: files.infoImage?.[0]?.filename,
      attachment: files.attachment?.[0]?.filename,
      evaluationItems: body.evaluationItems ? JSON.parse(body.evaluationItems) : undefined,
    };

    return this.lessonInfosService.create(dto);
  }

  @Get()
  findAll(@Query('lessonId') lessonId?: string) {
    return lessonId
      ? this.lessonInfosService.findByLesson(lessonId)
      : this.lessonInfosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonInfosService.findOne(id);
  }

@Patch(':id')
@UseInterceptors(
  FileFieldsInterceptor([
    { name: 'infoImage', maxCount: 1 },
    { name: 'attachment', maxCount: 1 },
  ], {
    storage: diskStorage({
      destination: './uploads/lesson-info',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
  }),
)
async update(
  @Param('id') id: string,
  @Body() body: any,
  @UploadedFiles() files: { infoImage?: Express.Multer.File[]; attachment?: Express.Multer.File[] },
) {
  console.log('PATCH body received:', body);
  console.log('PATCH files received:', files);

  const dto: UpdateLessonInfoDto = {
    lessonId: body.lessonId,
    lessonInfoNo: body.lessonInfoNo ? Number(body.lessonInfoNo) : undefined,
    title: body.title,
    info: body.info,
    isEvaluation: body.isEvaluation === 'true',
    evaluationMaxScore: body.evaluationMaxScore ? Number(body.evaluationMaxScore) : undefined,
    evaluationSample: body.evaluationSample,
    evaluationItems: body.evaluationItems ? JSON.parse(body.evaluationItems) : undefined,
    infoImage: files.infoImage?.[0]?.filename,
    attachment: files.attachment?.[0]?.filename,
  };

  const updated = await this.lessonInfosService.update(id, dto);

  console.log('After save - updated entity:', updated);

  return updated;
}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.lessonInfosService.remove(id);
  }
}