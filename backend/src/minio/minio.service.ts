import { Injectable } from '@nestjs/common';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class MinioService {
  private s3Client: S3Client;
  private bucketName = process.env.MINIO_BUCKET_NAME || 'images';
  // Endpoint reachable from the *browser* (host machine), as opposed to
  // MINIO_ENDPOINT which is the docker-network address used server-side.
  private publicEndpoint =
    process.env.MINIO_PUBLIC_ENDPOINT || 'http://localhost:9000';

  constructor() {
    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT || 'http://minio:9000',
      credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER || 'minioadmin',
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async initBucket() {
    try {
      // Check if bucket exists
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      console.log(`Bucket "${this.bucketName}" already exists`);
    } catch (error) {
      // Bucket doesn't exist, create it
      try {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        console.log(`Bucket "${this.bucketName}" created successfully`);
      } catch (createError) {
        console.error('Failed to create bucket:', createError);
        return;
      }
    }

    // Make objects publicly readable so the frontend can render <img src>
    // directly against MinIO without proxying bytes through the backend.
    try {
      await this.s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucketName,
          Policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucketName}/*`],
              },
            ],
          }),
        }),
      );
      console.log(`Bucket "${this.bucketName}" set to public-read`);
    } catch (policyError) {
      console.error('Failed to set bucket policy:', policyError);
    }
  }

  getS3Client() {
    return this.s3Client;
  }

  getBucketName() {
    return this.bucketName;
  }

  getPublicUrl(key: string) {
    return `${this.publicEndpoint}/${this.bucketName}/${key}`;
  }
}