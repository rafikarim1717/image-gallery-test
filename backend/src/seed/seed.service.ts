import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Image } from '../images/entities/images/image.entity';

interface SeedEntry {
  id: number;
  title: string;
  category: string;
  url: string;
  createdAt: string;
}

// B6: seed-images.json is loaded on startup and is read only.
// Idempotent via `seedId` so re-running docker compose up doesn't duplicate rows.
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Image) private imageRepository: Repository<Image>,
  ) {}

  async run() {
    // process.cwd() is /app (the Dockerfile WORKDIR), and backend/src is bind
    // mounted there in dev, so this resolves the same whether run via
    // `nest start --watch` or a built `dist/main.js`.
    const seedPath = path.join(process.cwd(), 'src', 'seed', 'seed-images.json');

    if (!fs.existsSync(seedPath)) {
      this.logger.warn(`Seed file not found at ${seedPath}, skipping seed`);
      return;
    }

    const entries: SeedEntry[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    let inserted = 0;

    for (const entry of entries) {
      const existing = await this.imageRepository.findOne({
        where: { seedId: entry.id },
      });
      if (existing) continue;

      const image = this.imageRepository.create({
        title: entry.title,
        category: entry.category,
        url: entry.url,
        createdAt: new Date(entry.createdAt),
        userId: null,
        seedId: entry.id,
      });
      await this.imageRepository.save(image);
      inserted++;
    }

    this.logger.log(
      `Seed check complete: ${inserted} new, ${entries.length - inserted} already present`,
    );
  }
}
