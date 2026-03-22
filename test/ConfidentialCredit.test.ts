import { expect } from "chai";
import hre, { ethers } from "hardhat";
import {
  createFheInstance,
  getFheTokens,
} from "cofhe-hardhat-plugin";

/**
 * ConfidentialCredit tests.
 * Uses cofhe-hardhat-plugin mock environment — no external node required.
 *
 * The mock plugin intercepts FHE precompile calls and executes them in plaintext
 * so tests run fast locally, while the exact same contract deploys on-chain with
 * real FHE on Arbitrum Sepolia.
 */
describe("ConfidentialCredit", function () {
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();

    const CreditFactory = await ethers.getContractFactory("ConfidentialCredit");
    const credit = await CreditFactory.deploy();
    await credit.waitForDeployment();

    return { credit, owner, alice, bob };
  }

  describe("Score Submission", function () {
    it("should allow a user to submit encrypted financial data", async function () {
      const { credit, alice } = await deployFixture();

      // Balance: $50,000 = 50000 (in dollar units)
      // Income:  $30,000 = 30000
      const balance = 50_000n;
      const income  = 30_000n;

      // Encrypt using cofhejs mock helpers
      const { encryptedBalance, encryptedIncome } = await encryptFinancialData(
        alice,
        await credit.getAddress(),
        balance,
        income
      );

      await credit.connect(alice).submitFinancialData(encryptedBalance, encryptedIncome);

      expect(await credit.hasScore(alice.address)).to.equal(true);
    });

    it("should mark hasScore as false before submission", async function () {
      const { credit, bob } = await deployFixture();
      expect(await credit.hasScore(bob.address)).to.equal(false);
    });
  });

  describe("Eligibility Check", function () {
    it("should return true for eligible user (high balance + income)", async function () {
      const { credit, alice } = await deployFixture();

      // Score = 100000*6 + 80000*4 = 600000 + 320000 = 920000
      await submitData(credit, alice, 100_000n, 80_000n);

      // Threshold = 3_000_000 → 920000 < 3000000 … wait, that's BELOW threshold
      // Let's use a lower threshold matching these values
      // threshold = 500_000 → alice score 920000 > 500000 ✓
      const eligible = await credit.connect(alice).checkEligibility(500_000n);
      expect(eligible).to.equal(true);
    });

    it("should return false for ineligible user (low score)", async function () {
      const { credit, bob } = await deployFixture();

      // Score = 1000*6 + 500*4 = 6000 + 2000 = 8000
      await submitData(credit, bob, 1_000n, 500n);

      // Threshold = 3_000_000 → 8000 < 3000000 → not eligible
      const eligible = await credit.connect(bob).checkEligibility(3_000_000n);
      expect(eligible).to.equal(false);
    });

    it("should revert if user has not submitted data", async function () {
      const { credit, bob } = await deployFixture();
      await expect(
        credit.connect(bob).checkEligibility(1000n)
      ).to.be.revertedWith("No financial data submitted");
    });
  });

  describe("Sealed Output (Permit)", function () {
    it("should return non-empty sealed score for user with data", async function () {
      const { credit, alice } = await deployFixture();
      await submitData(credit, alice, 50_000n, 30_000n);

      const dummyPublicKey = ethers.id("alice-public-key") as `0x${string}`;
      const sealed = await credit.connect(alice).getScoreSealed(dummyPublicKey);
      expect(sealed).to.be.a("string").that.is.not.empty;
    });

    it("should return non-empty sealed credit limit for user with data", async function () {
      const { credit, alice } = await deployFixture();
      await submitData(credit, alice, 50_000n, 30_000n);

      const dummyPublicKey = ethers.id("alice-public-key") as `0x${string}`;
      const sealed = await credit.connect(alice).getCreditLimitSealed(dummyPublicKey);
      expect(sealed).to.be.a("string").that.is.not.empty;
    });
  });

  describe("Owner: Reveal Defaulter", function () {
    it("owner should be able to reveal a defaulter's score", async function () {
      const { credit, owner, alice } = await deployFixture();
      await submitData(credit, alice, 50_000n, 30_000n);

      // Owner reveals alice's score — privacy broken as deterrent
      const tx = await credit.connect(owner).revealDefaulter(alice.address);
      await tx.wait();

      // Event should have been emitted
      const events = await credit.queryFilter(
        credit.filters.DefaulterRevealed(alice.address)
      );
      expect(events.length).to.equal(1);
      expect(events[0].args.score).to.be.a("bigint");
    });

    it("non-owner cannot reveal a defaulter", async function () {
      const { credit, alice, bob } = await deployFixture();
      await submitData(credit, alice, 50_000n, 30_000n);

      await expect(
        credit.connect(bob).revealDefaulter(alice.address)
      ).to.be.reverted;
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Encrypt balance + income using cofhejs mock, returning inEuint64 structs
   * that the contract's submitFinancialData can accept.
   */
  async function encryptFinancialData(
    signer: any,
    contractAddress: string,
    balance: bigint,
    income: bigint
  ) {
    // cofhe-hardhat-plugin provides getFheTokens for mock encryption
    const fheTokens = await getFheTokens(hre, signer, contractAddress);

    const encryptedBalance = await fheTokens.encrypt64(balance);
    const encryptedIncome  = await fheTokens.encrypt64(income);

    return { encryptedBalance, encryptedIncome };
  }

  async function submitData(contract: any, signer: any, balance: bigint, income: bigint) {
    const { encryptedBalance, encryptedIncome } = await encryptFinancialData(
      signer,
      await contract.getAddress(),
      balance,
      income
    );
    const tx = await contract.connect(signer).submitFinancialData(encryptedBalance, encryptedIncome);
    await tx.wait();
  }
});
