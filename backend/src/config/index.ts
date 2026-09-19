import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secure-jwt-secret-key-change-in-production-min-32-chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  blockchain: {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
    contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    adminPrivateKey: process.env.ADMIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    registrarPrivateKey: process.env.REGISTRAR_PRIVATE_KEY || '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  },
  storage: {
    uploadDir: path.resolve(__dirname, '../../', process.env.STORAGE_PATH || './uploads'),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500', 10),
  },
  digilocker: {
    clientId: process.env.DIGILOCKER_CLIENT_ID || 'BHOOMI_CHAIN_SANDBOX_CLIENT_ID',
    clientSecret: process.env.DIGILOCKER_CLIENT_SECRET || 'sandbox_secret_key_987654321',
    redirectUri: process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:5173/kyc/digilocker/callback',
    authUrl: process.env.DIGILOCKER_AUTH_URL || 'https://digilocker.merimegh.gov.in/public/oauth2/1/authorize',
    tokenUrl: process.env.DIGILOCKER_TOKEN_URL || 'https://digilocker.merimegh.gov.in/public/oauth2/1/token',
    apiBaseUrl: process.env.DIGILOCKER_API_URL || 'https://digilocker.merimegh.gov.in/public/oauth2/2',
    isSandbox: process.env.DIGILOCKER_SANDBOX !== 'false', // Default true for zero-credential academic evaluation
    aadhaarSalt: process.env.AADHAAR_SALT || 'bhoomichain-aadhaar-salt-2024-secure-unique-token',
  },
};
