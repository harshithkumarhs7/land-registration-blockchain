export interface StoredFileInfo {
  fileName: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  fileHash: string; // SHA-256
}

export interface IStorageService {
  saveFile(file: Express.Multer.File): Promise<StoredFileInfo>;
  getFile(storagePath: string): Promise<Buffer>;
  deleteFile(storagePath: string): Promise<void>;
  calculateFileHash(buffer: Buffer): string;
}
