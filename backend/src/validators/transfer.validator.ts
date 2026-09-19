import { z } from 'zod';

export const createTransferSchema = z.object({
  landId: z.string().uuid('Invalid Land ID format'),
  buyerId: z.string().uuid('Invalid Buyer ID format'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});

export const reviewTransferSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export type ReviewTransferInput = z.infer<typeof reviewTransferSchema>;
