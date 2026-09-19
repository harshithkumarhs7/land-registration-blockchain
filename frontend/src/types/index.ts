export type UserRole = 'ADMIN' | 'REGISTRAR' | 'LAND_OWNER' | 'BUYER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  walletAddress?: string | null;
  phone?: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export type LandStatus =
  | 'PENDING_VERIFICATION'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'BLOCKCHAIN_PENDING'
  | 'REGISTERED'
  | 'BLOCKCHAIN_FAILED'
  | 'TRANSFER_PENDING';

export interface LandDocument {
  id: string;
  landId: string;
  uploadedById: string;
  documentType: string;
  originalFileName: string;
  storagePath: string;
  fileHash: string;
  mimeType: string;
  fileSize: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  uploadedBy?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface OwnershipHistory {
  id: string;
  landId: string;
  previousOwnerId: string;
  newOwnerId: string;
  transferRequestId?: string | null;
  blockchainTxHash?: string | null;
  transferredAt: string;
  previousOwner: {
    id: string;
    name: string;
    walletAddress?: string;
  };
  newOwner: {
    id: string;
    name: string;
    walletAddress?: string;
  };
}

export interface RegistrationApplication {
  id: string;
  applicantId: string;
  landId: string;
  status: 'PENDING_VERIFICATION' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  remarks?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  applicant?: User;
  land?: Land;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface TransferRequest {
  id: string;
  landId: string;
  sellerId: string;
  buyerId: string;
  status:
    | 'PENDING'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'BLOCKCHAIN_PENDING'
    | 'COMPLETED'
    | 'CANCELLED';
  reason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  blockchainTxHash?: string | null;
  createdAt: string;
  land?: Land;
  seller?: User;
  buyer?: User;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface BlockchainTransaction {
  id: string;
  landId?: string | null;
  transactionHash: string;
  blockNumber?: number | null;
  transactionType: string;
  fromAddress: string;
  toAddress: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  gasUsed?: string | null;
  createdAt: string;
  land?: {
    propertyId: string;
    surveyNumber: string;
    district: string;
  } | null;
}

export interface Land {
  id: string;
  propertyId: string;
  surveyNumber: string;
  ownerId: string;
  area: number;
  landType: string;
  village: string;
  taluk: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  status: LandStatus;
  blockchainPropertyId?: string | null;
  blockchainTxHash?: string | null;
  blockchainBlockNumber?: number | null;
  contractAddress?: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  documents?: LandDocument[];
  ownershipHistories?: OwnershipHistory[];
  registrationApplications?: RegistrationApplication[];
  transferRequests?: TransferRequest[];
  blockchainTransactions?: BlockchainTransaction[];
  _count?: {
    documents: number;
    ownershipHistories: number;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}
