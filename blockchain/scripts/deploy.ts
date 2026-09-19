import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Starting LandRegistry contract deployment...");

  const [deployer, registrarAccount, ownerAccount] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Registrar address: ${registrarAccount.address}`);

  // Deploy contract
  const LandRegistryFactory = await ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistryFactory.deploy(
    deployer.address,
    registrarAccount.address
  );
  await landRegistry.waitForDeployment();

  const contractAddress = await landRegistry.getAddress();
  console.log(`✅ LandRegistry contract deployed at: ${contractAddress}`);

  // Also grant REGISTRAR_ROLE to deployer if useful for testing/admin actions
  const REGISTRAR_ROLE = await landRegistry.REGISTRAR_ROLE();
  await landRegistry.grantRole(REGISTRAR_ROLE, deployer.address);
  console.log(`Granted REGISTRAR_ROLE to deployer (${deployer.address})`);

  // Register initial seed property: PROP-KA-BLR-001
  const propertyId = "PROP-KA-BLR-001";
  const surveyNumber = "142/2B";
  const ownerAddress = ownerAccount.address;
  const docHashBytes = ethers.keccak256(ethers.toUtf8Bytes("Sample Sale Deed Document 2024 - PROP-KA-BLR-001"));
  const metaHashBytes = ethers.keccak256(ethers.toUtf8Bytes("Property Metadata PROP-KA-BLR-001"));

  const tx = await landRegistry.registerLand(
    propertyId,
    surveyNumber,
    ownerAddress,
    docHashBytes,
    metaHashBytes
  );
  await tx.wait();
  console.log(`🌱 Registered initial property: ${propertyId} with owner: ${ownerAddress}`);

  // Export contract artifact & address for backend & frontend consumption
  const artifact = await import("../artifacts/contracts/LandRegistry.sol/LandRegistry.json");

  const exportData = {
    address: contractAddress,
    network: "localhost",
    chainId: 31337,
    abi: artifact.abi,
    deployedAt: new Date().toISOString(),
  };

  // Destination paths
  const backendDestDir = path.resolve(__dirname, "../../backend/src/blockchain/contracts");
  if (!fs.existsSync(backendDestDir)) {
    fs.mkdirSync(backendDestDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(backendDestDir, "LandRegistry.json"),
    JSON.stringify(exportData, null, 2)
  );
  console.log(`💾 Saved contract metadata to backend at: ${path.join(backendDestDir, "LandRegistry.json")}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
