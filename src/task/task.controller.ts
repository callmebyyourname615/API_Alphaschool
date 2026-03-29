import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { TaskService } from './task.service';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/CreateTaskDto';
import { UpdateTaskDto } from './dto/UpdateTaskDto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // ใช้ FilesInterceptor สำหรับ multipart form-data
@Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/tasks',
        filename: (req, file, cb) => {
          const filename = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
      fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.mp4', '.webm'];
        const ext = extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext)) {
          return cb(new BadRequestException(`File type '${ext}' not allowed.`), false);
        }
        cb(null, true);
      },
    }),
  )
  create(
    @Body() data: CreateTaskDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.taskService.create(data, files);
  }

  @Get()
  findAll(): Promise<Task[]> {
    return this.taskService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Task> {
    return this.taskService.findOne(id);
  }

  @Post(':id')
  findOnebyId(@Param('id') id: string): Promise<Task> {
    return this.taskService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.taskService.delete(id);
  }

  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/tasks',
        filename: (req, file, cb) => {
          const filename = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
      fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.mp4', '.webm'];
        const ext = extname(file.originalname).toLowerCase();
        if (!allowed.includes(ext)) {
          return cb(new BadRequestException(`File type '${ext}' not allowed.`), false);
        }
        cb(null, true);
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() data: UpdateTaskDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<Task> {
    return this.taskService.update(id, data, files);
  }
}
