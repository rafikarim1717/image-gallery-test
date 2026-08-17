import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { Image } from './entities/images/image.entity';
import { MinioService } from '../minio/minio.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Image]), AuthModule],
  controllers: [ImagesController],
  providers: [ImagesService, MinioService],
})
export class ImagesModule {}