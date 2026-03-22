import hre, { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function main() {
  const network = hre.network.name;
  const [deployer] = await ethers.getSigners();

  console.log("==================================================");
  console.log("  Confidential Credit Protocol — Deploy Script");
  console.log("==================================================");
  console.log(`  Network : ${network}`);
  console.log(`  Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance : ${ethers.formatEther(balance)} ETH`);
  console.log("==================================================\n");

  if (balance === 0n) {
    throw new Error("Deployer wallet has 0 ETH. Fund it first at https://sepoliafaucet.com");
  }

  // ── 1. Deploy MockUSDC ─────────────────────────────────────────────────
  console.log("1/4  Deploying MockUSDC...");
  const UsdcFactory = await ethers.getContractFactory("MockUSDC");
  const usdc = await UsdcFactory.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`     [OK] MockUSDC:           ${usdcAddress}`);

  // ── 2. Deploy ConfidentialCredit ─────────────────────────────────────
  console.log("2/4  Deploying ConfidentialCredit...");
  const CreditFactory = await ethers.getContractFactory("ConfidentialCredit");
  const credit = await CreditFactory.deploy();
  await credit.waitForDeployment();
  const creditAddress = await credit.getAddress();
  console.log(`     [OK] ConfidentialCredit: ${creditAddress}`);

  // ── 3. Deploy ConfidentialVault ───────────────────────────────────────
  console.log("3/4  Deploying ConfidentialVault...");
  const VaultFactory = await ethers.getContractFactory("ConfidentialVault");
  const vault = await VaultFactory.deploy(creditAddress, usdcAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`     [OK] ConfidentialVault:  ${vaultAddress}`);

  // ── 4. Link + Fund ────────────────────────────────────────────────────
  console.log("4/4  Linking vault and minting initial liquidity...");
  const linkTx = await credit.setVault(vaultAddress);
  await linkTx.wait();
  console.log("     [OK] Vault linked to ConfidentialCredit");

  const fundAmount = ethers.parseUnits("50000", 6); // 50,000 mUSDC
  await (await usdc.mint(deployer.address, fundAmount)).wait();
  await (await usdc.approve(vaultAddress, fundAmount)).wait();
  await (await vault.fundVault(fundAmount)).wait();
  console.log("     [OK] Vault funded with 50,000 mUSDC\n");

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("==================================================");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("==================================================");
  console.log(`  MockUSDC:           ${usdcAddress}`);
  console.log(`  ConfidentialCredit: ${creditAddress}`);
  console.log(`  ConfidentialVault:  ${vaultAddress}`);
  console.log("==================================================");

  // Write addresses to .env auto-update file
  const envUpdate = [
    `\n# Auto-updated by deploy script on ${new Date().toISOString()}`,
    `# Network: ${network}`,
    `NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=${usdcAddress}`,
    `NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS=${creditAddress}`,
    `NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS=${vaultAddress}`,
  ].join("\n");

  fs.writeFileSync(
    path.join(__dirname, "../deployed-addresses.txt"),
    `# Deployed on ${network} at ${new Date().toISOString()}\n` +
    `MockUSDC=${usdcAddress}\n` +
    `ConfidentialCredit=${creditAddress}\n` +
    `ConfidentialVault=${vaultAddress}\n\n` +
    `# Add to frontend/.env.local:\n` +
    envUpdate
  );
  console.log("\n  Addresses saved to deployed-addresses.txt");

  // ── Etherscan Verification (only on live networks) ────────────────────
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\n  Waiting 15s for Etherscan to index the blocks...");
    await new Promise((r) => setTimeout(r, 15000));

    console.log("  Verifying contracts on Etherscan...\n");

    try {
      await hre.run("verify:verify", {
        address: usdcAddress,
        constructorArguments: [],
        contract: "contracts/MockUSDC.sol:MockUSDC",
      });
      console.log("  [OK] MockUSDC verified");
    } catch (e: any) {
      if (e.message?.includes("already verified")) {
        console.log("  [OK] MockUSDC already verified");
      } else {
        console.log("  [WARN] MockUSDC verification failed:", e.message);
      }
    }

    try {
      await hre.run("verify:verify", {
        address: creditAddress,
        constructorArguments: [],
        contract: "contracts/ConfidentialCredit.sol:ConfidentialCredit",
      });
      console.log("  [OK] ConfidentialCredit verified");
    } catch (e: any) {
      if (e.message?.includes("already verified")) {
        console.log("  [OK] ConfidentialCredit already verified");
      } else {
        console.log("  [WARN] ConfidentialCredit verification failed:", e.message);
      }
    }

    try {
      await hre.run("verify:verify", {
        address: vaultAddress,
        constructorArguments: [creditAddress, usdcAddress],
        contract: "contracts/ConfidentialVault.sol:ConfidentialVault",
      });
      console.log("  [OK] ConfidentialVault verified");
    } catch (e: any) {
      if (e.message?.includes("already verified")) {
        console.log("  [OK] ConfidentialVault already verified");
      } else {
        console.log("  [WARN] ConfidentialVault verification failed:", e.message);
      }
    }

    console.log("\n  View on Etherscan:");
    if (network === "sepolia") {
      console.log(`  MockUSDC:           https://sepolia.etherscan.io/address/${usdcAddress}`);
      console.log(`  ConfidentialCredit: https://sepolia.etherscan.io/address/${creditAddress}`);
      console.log(`  ConfidentialVault:  https://sepolia.etherscan.io/address/${vaultAddress}`);
    } else if (network === "arbitrumSepolia") {
      console.log(`  MockUSDC:           https://sepolia.arbiscan.io/address/${usdcAddress}`);
      console.log(`  ConfidentialCredit: https://sepolia.arbiscan.io/address/${creditAddress}`);
      console.log(`  ConfidentialVault:  https://sepolia.arbiscan.io/address/${vaultAddress}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n[FAILED]", err.message || err);
    process.exit(1);
  });
