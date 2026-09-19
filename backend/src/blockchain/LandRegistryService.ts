import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { HashUtil } from '../utils/hash.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BlockchainReceiptInfo {
  transactionHash: string;
  blockNumber: number;
  contractAddress: string;
  from: string;
  to: string;
  gasUsed: string;
  status: 'CONFIRMED' | 'FAILED';
  timestamp: number;
}

export interface OnChainLandRecord {
  propertyId: string;
  surveyNumber: string;
  owner: string;
  documentHash: string;
  metadataHash: string;
  status: number;
  registrationTimestamp: number;
  exists: boolean;
  isActive: boolean;
}

export interface OnChainOwnershipHistory {
  previousOwner: string;
  newOwner: string;
  transferredAt: number;
  transferTxRef: string;
}

export class LandRegistryService {
  private provider: ethers.JsonRpcProvider;
  private registrarSigner: ethers.Wallet | null = null;
  private adminSigner: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private contractAbi: any = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

    try {
      if (config.blockchain.registrarPrivateKey) {
        this.registrarSigner = new ethers.Wallet(
          config.blockchain.registrarPrivateKey,
          this.provider
        );
      }
      if (config.blockchain.adminPrivateKey) {
        this.adminSigner = new ethers.Wallet(
          config.blockchain.adminPrivateKey,
          this.provider
        );
      }

      this.loadContractArtifact();
    } catch (err: any) {
      logger.warn(`Blockchain signer initialization notice: ${err.message}`);
    }
  }

  private loadContractArtifact(): void {
    const artifactPath = path.resolve(__dirname, 'contracts/LandRegistry.json');
    if (fs.existsSync(artifactPath)) {
      const data = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      this.contractAbi = data.abi;
      if (config.blockchain.contractAddress && this.contractAbi) {
        this.contract = new ethers.Contract(
          config.blockchain.contractAddress,
          this.contractAbi,
          this.provider
        );
      }
    } else {
      logger.warn(`Contract artifact not found at: ${artifactPath}`);
    }
  }

  /**
   * Health check to test if the Ethereum RPC node is reachable
   */
  async isAvailable(): Promise<boolean> {
    try {
      const blockNum = await this.provider.getBlockNumber();
      return blockNum >= 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Registers a land parcel on the Ethereum smart contract
   */
  async registerLandOnChain(
    propertyId: string,
    surveyNumber: string,
    ownerAddress: string,
    docHashHex: string,
    metadataHashHex?: string
  ): Promise<BlockchainReceiptInfo> {
    const isOnline = await this.isAvailable();
    if (!isOnline || !this.contract || !this.registrarSigner) {
      throw new Error(
        'Blockchain node or registrar signer is not reachable. Ensure Hardhat node is running.'
      );
    }

    const docHashBytes32 = HashUtil.toBytes32(docHashHex);
    const metaHashBytes32 = metadataHashHex
      ? HashUtil.toBytes32(metadataHashHex)
      : ethers.keccak256(ethers.toUtf8Bytes(propertyId));

    logger.info(`[Blockchain] Calling registerLand for ${propertyId}...`);

    const contractWithSigner = this.contract.connect(this.registrarSigner) as any;
    const tx = await contractWithSigner.registerLand(
      propertyId,
      surveyNumber,
      ownerAddress,
      docHashBytes32,
      metaHashBytes32
    );

    const receipt = await tx.wait();

    const block = await this.provider.getBlock(receipt.blockNumber);
    const timestamp = block ? block.timestamp : Math.floor(Date.now() / 1000);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      contractAddress: config.blockchain.contractAddress,
      from: receipt.from,
      to: receipt.to || config.blockchain.contractAddress,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
      timestamp,
    };
  }

  /**
   * Transfers ownership of a registered land parcel on-chain
   */
  async transferOwnershipOnChain(
    propertyId: string,
    newOwnerAddress: string,
    transferTxRef: string
  ): Promise<BlockchainReceiptInfo> {
    const isOnline = await this.isAvailable();
    if (!isOnline || !this.contract || !this.registrarSigner) {
      throw new Error(
        'Blockchain node or registrar signer is not reachable. Ensure Hardhat node is running.'
      );
    }

    logger.info(
      `[Blockchain] Calling transferOwnership for ${propertyId} -> ${newOwnerAddress}...`
    );

    const contractWithSigner = this.contract.connect(this.registrarSigner) as any;
    const tx = await contractWithSigner.transferOwnership(
      propertyId,
      newOwnerAddress,
      transferTxRef
    );

    const receipt = await tx.wait();
    const block = await this.provider.getBlock(receipt.blockNumber);
    const timestamp = block ? block.timestamp : Math.floor(Date.now() / 1000);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      contractAddress: config.blockchain.contractAddress,
      from: receipt.from,
      to: receipt.to || config.blockchain.contractAddress,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'CONFIRMED' : 'FAILED',
      timestamp,
    };
  }

  /**
   * Verifies document hash on-chain against immutable stored hash
   */
  async verifyDocumentOnChain(
    propertyId: string,
    docHashHex: string
  ): Promise<{ isMatch: boolean; registeredAt: number }> {
    const isOnline = await this.isAvailable();
    if (!isOnline || !this.contract) {
      throw new Error('Blockchain node is not reachable');
    }

    const docHashBytes32 = HashUtil.toBytes32(docHashHex);
    const land = await this.contract.getLand(propertyId);

    const isMatch = land.documentHash.toLowerCase() === docHashBytes32.toLowerCase();
    return {
      isMatch,
      registeredAt: Number(land.registrationTimestamp),
    };
  }

  /**
   * Reads raw land record from smart contract
   */
  async getLandFromChain(propertyId: string): Promise<OnChainLandRecord | null> {
    const isOnline = await this.isAvailable();
    if (!isOnline || !this.contract) {
      return null;
    }

    try {
      const exists = await this.contract.landExists(propertyId);
      if (!exists) return null;

      const record = await this.contract.getLand(propertyId);
      return {
        propertyId: record.propertyId,
        surveyNumber: record.surveyNumber,
        owner: record.owner,
        documentHash: record.documentHash,
        metadataHash: record.metadataHash,
        status: Number(record.status),
        registrationTimestamp: Number(record.registrationTimestamp),
        exists: record.exists,
        isActive: record.isActive,
      };
    } catch (err: any) {
      logger.error(`Failed to fetch land from chain: ${err.message}`);
      return null;
    }
  }

  /**
   * Reads historical ownership records from smart contract
   */
  async getOwnershipHistoryFromChain(
    propertyId: string
  ): Promise<OnChainOwnershipHistory[]> {
    const isOnline = await this.isAvailable();
    if (!isOnline || !this.contract) {
      return [];
    }

    try {
      const history = await this.contract.getOwnershipHistory(propertyId);
      return history.map((rec: any) => ({
        previousOwner: rec.previousOwner,
        newOwner: rec.newOwner,
        transferredAt: Number(rec.transferredAt),
        transferTxRef: rec.transferTxRef,
      }));
    } catch (err: any) {
      logger.error(`Failed to fetch history from chain: ${err.message}`);
      return [];
    }
  }

  /**
   * Retrieves transaction receipt directly from the blockchain
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    return await this.provider.getTransactionReceipt(txHash);
  }
}

export const landRegistryService = new LandRegistryService();
