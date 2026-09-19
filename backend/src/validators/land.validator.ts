import { z } from 'zod';

export const createLandSchema = z.object({
  surveyNumber: z.string().min(1, 'Survey number is required'),
  area: z.coerce.number().positive('Area must be a positive number'),
  landType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'AGRICULTURAL', 'INDUSTRIAL']),
  village: z.string().min(1, 'Village name is required'),
  taluk: z.string().min(1, 'Taluk name is required'),
  district: z.string().min(1, 'District name is required'),
  state: z.string().min(1, 'State name is required'),
  latitude: z.coerce.number().min(-90).max(90, 'Valid latitude required (-90 to 90)'),
  longitude: z.coerce.number().min(-180).max(180, 'Valid longitude required (-180 to 180)'),
  description: z.string().optional(),
});

export const searchLandSchema = z.object({
  query: z.string().optional(),
  propertyId: z.string().optional(),
  surveyNumber: z.string().optional(),
  district: z.string().optional(),
  landType: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const reviewApplicationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
});

export type CreateLandInput = z.infer<typeof createLandSchema>;
export type SearchLandInput = z.infer<typeof searchLandSchema>;
export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;
