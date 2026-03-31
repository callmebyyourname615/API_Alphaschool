import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Multer } from 'multer';
import { extname } from 'path';
import { StudentService } from './student.service';
import { SearchStudentByClassDto } from './dto/search-students.dto';

@Controller('students')
export class StudentController {
  constructor(private readonly service: StudentService) {}

  // ================= CREATE =================
  @Post()
  @UseInterceptors(
    FileInterceptor('profile_image', {
      storage: diskStorage({
        destination: './uploads/students',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
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
    }),
  )
  async createStudent(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const data: any = {
      ...body,
      emergency_contacts:
        typeof body.emergency_contacts === 'string'
          ? JSON.parse(body.emergency_contacts)
          : body.emergency_contacts || [],
      parents:
        typeof body.parents === 'string'
          ? JSON.parse(body.parents)
          : body.parents || [],
    };

    if (file) {
      data.profile_image_path = file.path.replace(/\\/g, '/');
    }

    return this.service.createStudent(data);
  }

  // ================= UPDATE =================
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('profile_image', {
      storage: diskStorage({
        destination: './uploads/students',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
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
    }),
  )
  async updateStudent(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const data: any = {
      ...body,
      emergency_contacts: body.emergency_contacts
        ? JSON.parse(body.emergency_contacts)
        : undefined,
      parents: body.parent_id ? JSON.parse(body.parent_id) : undefined,
    };

    if (file) {
      data.profile_image_path = file.path.replace(/\\/g, '/');
    }

    return this.service.updateStudent(id, data);
  }

  // ================= GET ALL =================
  @Get()
  getAllStudents() {
    return this.service.getAllStudents();
  }

  // ================= GET BY ID =================
  @Get(':id')
  getStudentById(@Param('id') id: string) {
    return this.service.getStudentById(id);
  }

  // ================= DELETE =================
  @Delete(':id')
  deleteStudent(@Param('id') id: string) {
    return this.service.deleteStudent(id);
  }
  @Post('by-class')
  async getStudentsByClass(@Body() dto: SearchStudentByClassDto) {
    return this.service.getStudentsByClass(dto);
  }
}
