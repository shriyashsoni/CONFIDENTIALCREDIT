import hre, { ethers } from "hardhat";
import { getFheTokens } from "cofhe-hardhat-plugin";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * End-to-end demo script demonstrating:
 *  1. User encrypts financial data locally → submits to ConfidentialCredit
 *  2. User checks eligibility (only bool returned)
 *  3. User borrows mUSDC from ConfidentialVault (no collateral!)
 *  4. User repays loan
 */
async function main() {
  const [owner, alice] = await ethers.getSigners();

  const creditAddress = process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS!;
  const vaultAddress  = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS!;
  const usdcAddress   = process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS!;

  if (!creditAddress || !vaultAddress || !usdcAddress) {
    throw new Error("Missing contract addresses in .env — run deploy.ts first");
  }

  const credit = await ethers.getContractAt("ConfidentialCredit", creditAddress);
  const vault  = await ethers.getContractAt("ConfidentialVault",  vaultAddress);
  const usdc   = await ethers.getContractAt("MockUSDC",           usdcAddress);

  console.log("═══════════════════════════════════════════════");
  console.log("  Confidential Credit — Interaction Demo");
  console.log(`  User: ${alice.address}`);
  console.log("═══════════════════════════════════════════════\n");

  // Step 1: Encrypt and submit financial data
  console.log("Step 1: Encrypting financial data client-side...");
  const fheTokens = await getFheTokens(hre, alice, creditAddress);
  const encBal = await fheTokens.encrypt64(500_000n);  // $500,000 balance
  const encInc = await fheTokens.encrypt64(200_000n);  // $200,000 income

  console.log("        → Raw values encrypted. Submitting ciphertext to contract...");
  const submitTx = await credit.connect(alice).submitFinancialData(encBal, encInc);
  await submitTx.wait();
  console.log("        ✓ Financial data submitted (encrypted on-chain)\n");

  // Step 2: Check eligibility
  console.log("Step 2: Checking eligibility for Tier 1 loan (minScore 3,000,000)...");
  const eligible = await credit.connect(alice).checkEligibility(3_000_000n);
  console.log(`        ✓ Eligible: ${eligible} (only YES/NO revealed — score stays private)\n`);

  if (!eligible) {
    console.log("User is not eligible. Exiting demo.");
    return;
  }

  // Step 3: Borrow
  const borrowAmount = ethers.parseUnits("500", 6); // 500 mUSDC
  console.log(`Step 3: Borrowing ${ethers.formatUnits(borrowAmount, 6)} mUSDC (no collateral)...`);
  const borrowTx = await vault.connect(alice).borrow(borrowAmount);
  await borrowTx.wait();
  const aliceBalance = await usdc.balanceOf(alice.address);
  console.log(`        ✓ Loan disbursed. Alice's mUSDC balance: ${ethers.formatUnits(aliceBalance, 6)}\n`);

  // Step 4: Repay
  console.log("Step 4: Repaying loan + 5% interest...");
  const interest = (borrowAmount * 500n) / 10_000n;
  const totalRepay = borrowAmount + interest;

  // Mint interest portion to alice for demo purposes
  await usdc.connect(owner).mint(alice.address, interest);
  await usdc.connect(alice).approve(vaultAddress, totalRepay);
  const repayTx = await vault.connect(alice).repay();
  await repayTx.wait();
  console.log(`        ✓ Repaid ${ethers.formatUnits(totalRepay, 6)} mUSDC (principal + interest)\n`);

  const loanAfter = await vault.loans(alice.address);
  console.log("═══════════════════════════════════════════════");
  console.log("  Demo Complete!");
  console.log(`  Loan active: ${loanAfter.active}`);
  console.log("═══════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
