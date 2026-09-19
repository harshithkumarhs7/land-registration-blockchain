import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';
import { HashUtil } from '../utils/hash.js';
import { AuditService } from './AuditService.js';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Registers a new user with standard credentials
   */
  static async register(data: RegisterInput, ip?: string): Promise<{ token: string; user: Partial<User> }> {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError('An account with this email address already exists', 400);
    }

    if (data.walletAddress) {
      const existingWallet = await prisma.user.findUnique({
        where: { walletAddress: data.walletAddress.toLowerCase() },
      });
      if (existingWallet) {
        throw new AppError('This Ethereum wallet address is already linked to another account', 400);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        role: data.role || 'BUYER',
        phone: data.phone || null,
        walletAddress: data.walletAddress ? data.walletAddress.toLowerCase() : null,
      },
    });

    await AuditService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      ipAddress: ip,
      metadata: { email: user.email, role: user.role },
    });

    const token = this.generateJwt(user);
    const { passwordHash: _, ...safeUser } = user;

    return { token, user: safeUser };
  }

  /**
   * Logs in a user via email and password
   */
  static async login(data: LoginInput, ip?: string): Promise<{ token: string; user: Partial<User> }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password credentials', 401);
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('Account is suspended. Contact land registry administrator.', 403);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials', 401);
    }

    await AuditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      ipAddress: ip,
      metadata: { email: user.email },
    });

    const token = this.generateJwt(user);
    const { passwordHash: _, ...safeUser } = user;

    return { token, user: safeUser };
  }

  /**
   * Generates a challenge nonce for MetaMask signing
   */
  static async generateNonce(walletAddress: string): Promise<{ nonce: string; message: string }> {
    const normalizedAddress = walletAddress.toLowerCase();
    const nonce = HashUtil.generateNonce();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    // Update user if wallet is already known, or update matching user record
    const user = await prisma.user.findFirst({
      where: { walletAddress: normalizedAddress },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { nonce, nonceExpiresAt: expiresAt },
      });
    }

    const message = `Sign this one-time challenge to authenticate with the Land Registry System:\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
    return { nonce, message };
  }

  /**
   * Verifies signature and links wallet to an authenticated user
   */
  static async verifyAndLinkWallet(
    userId: string,
    walletAddress: string,
    signature: string,
    message: string,
    ip?: string
  ): Promise<Partial<User>> {
    const normalizedAddress = walletAddress.toLowerCase();

    // Verify ECDSA signature
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature).toLowerCase();
    } catch (err: any) {
      throw new AppError('Cryptographic signature verification failed: Malformed signature', 400);
    }

    if (recoveredAddress !== normalizedAddress) {
      throw new AppError('Cryptographic signature does not match the provided wallet address', 400);
    }

    // Check if wallet is linked elsewhere
    const existing = await prisma.user.findFirst({
      where: {
        walletAddress: normalizedAddress,
        id: { not: userId },
      },
    });

    if (existing) {
      throw new AppError('This wallet address is already linked to a different account', 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        walletAddress: normalizedAddress,
        nonce: null,
        nonceExpiresAt: null,
      },
    });

    await AuditService.log({
      userId,
      action: 'WALLET_LINKED',
      entityType: 'USER',
      entityId: userId,
      ipAddress: ip,
      metadata: { walletAddress: normalizedAddress },
    });

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  /**
   * Retrieves profile for currently authenticated user
   */
  static async getProfile(userId: string): Promise<Partial<User>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  private static generateJwt(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );
  }
}
