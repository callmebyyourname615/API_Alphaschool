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
import { extname } from 'path';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateEnrollmentDto } from '../enrollments/dto/create-enrollment.dto';
import { SearchStudentByClassDto } from './dto/search-students.dto';
import { StudentsService } from './student.service';
import { ImageToWebpPipe } from './image-to-webp.pipe';

export const profileImageInterceptor = FileInterceptor('profile_image', {
  storage: diskStorage({
    destination: './uploads/students',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      // ✅ Keep original ext temporarily — pipe will rename to .webp
      cb(null, uniqueSuffix + extname(file.originalname));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
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
});

@Controller('students')
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  // ================= GET ALL =================
  // GET /students
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // ================= GET BY ID =================
  // GET /students/:id
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ================= CREATE =================
  // POST /students
  @Post()
  @UseInterceptors(profileImageInterceptor)
  async createStudent(
    @UploadedFile(new ImageToWebpPipe()) file: Express.Multer.File, // ✅ pipe converts here
    @Body() body: CreateStudentDto,
  ) {
    const dto: CreateStudentDto = {
      ...body,
      emergency_contacts:
        typeof body.emergency_contacts === 'string'
          ? JSON.parse(body.emergency_contacts)
          : body.emergency_contacts || [],
      parentIds:
        typeof (body as any).parentIds === 'string'
          ? JSON.parse((body as any).parentIds)
          : body.parentIds || [],
    };

    if (file) {
      dto.profile_image_path = file.path; // ✅ already .webp path from pipe
    }

    return this.service.createStudent(dto);
  }

  // ================= LINK PARENTS =================
  // POST /students/:id/parents
  @Post(':id/parents')
  linkParents(@Param('id') id: string, @Body('parentIds') parentIds: string[]) {
    return this.service.linkParents(id, parentIds);
  }

  // ================= BY CLASS =================
  // POST /students/by-class  ← must be before :id routes
  @Post('by-class')
  findByClass(@Body() dto: SearchStudentByClassDto) {
    return this.service.findByClass(dto);
  }

  // ================= ENROLL =================
  // POST /students/enroll  ← must be before :id routes
  @Post('enroll')
  enrollStudent(@Body() dto: CreateEnrollmentDto) {
    return this.service.enrollStudent(dto);
  }

  // ================= UPDATE =================
  // PUT /students/:id
  @Put(':id')
  @UseInterceptors(profileImageInterceptor)
  async updateStudent(
    @Param('id') id: string,
    @UploadedFile(new ImageToWebpPipe()) file: Express.Multer.File, // ✅
    @Body() body: any,
  ) {
    const dto: Partial<CreateStudentDto> = {
      ...body,
      emergency_contacts: body.emergency_contacts
        ? JSON.parse(body.emergency_contacts)
        : undefined,
      parentIds: body.parentIds ? JSON.parse(body.parentIds) : undefined,
    };

    if (file) {
      dto.profile_image_path = file.path; // ✅ already .webp
    }

    return this.service.updateStudent(id, dto);
  }

  // ================= DELETE =================
  // DELETE /students/:id
  @Delete(':id')
  deleteStudent(@Param('id') id: string) {
    return this.service.deleteStudent(id); // add this method to service
  }
}