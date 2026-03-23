import { Controller, Get, Post, Body, Param, UploadedFile, UseInterceptors, Res, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { join } from 'path';
import type { Response } from 'express';
import { FileService } from './file.service';
import { File } from './files.entity';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  create(@Body() body: Partial<File>): Promise<File> {
    return this.fileService.create(body);
  }

  @Get()
  findAll(): Promise<File[]> {
    return this.fileService.findAll();
  }

  @Get('serve/:module/:filename')
  serveFile(
    @Param('module') module: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      // Construct the full file path
      const fullPath = join(process.cwd(), 'uploads', module, filename);

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        throw new NotFoundException('File not found');
      }

      // Determine content type based on file extension
      const ext = filename.split('.').pop()?.toLowerCase();
      const contentTypeMap: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'mp4': 'video/mp4',
        'webp': 'image/webp',
      };
      const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';

      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Stream the file
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('File not found');
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<File> {
    return this.fileService.findOne(id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Initially save to temp folder, will be moved in the controller
          const tempDir = join(process.cwd(), 'uploads', 'temp');
          fs.mkdirSync(tempDir, { recursive: true });
          cb(null, tempDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
          cb(null, `${timestamp}_${safeName}`);
        },
      }),
    }),
  )
  async upload(
    @UploadedFile() fileData: Express.Multer.File,
    @Body() body: { module: 'event' | 'event_activity' | 'task' | 'comment'; ownerId: string },
  ): Promise<File> {
    const { module, ownerId } = body;
    
    // Move file from temp to correct module folder
    const targetDir = join(process.cwd(), 'uploads', module ?? 'task');
    fs.mkdirSync(targetDir, { recursive: true });
    
    const sourcePath = fileData.path;
    const targetPath = join(targetDir, fileData.filename);
    
    // Move the file
    fs.renameSync(sourcePath, targetPath);
    
    const relativePath = join(module, fileData.filename).replace(/\\/g, '/');
    const payload: Partial<File> = {
      module,
      file_path: relativePath,
      is_active: true,
      is_deleted: false,
    };
    if (module === 'event') payload.event_id = ownerId;
    else if (module === 'event_activity') payload.event_activity_id = ownerId;
    else if (module === 'comment') payload.comment_id = ownerId;
    else payload.task_id = ownerId;
    return this.fileService.create(payload);
  }

  @Get('by/:module/:ownerId')
  findByModule(
    @Param('module') module: 'event' | 'event_activity' | 'task' | 'comment',
    @Param('ownerId') ownerId: string,
  ): Promise<File[]> {
    return this.fileService.findByModuleAndOwner(module, ownerId);
  }
}
