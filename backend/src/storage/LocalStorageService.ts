import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IStorageService, StoredFileInfo } from './IStorageService.js';
import { config } from '../config/index.js';
import { HashUtil } from '../utils/hash.js';

export class LocalStorageService implements IStorageService {
  private baseDir: string;

  constructor(customDir?: string) {
    this.baseDir = customDir || config.storage.uploadDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<StoredFileInfo> {
    const fileHash = HashUtil.sha256Buffer(file.buffer);
    const ext = path.extname(file.originalname);
    const sanitizedSafeName = `${crypto.randomUUID()}${ext}`;
    const relativePath = path.join('uploads', sanitizedSafeName).replace(/\\/g, '/');
    const absolutePath = path.join(this.baseDir, sanitizedSafeName);

    await fs.promises.writeFile(absolutePath, file.buffer);

    return {
      fileName: sanitizedSafeName,
      originalName: file.originalname,
      storagePath: relativePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileHash,
    };
  }

  async getFile(storagePath: string): Promise<Buffer> {
    // Prevent directory traversal attacks
    const fileName = path.basename(storagePath);
    const absolutePath = path.join(this.baseDir, fileName);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found at: ${storagePath}`);
    }

    return await fs.promises.readFile(absolutePath);
  }

  async deleteFile(storagePath: string): Promise<void> {
    const fileName = path.basename(storagePath);
    const absolutePath = path.join(this.baseDir, fileName);

    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
    }
  }

  calculateFileHash(buffer: Buffer): string {
    return HashUtil.sha256Buffer(buffer);
  }
}

export const storageService = new LocalStorageService();
