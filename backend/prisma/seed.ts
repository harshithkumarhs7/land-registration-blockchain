import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Land Registration Platform...');

  // Clean existing tables in reverse dependency order
  await prisma.blockchainTransaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.ownershipHistory.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.registrationApplication.deleteMany();
  await prisma.landDocument.deleteMany();
  await prisma.land.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  // Common salt & password hashes (Safe development credentials)
  const passwordSalt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123456', passwordSalt);
  const registrarPassword = await bcrypt.hash('Registrar@123456', passwordSalt);
  const ownerPassword = await bcrypt.hash('Owner@123456', passwordSalt);
  const buyerPassword = await bcrypt.hash('Buyer@123456', passwordSalt);

  // 1. Seed Users
  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Rajesh Sharma (Administrator)',
      email: 'admin@landregistry.gov',
      passwordHash: adminPassword,
      role: 'ADMIN',
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat #0
      phone: '+91 98765 43210',
      status: 'ACTIVE',
    },
  });

  const registrar = await prisma.user.create({
    data: {
      name: 'Sunita Rao (Sub-Registrar Bengaluru North)',
      email: 'registrar@landregistry.gov',
      passwordHash: registrarPassword,
      role: 'REGISTRAR',
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Hardhat #1
      phone: '+91 98765 43211',
      status: 'ACTIVE',
    },
  });

  const landOwner = await prisma.user.create({
    data: {
      name: 'Vikramaditya Verma (Property Owner)',
      email: 'owner@gmail.com',
      passwordHash: ownerPassword,
      role: 'LAND_OWNER',
      walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Hardhat #2
      phone: '+91 98765 43212',
      status: 'ACTIVE',
    },
  });

  const buyer = await prisma.user.create({
    data: {
      name: 'Ananya Deshmukh (Prospective Buyer)',
      email: 'buyer@gmail.com',
      passwordHash: buyerPassword,
      role: 'BUYER',
      walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Hardhat #3
      phone: '+91 98765 43213',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created 4 standard demo users across all roles.');

  // Deterministic sample document hashes (SHA-256)
  const doc1Hash = crypto.createHash('sha256').update('Sample Sale Deed Document 2024 - PROP-KA-BLR-001').digest('hex');
  const doc2Hash = crypto.createHash('sha256').update('Official Cadastral Survey Sketch - Survey 142/2B').digest('hex');
  const doc3Hash = crypto.createHash('sha256').update('Agricultural Clearance Certificate - PROP-KA-MYS-002').digest('hex');

  // 2. Seed Registered Land 1 (Fully Registered on Blockchain)
  const registeredLand = await prisma.land.create({
    data: {
      propertyId: 'PROP-KA-BLR-001',
      surveyNumber: '142/2B',
      ownerId: landOwner.id,
      area: 2400.0, // sq ft
      landType: 'RESIDENTIAL',
      village: 'Whitefield',
      taluk: 'Bengaluru East',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      latitude: 12.9698,
      longitude: 77.7500,
      description: 'Prime corner plot near IT corridor with clear encumbrance and road connectivity.',
      status: 'REGISTERED',
      blockchainPropertyId: 'PROP-KA-BLR-001',
      blockchainTxHash: '0x4f128e45a278912d8a43ef873491bc90812d4a789ef45123981240981248912a',
      blockchainBlockNumber: 42,
      contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    },
  });

  // Seed documents for registered land
  await prisma.landDocument.create({
    data: {
      landId: registeredLand.id,
      uploadedById: landOwner.id,
      documentType: 'SALE_DEED',
      originalFileName: 'Sale_Deed_Whitefield_142_2B.pdf',
      storagePath: 'uploads/demo-deed-001.pdf',
      fileHash: doc1Hash,
      mimeType: 'application/pdf',
      fileSize: 1048576,
      verificationStatus: 'VERIFIED',
    },
  });

  await prisma.landDocument.create({
    data: {
      landId: registeredLand.id,
      uploadedById: landOwner.id,
      documentType: 'SURVEY_SKETCH',
      originalFileName: 'Survey_Department_Sketch_142.pdf',
      storagePath: 'uploads/demo-sketch-001.pdf',
      fileHash: doc2Hash,
      mimeType: 'application/pdf',
      fileSize: 524288,
      verificationStatus: 'VERIFIED',
    },
  });

  // Seed registration application for registered land
  await prisma.registrationApplication.create({
    data: {
      applicantId: landOwner.id,
      landId: registeredLand.id,
      status: 'APPROVED',
      remarks: 'All title documents and cadastral sketches verified against revenue department records.',
      reviewedById: registrar.id,
      reviewedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
    },
  });

  // Seed blockchain transaction record
  await prisma.blockchainTransaction.create({
    data: {
      landId: registeredLand.id,
      transactionHash: '0x4f128e45a278912d8a43ef873491bc90812d4a789ef45123981240981248912a',
      blockNumber: 42,
      transactionType: 'LAND_REGISTRATION',
      fromAddress: registrar.walletAddress!,
      toAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      status: 'CONFIRMED',
      gasUsed: '142850',
    },
  });

  // 3. Seed Land 2 (Pending Registrar Verification)
  const pendingLand = await prisma.land.create({
    data: {
      propertyId: 'PROP-KA-MYS-002',
      surveyNumber: '88/1A',
      ownerId: landOwner.id,
      area: 43560.0, // 1 Acre
      landType: 'AGRICULTURAL',
      village: 'Hunsur Road',
      taluk: 'Mysuru Taluk',
      district: 'Mysuru',
      state: 'Karnataka',
      latitude: 12.3150,
      longitude: 76.6120,
      description: 'Agricultural farmland with canal water access and clear title deed.',
      status: 'PENDING_VERIFICATION',
    },
  });

  await prisma.landDocument.create({
    data: {
      landId: pendingLand.id,
      uploadedById: landOwner.id,
      documentType: 'TAX_RECEIPT',
      originalFileName: 'Revenue_Tax_Paid_Challan_2024.pdf',
      storagePath: 'uploads/demo-tax-002.pdf',
      fileHash: doc3Hash,
      mimeType: 'application/pdf',
      fileSize: 419430,
      verificationStatus: 'PENDING',
    },
  });

  await prisma.registrationApplication.create({
    data: {
      applicantId: landOwner.id,
      landId: pendingLand.id,
      status: 'PENDING_VERIFICATION',
      remarks: 'Application submitted for government sub-registrar verification.',
    },
  });

  // 4. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: landOwner.id,
        action: 'LAND_CREATED',
        entityType: 'LAND',
        entityId: registeredLand.id,
        ipAddress: '127.0.0.1',
        metadata: JSON.stringify({ propertyId: 'PROP-KA-BLR-001', area: 2400 }),
      },
      {
        userId: registrar.id,
        action: 'DOCUMENT_VERIFIED',
        entityType: 'DOCUMENT',
        entityId: registeredLand.id,
        ipAddress: '127.0.0.1',
        metadata: JSON.stringify({ docType: 'SALE_DEED', status: 'VERIFIED' }),
      },
      {
        userId: registrar.id,
        action: 'REGISTRATION_APPROVED',
        entityType: 'LAND',
        entityId: registeredLand.id,
        ipAddress: '127.0.0.1',
        metadata: JSON.stringify({ status: 'APPROVED' }),
      },
      {
        userId: registrar.id,
        action: 'LAND_REGISTERED_BLOCKCHAIN',
        entityType: 'BLOCKCHAIN',
        entityId: registeredLand.id,
        ipAddress: '127.0.0.1',
        metadata: JSON.stringify({ txHash: '0x4f128e45a278912d8a43ef873491bc90812d4a789ef45123981240981248912a' }),
      },
    ],
  });

  // 5. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: landOwner.id,
        title: 'Land Registration Approved',
        message: 'Your property PROP-KA-BLR-001 has been verified and registered on the blockchain.',
        type: 'SUCCESS',
        isRead: false,
      },
      {
        userId: registrar.id,
        title: 'New Land Application Awaiting Review',
        message: 'Application for property PROP-KA-MYS-002 submitted by Vikramaditya Verma requires verification.',
        type: 'INFO',
        isRead: false,
      },
      {
        userId: buyer.id,
        title: 'Welcome to Land Registry Portal',
        message: 'You can explore verified land parcels and submit purchase or transfer requests.',
        type: 'INFO',
        isRead: true,
      },
    ],
  });

  console.log('🎉 Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('ADMIN:     admin@landregistry.gov     / Admin@123456');
  console.log('REGISTRAR: registrar@landregistry.gov / Registrar@123456');
  console.log('OWNER:     owner@gmail.com            / Owner@123456');
  console.log('BUYER:     buyer@gmail.com            / Buyer@123456');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
