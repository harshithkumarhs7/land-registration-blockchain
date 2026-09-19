import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/DocumentService.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

export class DocumentController {
  static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('No file provided. Please attach a document', 400);
      }

      const { landId, documentType } = req.body;
      if (!landId || !documentType) {
        throw new AppError('landId and documentType are required', 400);
      }

      const document = await DocumentService.uploadDocument(
        landId,
        req.user!.id,
        documentType,
        req.file,
        req.ip
      );

      res.status(201).json({
        success: true,
        message: 'Document uploaded and hashed with SHA-256 successfully',
        data: { document },
      });
    } catch (error) {
      next(error);
    }
  }

  static async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { buffer, document } = await DocumentService.getDocumentFile(req.params.id);
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${document.originalFileName}"`
      );
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async verifyFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded to verify', 400);
      }

      const result = await DocumentService.verifyDocumentFileHash(
        req.params.id,
        req.file.buffer
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      if (!['VERIFIED', 'REJECTED'].includes(status)) {
        throw new AppError('Status must be VERIFIED or REJECTED', 400);
      }

      const document = await DocumentService.updateVerificationStatus(
        req.params.id,
        status,
        req.user!.id,
        req.ip
      );

      res.status(200).json({
        success: true,
        message: `Document status updated to ${status}`,
        data: { document },
      });
    } catch (error) {
      next(error);
    }
  }
}
