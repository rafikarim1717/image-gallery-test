import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ImagesModule } from './images/images.module';
import { MinioService } from './minio/minio.service';
import { SeedModule } from './seed/seed.module';
import { SeedService } from './seed/seed.service';
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
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService, MinioService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private minioService: MinioService,
    private seedService: SeedService,
  ) {}

  // Runs after Nest has finished wiring up every module, which means
  // TypeOrmModule's DB connection is already established here — unlike the
  // constructor, which fires before that. Bucket creation and DB seeding
  // both need to happen once, automatically, on every `docker compose up`.
  async onModuleInit() {
    try {
      await this.minioService.initBucket();
    } catch (error) {
      console.error('MinIO initialization failed:', error);
    }

    try {
      await this.seedService.run();
    } catch (error) {
      console.error('Seeding failed:', error);
    }
  }
}
