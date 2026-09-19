import { PrismaClient, LandDocument } from '@prisma/client';
import { storageService } from '../storage/LocalStorageService.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { AuditService } from './AuditService.js';
import { landRegistryService } from '../blockchain/LandRegistryService.js';
import { HashUtil } from '../utils/hash.js';

const prisma = new PrismaClient();

export class DocumentService {
  /**
   * Uploads and cryptographically hashes a document for a land parcel
   */
  static async uploadDocument(
    landId: string,
    uploadedById: string,
    documentType: string,
    file: Express.Multer.File,
    ip?: string
  ): Promise<LandDocument> {
    const land = await prisma.land.findUnique({
      where: { id: landId },
    });

    if (!land) {
      throw new AppError('Land record not found', 404);
    }

    const storedFile = await storageService.saveFile(file);

    const document = await prisma.landDocument.create({
      data: {
        landId,
        uploadedById,
        documentType,
        originalFileName: storedFile.originalName,
        storagePath: storedFile.storagePath,
        fileHash: storedFile.fileHash,
        mimeType: storedFile.mimeType,
        fileSize: storedFile.fileSize,
        verificationStatus: 'PENDING',
      },
    });

    await AuditService.log({
      userId: uploadedById,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: document.id,
      ipAddress: ip,
      metadata: {
        landId,
        documentType,
        fileName: storedFile.originalName,
        fileHash: storedFile.fileHash,
      },
    });

    return document;
  }

  /**
   * Retrieves document file stream/buffer from storage
   */
  static async getDocumentFile(documentId: string): Promise<{ buffer: Buffer; document: LandDocument }> {
    const document = await prisma.landDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new AppError('Document record not found', 404);
    }

    const buffer = await storageService.getFile(document.storagePath);
    return { buffer, document };
  }

  /**
   * Compares an uploaded test file with the stored document and on-chain record
   */
  static async verifyDocumentFileHash(
    documentId: string,
    fileBuffer: Buffer
  ): Promise<{
    isMatch: boolean;
    computedHash: string;
    storedHash: string;
    onChainVerified?: boolean;
  }> {
    const document = await prisma.landDocument.findUnique({
      where: { id: documentId },
      include: { land: true },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    const computedHash = HashUtil.sha256Buffer(fileBuffer);
    const isMatch = HashUtil.verifyHash(computedHash, document.fileHash);

    let onChainVerified = false;
    if (document.land.status === 'REGISTERED' && document.land.propertyId) {
      try {
        const onChainRes = await landRegistryService.verifyDocumentOnChain(
          document.land.propertyId,
          computedHash
        );
        onChainVerified = onChainRes.isMatch;
      } catch (err) {
        // If blockchain unavailable, fallback to DB record comparison
      }
    }

    return {
      isMatch,
      computedHash,
      storedHash: document.fileHash,
      onChainVerified,
    };
  }

  /**
   * Sub-registrar updates document verification status
   */
  static async updateVerificationStatus(
    documentId: string,
    status: 'VERIFIED' | 'REJECTED',
    registrarId: string,
    ip?: string
  ): Promise<LandDocument> {
    const document = await prisma.landDocument.update({
      where: { id: documentId },
      data: { verificationStatus: status },
      include: { land: true },
    });

    await AuditService.log({
      userId: registrarId,
      action: 'DOCUMENT_VERIFIED',
      entityType: 'DOCUMENT',
      entityId: document.id,
      ipAddress: ip,
      metadata: {
        status,
        fileHash: document.fileHash,
        propertyId: document.land.propertyId,
      },
    });

    return document;
  }
}
