import { expect } from "chai";
import { ethers } from "hardhat";
import { LandRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LandRegistry Smart Contract Comprehensive Suite", function () {
  let landRegistry: LandRegistry;
  let admin: SignerWithAddress;
  let registrar: SignerWithAddress;
  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const samplePropId = "PROP-KA-BLR-101";
  const sampleSurveyNo = "45/3A";
  const sampleDocHash = ethers.keccak256(ethers.toUtf8Bytes("Deed Document 101"));
  const sampleMetaHash = ethers.keccak256(ethers.toUtf8Bytes("Metadata 101"));

  beforeEach(async function () {
    [admin, registrar, owner, buyer, unauthorized] = await ethers.getSigners();

    const LandRegistryFactory = await ethers.getContractFactory("LandRegistry");
    landRegistry = (await LandRegistryFactory.deploy(
      admin.address,
      registrar.address
    )) as unknown as LandRegistry;
    await landRegistry.waitForDeployment();
  });

  describe("1. Deployment & Roles", function () {
    it("should assign DEFAULT_ADMIN_ROLE and REGISTRAR_ROLE correctly", async function () {
      const DEFAULT_ADMIN_ROLE = await landRegistry.DEFAULT_ADMIN_ROLE();
      const REGISTRAR_ROLE = await landRegistry.REGISTRAR_ROLE();

      expect(await landRegistry.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be.true;
      expect(await landRegistry.hasRole(REGISTRAR_ROLE, registrar.address)).to.be.true;
      expect(await landRegistry.hasRole(REGISTRAR_ROLE, unauthorized.address)).to.be.false;
    });

    it("should reject deployment with zero address admin or registrar", async function () {
      const Factory = await ethers.getContractFactory("LandRegistry");
      await expect(
        Factory.deploy(ethers.ZeroAddress, registrar.address)
      ).to.be.revertedWith("LandRegistry: Admin cannot be zero address");

      await expect(
        Factory.deploy(admin.address, ethers.ZeroAddress)
      ).to.be.revertedWith("LandRegistry: Registrar cannot be zero address");
    });
  });

  describe("2. Land Registration", function () {
    it("should allow an authorized registrar to register a land parcel", async function () {
      const tx = await landRegistry.connect(registrar).registerLand(
        samplePropId,
        sampleSurveyNo,
        owner.address,
        sampleDocHash,
        sampleMetaHash
      );

      await expect(tx)
        .to.emit(landRegistry, "LandRegistered")
        .withArgs(samplePropId, sampleSurveyNo, owner.address, sampleDocHash, (val: any) => val > 0);

      expect(await landRegistry.landExists(samplePropId)).to.be.true;
      expect(await landRegistry.getOwner(samplePropId)).to.equal(owner.address);

      const land = await landRegistry.getLand(samplePropId);
      expect(land.propertyId).to.equal(samplePropId);
      expect(land.surveyNumber).to.equal(sampleSurveyNo);
      expect(land.owner).to.equal(owner.address);
      expect(land.documentHash).to.equal(sampleDocHash);
      expect(land.exists).to.be.true;
      expect(land.isActive).to.be.true;
    });

    it("should record genesis ownership provenance in history", async function () {
      await landRegistry.connect(registrar).registerLand(
        samplePropId,
        sampleSurveyNo,
        owner.address,
        sampleDocHash,
        sampleMetaHash
      );

      const history = await landRegistry.getOwnershipHistory(samplePropId);
      expect(history.length).to.equal(1);
      expect(history[0].previousOwner).to.equal(ethers.ZeroAddress);
      expect(history[0].newOwner).to.equal(owner.address);
      expect(history[0].transferTxRef).to.equal("GENESIS_REGISTRATION");
    });

    it("should reject duplicate land registration", async function () {
      await landRegistry.connect(registrar).registerLand(
        samplePropId,
        sampleSurveyNo,
        owner.address,
        sampleDocHash,
        sampleMetaHash
      );

      await expect(
        landRegistry.connect(registrar).registerLand(
          samplePropId,
          "99/1",
          buyer.address,
          sampleDocHash,
          sampleMetaHash
        )
      ).to.be.revertedWith("LandRegistry: Property ID already registered");
    });

    it("should reject registration from unauthorized non-registrar", async function () {
      await expect(
        landRegistry.connect(unauthorized).registerLand(
          "PROP-FAIL-01",
          sampleSurveyNo,
          owner.address,
          sampleDocHash,
          sampleMetaHash
        )
      ).to.be.revertedWithCustomError(landRegistry, "AccessControlUnauthorizedAccount");
    });

    it("should reject registration with zero address owner or zero document hash", async function () {
      await expect(
        landRegistry.connect(registrar).registerLand(
          "PROP-FAIL-02",
          sampleSurveyNo,
          ethers.ZeroAddress,
          sampleDocHash,
          sampleMetaHash
        )
      ).to.be.revertedWith("LandRegistry: Owner cannot be zero address");

      await expect(
        landRegistry.connect(registrar).registerLand(
          "PROP-FAIL-03",
          sampleSurveyNo,
          owner.address,
          ethers.ZeroHash,
          sampleMetaHash
        )
      ).to.be.revertedWith("LandRegistry: Document hash cannot be zero");
    });
  });

  describe("3. Ownership Transfer", function () {
    beforeEach(async function () {
      await landRegistry.connect(registrar).registerLand(
        samplePropId,
        sampleSurveyNo,
        owner.address,
        sampleDocHash,
        sampleMetaHash
      );
    });

    it("should allow authorized registrar to execute an ownership transfer", async function () {
      const transferTx = await landRegistry.connect(registrar).transferOwnership(
        samplePropId,
        buyer.address,
        "TX-TRANSFER-REQ-2024-999"
      );

      await expect(transferTx)
        .to.emit(landRegistry, "OwnershipTransferred")
        .withArgs(samplePropId, owner.address, buyer.address, (val: any) => val > 0, "TX-TRANSFER-REQ-2024-999");

      expect(await landRegistry.getOwner(samplePropId)).to.equal(buyer.address);

      const history = await landRegistry.getOwnershipHistory(samplePropId);
      expect(history.length).to.equal(2);
      expect(history[1].previousOwner).to.equal(owner.address);
      expect(history[1].newOwner).to.equal(buyer.address);
      expect(history[1].transferTxRef).to.equal("TX-TRANSFER-REQ-2024-999");
    });

    it("should prevent transferring to the same current owner", async function () {
      await expect(
        landRegistry.connect(registrar).transferOwnership(
          samplePropId,
          owner.address,
          "TX-SAME-OWNER"
        )
      ).to.be.revertedWith("LandRegistry: New owner must be different from current owner");
    });

    it("should reject transfer to zero address", async function () {
      await expect(
        landRegistry.connect(registrar).transferOwnership(
          samplePropId,
          ethers.ZeroAddress,
          "TX-ZERO-ADDR"
        )
      ).to.be.revertedWith("LandRegistry: New owner cannot be zero address");
    });

    it("should reject transfer for nonexistent property", async function () {
      await expect(
        landRegistry.connect(registrar).transferOwnership(
          "PROP-NONEXISTENT",
          buyer.address,
          "TX-INVALID"
        )
      ).to.be.revertedWith("LandRegistry: Property does not exist");
    });

    it("should reject transfer initiated by unauthorized address", async function () {
      await expect(
        landRegistry.connect(unauthorized).transferOwnership(
          samplePropId,
          buyer.address,
          "TX-HACK"
        )
      ).to.be.revertedWithCustomError(landRegistry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("4. Document Hash Verification", function () {
    beforeEach(async function () {
      await landRegistry.connect(registrar).registerLand(
        samplePropId,
        sampleSurveyNo,
        owner.address,
        sampleDocHash,
        sampleMetaHash
      );
    });

    it("should verify matching document hash and emit event", async function () {
      const tx = await landRegistry.verifyDocumentHash(samplePropId, sampleDocHash);
      await expect(tx)
        .to.emit(landRegistry, "DocumentVerified")
        .withArgs(samplePropId, sampleDocHash, true, (val: any) => val > 0);
    });

    it("should detect mismatched document hash", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("Forged Deed"));
      const tx = await landRegistry.verifyDocumentHash(samplePropId, fakeHash);
      await expect(tx)
        .to.emit(landRegistry, "DocumentVerified")
        .withArgs(samplePropId, fakeHash, false, (val: any) => val > 0);
    });
  });

  describe("5. Pausability & Emergency Controls", function () {
    it("should allow admin to pause and block registrations", async function () {
      await landRegistry.connect(admin).pause();

      await expect(
        landRegistry.connect(registrar).registerLand(
          "PROP-PAUSED",
          "1/1",
          owner.address,
          sampleDocHash,
          sampleMetaHash
        )
      ).to.be.revertedWithCustomError(landRegistry, "EnforcedPause");

      await landRegistry.connect(admin).unpause();
      await expect(
        landRegistry.connect(registrar).registerLand(
          "PROP-PAUSED",
          "1/1",
          owner.address,
          sampleDocHash,
          sampleMetaHash
        )
      ).to.emit(landRegistry, "LandRegistered");
    });
  });
});
