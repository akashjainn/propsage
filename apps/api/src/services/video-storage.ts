/**
 * Video Storage Service - handles uploading local clips to cloud storage
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BUCKET_NAME = process.env.VIDEO_BUCKET_NAME || 'propsage-clips';

interface UploadResult {
  s3Url: string;
  key: string;
}

interface VideoMetadata {
  gameId: string;
  team1: string;
  team2: string;
  date: string;
  originalFilename: string;
}

// S3 Client Configuration
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined,
  // For Cloudflare R2, use custom endpoint
  ...(process.env.R2_ENDPOINT && {
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true
  })
};

const s3Client = new S3Client(s3Config);

export class VideoStorageService {
  
  /**
   * Upload a local video file to S3/R2
   */
  async uploadVideo(localPath: string, metadata: VideoMetadata): Promise<UploadResult> {
    
    if (!fs.existsSync(localPath)) {
      throw new Error(`Video file not found: ${localPath}`);
    }
    
    const fileBuffer = fs.readFileSync(localPath);
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const ext = path.extname(localPath);
    
    // Create organized key structure
    const key = `clips/${metadata.date}/${metadata.gameId}/${fileHash}${ext}`;
    
    // Check if we have cloud storage configured
    if (!this.isCloudStorageConfigured()) {
      console.log(`🔄 [MOCK] Cloud storage not configured - simulating upload`);
      console.log(`   File: ${metadata.originalFilename}`);
      console.log(`   Size: ${Math.round(fileBuffer.length / 1024)}KB`);
      console.log(`   Would upload to: ${this.getPublicUrl(key)}`);
      
      return { s3Url: this.getPublicUrl(key), key };
    }
    
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: this.getContentType(ext),
      Metadata: {
        gameId: metadata.gameId,
        team1: metadata.team1,
        team2: metadata.team2,
        date: metadata.date,
        originalFilename: metadata.originalFilename,
        uploadedAt: new Date().toISOString()
      },
      // Make publicly readable for TwelveLabs to access
      ACL: 'public-read'
    });
    
    try {
      await s3Client.send(uploadCommand);
      const s3Url = this.getPublicUrl(key);
      
      console.log(`✅ Uploaded ${metadata.originalFilename} to ${s3Url}`);
      console.log(`   Size: ${Math.round(fileBuffer.length / 1024)}KB`);
      
      return { s3Url, key };
      
    } catch (error) {
      console.error(`❌ Upload failed for ${localPath}:`, error);
      throw error;
    }
  }
  
  /**
   * Batch upload all videos from local clips directory
   */
  async uploadAllLocalClips(clipsDir: string = './apps/web/clips'): Promise<{
    uploaded: Array<{ filename: string; s3Url: string; key: string }>;
    errors: Array<{ filename: string; error: string }>;
  }> {
    
    const results: {
      uploaded: Array<{ filename: string; s3Url: string; key: string }>;
      errors: Array<{ filename: string; error: string }>;
    } = { uploaded: [], errors: [] };
    
    if (!fs.existsSync(clipsDir)) {
      throw new Error(`Clips directory not found: ${clipsDir}`);
    }
    
    const files = fs.readdirSync(clipsDir)
      .filter(f => f.endsWith('.mp4'))
      .sort();
    
    console.log(`📁 Found ${files.length} video files in ${clipsDir}`);
    
    for (const filename of files) {
      try {
        const localPath = path.join(clipsDir, filename);
        const metadata = this.parseFilenameMetadata(filename);
        
        const { s3Url, key } = await this.uploadVideo(localPath, metadata);
        results.uploaded.push({ filename, s3Url, key });
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed to upload ${filename}:`, errorMessage);
        results.errors.push({ filename, error: errorMessage });
      }
    }
    
    console.log(`\n📊 Upload Summary:`);
    console.log(`   ✅ Uploaded: ${results.uploaded.length}`);
    console.log(`   ❌ Errors: ${results.errors.length}`);
    
    return results;
  }
  
  /**
   * Generate signed URL for private access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isCloudStorageConfigured()) {
      console.log(`🔄 [MOCK] Would generate signed URL for ${key} (expires in ${expiresIn}s)`);
      return `https://mock-signed-url.com/${key}?expires=${expiresIn}`;
    }
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });
    
    return await getSignedUrl(s3Client, command, { expiresIn });
  }
  
  /**
   * Check if cloud storage is properly configured
   */
  private isCloudStorageConfigured(): boolean {
    // Check for AWS S3 configuration
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return true;
    }
    
    // Check for Cloudflare R2 configuration
    if (process.env.R2_ENDPOINT && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Parse metadata from filename (based on your current naming pattern)
   */
  private parseFilenameMetadata(filename: string): {
    gameId: string;
    team1: string;
    team2: string;
    date: string;
    originalFilename: string;
  } {
    // Example: "9-27 uga alabama Gunner Stockton passes to Colbie Young touchdown.mp4"
    const parts = filename.replace('.mp4', '').split(' ');
    const date = parts[0]; // "9-27"
    const team1 = parts[1]?.toUpperCase() || 'TEAM1'; // "UGA"
    const team2 = parts[2]?.toUpperCase() || 'TEAM2'; // "ALABAMA"
    
    // Generate a game ID
    const gameId = `${date}-${team1}-vs-${team2}`.toLowerCase();
    
    return {
      gameId,
      team1,
      team2,
      date: `2025-${date.replace('-', '-0')}`, // Convert "9-27" to "2025-09-27"
      originalFilename: filename
    };
  }
  
  private getContentType(ext: string): string {
    const types: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska'
    };
    return types[ext.toLowerCase()] || 'video/mp4';
  }
  
  private getPublicUrl(key: string): string {
    if (process.env.R2_ENDPOINT) {
      // Cloudflare R2 public URL format
      const domain = process.env.R2_PUBLIC_DOMAIN || `${BUCKET_NAME}.r2.dev`;
      return `https://${domain}/${key}`;
    } else {
      // AWS S3 public URL format
      const region = process.env.AWS_REGION || 'us-east-1';
      return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
    }
  }
}

export const videoStorage = new VideoStorageService();