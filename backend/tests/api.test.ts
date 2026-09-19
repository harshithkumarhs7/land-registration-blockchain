import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Land Registration Backend API Integration Suite', () => {
  let adminToken: string;
  let ownerToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    // Authenticate demo users seeded previously
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@landregistry.gov', password: 'Admin@123456' });
    adminToken = adminLogin.body.data.token;

    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@gmail.com', password: 'Owner@123456' });
    ownerToken = ownerLogin.body.data.token;

    const buyerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'buyer@gmail.com', password: 'Buyer@123456' });
    buyerToken = buyerLogin.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Authentication & RBAC', () => {
    it('should successfully log in admin and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@landregistry.gov', password: 'Admin@123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('ADMIN');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@landregistry.gov', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when accessing protected route without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should allow user to fetch profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('owner@gmail.com');
    });

    it('should enforce RBAC: buyer cannot access admin audit logs', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin to access audit logs', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.logs).toBeDefined();
    });
  });

  describe('2. MetaMask / Wallet Nonce Flow', () => {
    it('should generate a 32-byte cryptographic nonce for a valid Ethereum address', async () => {
      const res = await request(app)
        .post('/api/wallet/nonce')
        .send({ walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' });

      expect(res.status).toBe(200);
      expect(res.body.data.nonce).toHaveLength(64);
      expect(res.body.data.message).toContain('Nonce:');
    });

    it('should reject invalid Ethereum wallet format', async () => {
      const res = await request(app)
        .post('/api/wallet/nonce')
        .send({ walletAddress: '0xinvalidEthereumAddress' });

      expect(res.status).toBe(400);
    });
  });

  describe('3. Land Discovery & Public Verification', () => {
    it('should search lands publicly without authentication', async () => {
      const res = await request(app).get('/api/public/lands');
      expect(res.status).toBe(200);
      expect(res.body.data.lands).toBeDefined();
      expect(res.body.data.lands.length).toBeGreaterThan(0);
    });

    it('should return tamper-evident verification for registered property', async () => {
      const res = await request(app).get('/api/public/verify/PROP-KA-BLR-001');
      expect(res.status).toBe(200);
      expect(res.body.data.propertyId).toBe('PROP-KA-BLR-001');
      expect(res.body.data.databaseRecord).toBeDefined();
      expect(res.body.data.contractAddress).toBeDefined();
    });

    it('should return 404 for nonexistent property in public verification', async () => {
      const res = await request(app).get('/api/public/verify/NON-EXISTENT-PROP');
      expect(res.status).toBe(404);
    });
  });

  describe('4. Admin System Metrics', () => {
    it('should return accurate database dashboard statistics', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.metrics.totalUsers).toBeGreaterThanOrEqual(4);
      expect(res.body.data.metrics.totalLands).toBeGreaterThanOrEqual(2);
      expect(res.body.data.landTypeDistribution).toBeDefined();
    });
  });
});
