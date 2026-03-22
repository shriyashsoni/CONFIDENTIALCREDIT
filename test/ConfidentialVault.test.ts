import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getFheTokens } from "cofhe-hardhat-plugin";

describe("ConfidentialVault", function () {
  async function deployAll() {
    const [owner, alice, bob] = await ethers.getSigners();

    // Deploy MockUSDC
    const UsdcFactory = await ethers.getContractFactory("MockUSDC");
    const usdc = await UsdcFactory.deploy();
    await usdc.waitForDeployment();

    // Deploy ConfidentialCredit
    const CreditFactory = await ethers.getContractFactory("ConfidentialCredit");
    const credit = await CreditFactory.deploy();
    await credit.waitForDeployment();

    // Deploy ConfidentialVault
    const VaultFactory = await ethers.getContractFactory("ConfidentialVault");
    const vault = await VaultFactory.deploy(
      await credit.getAddress(),
      await usdc.getAddress()
    );
    await vault.waitForDeployment();

    // Link vault to credit contract
    await credit.setVault(await vault.getAddress());

    // Mint 100,000 mUSDC to vault (owner mints, then approves + funds)
    const vaultFund = ethers.parseUnits("100000", 6);
    await usdc.mint(owner.address, vaultFund);
    await usdc.approve(await vault.getAddress(), vaultFund);
    await vault.fundVault(vaultFund);

    return { credit, vault, usdc, owner, alice, bob };
  }

  async function submitHighScore(credit: any, signer: any) {
    // Score = 500000*6 + 400000*4 = 3000000 + 1600000 = 4600000
    // → above TIER1 (3M), TIER2 (6M) threshold? No, 4.6M < 6M, so tier1+2 eligible
    // To hit tier 3 (9M): balance=800000, income=600000 → 4800000+2400000=7200000 (still <9M)
    // For tier3: balance=1000000, income=750000 → 6000000+3000000=9000000 ≥ 9M ✓
    const fheTokens = await getFheTokens(hre, signer, await credit.getAddress());
    const encBal = await fheTokens.encrypt64(1_000_000n);
    const encInc = await fheTokens.encrypt64(750_000n);
    await (await credit.connect(signer).submitFinancialData(encBal, encInc)).wait();
  }

  async function submitLowScore(credit: any, signer: any) {
    // Score = 100*6 + 50*4 = 800 → below all tiers
    const fheTokens = await getFheTokens(hre, signer, await credit.getAddress());
    const encBal = await fheTokens.encrypt64(100n);
    const encInc = await fheTokens.encrypt64(50n);
    await (await credit.connect(signer).submitFinancialData(encBal, encInc)).wait();
  }

  describe("Tier 1 Borrow", function () {
    it("eligible user can borrow up to 500 mUSDC (Tier 1)", async function () {
      const { credit, vault, usdc, alice } = await deployAll();
      await submitHighScore(credit, alice);

      const borrowAmount = ethers.parseUnits("500", 6);
      await vault.connect(alice).borrow(borrowAmount);

      const loan = await vault.loans(alice.address);
      expect(loan.active).to.equal(true);
      expect(loan.principal).to.equal(borrowAmount);
      expect(await usdc.balanceOf(alice.address)).to.equal(borrowAmount);
    });
  });

  describe("Tier 3 Borrow", function () {
    it("high-score user can borrow up to 2000 mUSDC (Tier 3)", async function () {
      const { credit, vault, usdc, alice } = await deployAll();
      await submitHighScore(credit, alice);

      const borrowAmount = ethers.parseUnits("2000", 6);
      await vault.connect(alice).borrow(borrowAmount);

      expect((await vault.loans(alice.address)).active).to.equal(true);
    });
  });

  describe("Ineligible borrow", function () {
    it("ineligible user cannot borrow", async function () {
      const { credit, vault, bob } = await deployAll();
      await submitLowScore(credit, bob);

      const borrowAmount = ethers.parseUnits("500", 6);
      await expect(
        vault.connect(bob).borrow(borrowAmount)
      ).to.be.revertedWith("Credit score insufficient for requested amount");
    });

    it("user without score cannot borrow", async function () {
      const { vault, bob } = await deployAll();
      await expect(
        vault.connect(bob).borrow(ethers.parseUnits("100", 6))
      ).to.be.reverted;
    });
  });

  describe("Repay", function () {
    it("borrower can repay loan with 5% interest", async function () {
      const { credit, vault, usdc, alice, owner } = await deployAll();
      await submitHighScore(credit, alice);

      const borrowAmount = ethers.parseUnits("500", 6);
      await vault.connect(alice).borrow(borrowAmount);

      // Fund alice with enough for repayment (principal + 5% interest)
      const interest = (borrowAmount * 500n) / 10_000n;
      const totalRepay = borrowAmount + interest;
      await usdc.mint(alice.address, interest); // alice already has principal
      await usdc.connect(alice).approve(await vault.getAddress(), totalRepay);

      await vault.connect(alice).repay();

      const loan = await vault.loans(alice.address);
      expect(loan.active).to.equal(false);
      expect(loan.principal).to.equal(0n);
    });
  });

  describe("Liquidation", function () {
    it("owner can liquidate an overdue loan and reveal defaulter's score", async function () {
      const { credit, vault, alice, owner } = await deployAll();
      await submitHighScore(credit, alice);

      await vault.connect(alice).borrow(ethers.parseUnits("500", 6));

      // Advance time by 31 days
      await time.increase(31 * 24 * 60 * 60);

      await expect(vault.connect(owner).liquidate(alice.address))
        .to.emit(vault, "LoanLiquidated")
        .withArgs(alice.address, ethers.parseUnits("500", 6), /* score: any */ undefined);

      const loan = await vault.loans(alice.address);
      expect(loan.active).to.equal(false);
    });

    it("owner cannot liquidate before 30 days", async function () {
      const { credit, vault, alice, owner } = await deployAll();
      await submitHighScore(credit, alice);
      await vault.connect(alice).borrow(ethers.parseUnits("500", 6));

      await expect(
        vault.connect(owner).liquidate(alice.address)
      ).to.be.revertedWith("Loan period not yet expired");
    });

    it("non-owner cannot liquidate", async function () {
      const { credit, vault, alice, bob } = await deployAll();
      await submitHighScore(credit, alice);
      await vault.connect(alice).borrow(ethers.parseUnits("500", 6));
      await time.increase(31 * 24 * 60 * 60);

      await expect(
        vault.connect(bob).liquidate(alice.address)
      ).to.be.reverted;
    });
  });

  describe("Cannot double-borrow", function () {
    it("borrower with active loan cannot borrow again", async function () {
      const { credit, vault, alice } = await deployAll();
      await submitHighScore(credit, alice);
      await vault.connect(alice).borrow(ethers.parseUnits("100", 6));

      await expect(
        vault.connect(alice).borrow(ethers.parseUnits("100", 6))
      ).to.be.revertedWith("Active loan exists — repay first");
    });
  });
});
