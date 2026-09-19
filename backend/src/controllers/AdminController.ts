import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuditService } from '../services/AuditService.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

const prisma = new PrismaClient();

export class AdminController {
  static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalUsers,
        totalLands,
        pendingRegistrations,
        registeredLands,
        pendingTransfers,
        completedTransfers,
        totalBlockchainTxs,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.land.count(),
        prisma.land.count({ where: { status: 'PENDING_VERIFICATION' } }),
        prisma.land.count({ where: { status: 'REGISTERED' } }),
        prisma.transferRequest.count({ where: { status: 'PENDING' } }),
        prisma.transferRequest.count({ where: { status: 'COMPLETED' } }),
        prisma.blockchainTransaction.count(),
      ]);

      // Category breakdown
      const landTypeDistribution = await prisma.land.groupBy({
        by: ['landType'],
        _count: { id: true },
      });

      // Recent 5 blockchain transactions
      const recentTransactions = await prisma.blockchainTransaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalUsers,
            totalLands,
            pendingRegistrations,
            registeredLands,
            pendingTransfers,
            completedTransfers,
            totalBlockchainTxs,
          },
          landTypeDistribution: landTypeDistribution.map((item) => ({
            type: item.landType,
            count: item._count.id,
          })),
          recentTransactions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const role = req.query.role as string;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (role) where.role = role;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            walletAddress: true,
            phone: true,
            status: true,
            createdAt: true,
            _count: {
              select: { landsOwned: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
        throw new AppError('Status must be ACTIVE or SUSPENDED', 400);
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { status },
        select: { id: true, name: true, email: true, status: true },
      });

      await AuditService.log({
        userId: req.user!.id,
        action: 'USER_STATUS_UPDATED',
        entityType: 'USER',
        entityId: user.id,
        ipAddress: req.ip,
        metadata: { status },
      });

      res.status(200).json({
        success: true,
        message: `User status updated to ${status}`,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuditService.getLogs({
        userId: req.query.userId as string,
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
