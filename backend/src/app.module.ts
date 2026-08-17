import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ImagesModule } from './images/images.module';
import { MinioService } from './minio/minio.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'image_gallery',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: true,
    }),
    AuthModule,
    ImagesModule,
  ],
  controllers: [AppController],
  providers: [AppService, MinioService],
})
export class AppModule {
  constructor(private minioService: MinioService) {
    this.initializeMinio();
  }

  private async initializeMinio() {
    try {
      await this.minioService.initBucket();
    } catch (error) {
      console.error('MinIO initialization failed:', error);
    }
  }
}
