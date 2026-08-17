import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('images')
@UseGuards(JwtAuthGuard) // A6: every image endpoint requires a valid token (401 otherwise)
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title: string; category: string },
    @Req() req: any,
  ) {
    return this.imagesService.upload(file, body.title, body.category, req.user.sub);
  }

  @Get()
  async getAll(
    @Query('skip') skip = 0,
    @Query('take') take = 16,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
  ) {
    return this.imagesService.getAll(+skip, +take, category, sort);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.imagesService.getById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; category?: string },
    @Req() req: any,
  ) {
    return this.imagesService.update(id, req.user.sub, body.title, body.category);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    return this.imagesService.delete(id, req.user.sub);
  }

  @Post(':id/click')
  async incrementClick(@Param('id') id: string) {
    return this.imagesService.incrementClickCount(id);
  }
}