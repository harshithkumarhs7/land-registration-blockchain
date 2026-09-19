import { z } from 'zod';

const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['LAND_OWNER', 'BUYER']).default('BUYER'), // Public can only register as Owner or Buyer
  walletAddress: z.string().regex(ethAddressRegex, 'Invalid Ethereum wallet address').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const walletNonceSchema = z.object({
  walletAddress: z.string().regex(ethAddressRegex, 'Invalid Ethereum wallet address'),
});

export const walletVerifySchema = z.object({
  walletAddress: z.string().regex(ethAddressRegex, 'Invalid Ethereum wallet address'),
  signature: z.string().min(1, 'Signature is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type WalletNonceInput = z.infer<typeof walletNonceSchema>;
export type WalletVerifyInput = z.infer<typeof walletVerifySchema>;
