import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Image } from './entities/images/image.entity';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image) private imageRepository: Repository<Image>,
    private minioService: MinioService,
  ) {}

  async upload(
    file: Express.Multer.File,
    title: string,
    category: string,
    userId: string,
  ) {
    // Validation
    if (!file) throw new BadRequestException('No file uploaded');
    // Spec: file size must be under 1MB, backend rejects with 422 and states the actual size.
    if (file.size > 1024 * 1024) {
      throw new UnprocessableEntityException(
        `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds the 1MB limit`,
      );
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new UnprocessableEntityException(
        'Invalid file type: only jpeg, png, or webp are allowed',
      );
    }
    if (!title || title.length < 3 || title.length > 80) {
      throw new BadRequestException('Title must be 3-80 characters');
    }
    if (!['nature', 'architecture', 'people', 'technology'].includes(category)) {
      throw new BadRequestException('Invalid category');
    }

    // Upload to MinIO
    const key = `${Date.now()}-${file.originalname}`;
    const s3Client = this.minioService.getS3Client();
    const bucketName = this.minioService.getBucketName();

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (error) {
      throw new BadRequestException('Failed to upload to storage');
    }

    // Save to database
    const image = this.imageRepository.create({
      title,
      category,
      url: key,
      userId,
    });

    const saved = await this.imageRepository.save(image);
    return this.withPublicUrl(saved);
  }

  // Seed entries (B6) store a direct remote URL in `url`; uploaded images
  // store just the MinIO object key. Normalize both into a single field the
  // frontend can drop straight into <img src>.
  private withPublicUrl(image: Image) {
    const imageUrl = /^https?:\/\//i.test(image.url)
      ? image.url
      : this.minioService.getPublicUrl(image.url);
    return { ...image, imageUrl };
  }

  async getAll(skip = 0, take = 16, category?: string, sort?: string) {
    const where = category ? { category } : {};

    let order: Record<string, 'ASC' | 'DESC'> = { createdAt: 'DESC' };
    if (sort === 'title') order = { title: 'ASC' };
    if (sort === 'clicks') order = { clickCount: 'DESC' };

    const [images, total] = await this.imageRepository.findAndCount({
      where,
      order,
      skip,
      take,
    });
    return { images: images.map((img) => this.withPublicUrl(img)), total };
  }

  // Raw entity, for internal use (update/delete/click) where we need a real
  // Image instance rather than the spread object getById returns.
  private async findEntity(id: string) {
    const image = await this.imageRepository.findOne({ where: { id } });
    if (!image) throw new NotFoundException('Image not found');
    return image;
  }

  async getById(id: string) {
    return this.withPublicUrl(await this.findEntity(id));
  }

  async update(id: string, userId: string, title?: string, category?: string) {
    const image = await this.findEntity(id);

    // Check ownership. Seed images (B6) have userId === null, which never
    // matches a real user id, so they're forbidden here implicitly too.
    if (image.userId !== userId) throw new ForbiddenException('Not authorized');

    if (title) {
      if (title.length < 3 || title.length > 80) {
        throw new BadRequestException('Title must be 3-80 characters');
      }
      image.title = title;
    }

    if (category) {
      if (!['nature', 'architecture', 'people', 'technology'].includes(category)) {
        throw new BadRequestException('Invalid category');
      }
      image.category = category;
    }

    const saved = await this.imageRepository.save(image);
    return this.withPublicUrl(saved);
  }

  async delete(id: string, userId: string) {
    const image = await this.findEntity(id);

    // Check ownership. Seed images (B6) have userId === null, which never
    // matches a real user id, so they're forbidden here implicitly too.
    if (image.userId !== userId) throw new ForbiddenException('Not authorized');

    // Delete from MinIO
    const s3Client = this.minioService.getS3Client();
    const bucketName = this.minioService.getBucketName();

    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: image.url,
        }),
      );
    } catch (error) {
      console.error('Failed to delete from storage:', error);
    }

    // Delete from database
    await this.imageRepository.delete(id);
    return { message: 'Image deleted' };
  }

  async incrementClickCount(id: string) {
    const image = await this.findEntity(id);
    image.clickCount += 1;
    const saved = await this.imageRepository.save(image);
    return this.withPublicUrl(saved);
  }
}