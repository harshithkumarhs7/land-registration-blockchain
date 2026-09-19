import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('DigiLocker & Aadhaar e-KYC Integration Test Suite', () => {
  let testUserToken: string;
  let testUserId: string;
  let testUser2Token: string;
  let testUser2Id: string;

  beforeAll(async () => {
    // Register two brand new users for testing KYC
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'Test Citizen User 1',
      email: 'kyc.test1@bhoomichain.gov',
      password: 'Password@123',
      phone: '+91 9988776655',
      role: 'LAND_OWNER',
    });
    testUserToken = res1.body.data.token;
    testUserId = res1.body.data.user.id;

    const res2 = await request(app).post('/api/auth/register').send({
      name: 'Test Citizen User 2',
      email: 'kyc.test2@bhoomichain.gov',
      password: 'Password@123',
      phone: '+91 9123456780',
      role: 'BUYER',
    });
    testUser2Token = res2.body.data.token;
    testUser2Id = res2.body.data.user.id;
  });

  afterAll(async () => {
    // Cleanup created test users
    await prisma.auditLog.deleteMany({
      where: { userId: { in: [testUserId, testUser2Id] } },
    });
    await prisma.notification.deleteMany({
      where: { userId: { in: [testUserId, testUser2Id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, testUser2Id] } },
    });
    await prisma.$disconnect();
  });

  describe('1. Aadhaar OTP Flow & Validation', () => {
    let txnId: string;
    const testAadhaar = '543210987654';

    it('should reject non-12-digit Aadhaar numbers', async () => {
      const res = await request(app)
        .post('/api/kyc/aadhaar/otp-request')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ aadhaarNumber: '12345' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid all-identical Aadhaar numbers', async () => {
      const res = await request(app)
        .post('/api/kyc/aadhaar/otp-request')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ aadhaarNumber: '000000000000' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully dispatch OTP for valid 12-digit Aadhaar', async () => {
      const res = await request(app)
        .post('/api/kyc/aadhaar/otp-request')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ aadhaarNumber: testAadhaar });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.txnId).toBeDefined();
      expect(res.body.data.maskedAadhaar).toBe('XXXXXXXX7654');
      expect(res.body.data.maskedMobile).toContain('6655');

      txnId = res.body.data.txnId;
    });

    it('should reject incorrect OTP', async () => {
      const res = await request(app)
        .post('/api/kyc/aadhaar/otp-verify')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ txnId, otp: '999999' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid OTP');
    });

    it('should successfully verify OTP and update user to Aadhaar-verified', async () => {
      const res = await request(app)
        .post('/api/kyc/aadhaar/otp-verify')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ txnId, otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.isAadhaarVerified).toBe(true);
      expect(res.body.data.user.aadhaarMasked).toBe('XXXXXXXX7654');
      expect(res.body.data.user.digilockerUri).toContain('in.gov.uidai-adhr-XXXXXXXX7654');
    });

    it('should prevent another user from verifying the same Aadhaar number (Deduplication)', async () => {
      const res = await request(app)
        .post('/api/kyc/aadhaar/otp-request')
        .set('Authorization', `Bearer ${testUser2Token}`)
        .send({ aadhaarNumber: testAadhaar });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already linked and verified with another registered account');
    });
  });

  describe('2. DigiLocker Status and One-Click Sandbox Simulation', () => {
    it('should return verified status on GET /api/kyc/status', async () => {
      const res = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAadhaarVerified).toBe(true);
      expect(res.body.data.aadhaarMasked).toBe('XXXXXXXX7654');
      expect(res.body.data.kycData).toBeDefined();
    });

    it('should verify second user via one-click DigiLocker simulation', async () => {
      const res = await request(app)
        .post('/api/kyc/digilocker/simulate')
        .set('Authorization', `Bearer ${testUser2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.isAadhaarVerified).toBe(true);
      expect(res.body.data.user.aadhaarMasked).toMatch(/^XXXXXXXX\d{4}$/);
      expect(res.body.data.user.digilockerUri).toBeDefined();
    });
  });

  describe('3. Land Registration KYC Enforcement', () => {
    let unverifiedToken: string;
    let unverifiedId: string;

    beforeAll(async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Unverified Citizen',
        email: 'unverified@bhoomichain.gov',
        password: 'Password@123',
        role: 'LAND_OWNER',
        walletAddress: '0x1111111111111111111111111111111111111111',
      });
      unverifiedToken = res.body.data.token;
      unverifiedId = res.body.data.user.id;
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: unverifiedId } });
    });

    it('should reject land registration submission if user is not Aadhaar verified', async () => {
      const res = await request(app)
        .post('/api/lands')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send({
          surveyNumber: 'SY-KYC-999',
          area: 1500,
          landType: 'RESIDENTIAL',
          village: 'Electronic City',
          taluk: 'Anekal',
          district: 'Bengaluru Urban',
          state: 'Karnataka',
          latitude: 12.8452,
          longitude: 77.6602,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Please complete DigiLocker Aadhaar e-KYC verification');
    });
  });
});
