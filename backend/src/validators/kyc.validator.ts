import { z } from 'zod';

export const requestAadhaarOtpSchema = z.object({
  aadhaarNumber: z
    .string()
    .trim()
    .regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 numeric digits')
    .refine((val) => {
      // Basic check: should not be all identical digits (e.g. 000000000000)
      return !/^(\d)\1{11}$/.test(val);
    }, 'Aadhaar number format is invalid'),
});

export const verifyAadhaarOtpSchema = z.object({
  txnId: z.string().min(1, 'Transaction ID is required'),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP must be a 6-digit numeric code'),
});

export const digilockerCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'OAuth state parameter is required'),
});

export type RequestAadhaarOtpInput = z.infer<typeof requestAadhaarOtpSchema>;
export type VerifyAadhaarOtpInput = z.infer<typeof verifyAadhaarOtpSchema>;
export type DigiLockerCallbackInput = z.infer<typeof digilockerCallbackSchema>;
