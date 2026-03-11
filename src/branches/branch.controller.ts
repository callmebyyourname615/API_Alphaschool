import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
} from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BranchResponseDto } from './dto/branch-response.dto';

@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

 @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create branch with optional profile picture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('profile_pic', {
      storage: diskStorage({
        destination: './uploads/branches',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `branch-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
        const ext = extname(file.originalname).toLowerCase();

        if (!allowedTypes.includes(ext)) {
          return cb(
            new BadRequestException(
              'Only image files are allowed (.jpg, .jpeg, .png, .gif)',
            ),
            false,
          );
        }

        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async create(
    @Body() dto: CreateBranchDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BranchResponseDto> {
    return this.branchService.create(dto, file);
  }

@Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all branches' })
  async findAll(): Promise<BranchResponseDto[]> {
    return this.branchService.findAll();
  }


  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get branch by id' })
  async findOne(@Param('id') id: string): Promise<BranchResponseDto> {
    return this.branchService.findOne(id);
  }


  @Post(':id')
  findOnePost(@Param('id') id: string) {
    return this.branchService.findOne(id);
  }

 @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update branch with optional profile picture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('profile_pic', {
      storage: diskStorage({
        destination: './uploads/branches',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `branch-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
        const ext = extname(file.originalname).toLowerCase();
        if (!allowedTypes.includes(ext)) {
          return cb(
            new BadRequestException(
              'Only image files are allowed (.jpg, .jpeg, .png, .gif)',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BranchResponseDto> {
    return this.branchService.update(id, dto, file);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}
