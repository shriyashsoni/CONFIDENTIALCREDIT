"use client";

/**
 * FHE helpers using cofhejs for client-side encryption.
 * Numbers are encrypted locally before being sent to the contract —
 * the raw balance/income values never leave the user's browser.
 */

import { BrowserProvider } from "ethers";

export interface EncryptedInput {
  data: `0x${string}`;
  securityZone: number;
}

export interface EncryptedFinancialData {
  encBalance: EncryptedInput;
  encIncome:  EncryptedInput;
}

/**
 * Encrypt balance and income values using cofhejs.
 * Falls back to a demo mock if cofhejs is not available in browser (for preview).
 */
export async function encryptFinancialData(
  provider: BrowserProvider,
  contractAddress: string,
  balance: bigint,
  income: bigint
): Promise<EncryptedFinancialData> {
  try {
    // Dynamic import to avoid SSR issues
    const { Encryptor } = await import("cofhejs/browser");
    const signer = await provider.getSigner();

    // Initialize encryptor with the contract address for permit binding
    const encryptor = new Encryptor(signer as any, contractAddress);

    const encBalance = await encryptor.encrypt(balance, "uint64");
    const encIncome  = await encryptor.encrypt(income,  "uint64");

    return {
      encBalance: { data: encBalance.data as `0x${string}`, securityZone: encBalance.securityZone ?? 0 },
      encIncome:  { data: encIncome.data  as `0x${string}`, securityZone: encIncome.securityZone  ?? 0 },
    };
  } catch (err: any) {
    console.error("cofhejs encryption failed:", err);
    throw new Error(`Encryption failed: ${err?.message || "Make sure cofhejs is supported on your network/wallet."}`);
  }
}

/**
 * Generate a permit public key for sealed output (FHE.sealoutput).
 * The key is derived from the user's wallet signature.
 */
export async function generatePermitKey(
  provider: BrowserProvider,
  contractAddress: string
): Promise<`0x${string}`> {
  try {
    const { PermitManager } = await import("cofhejs/browser");
    const signer = await provider.getSigner();
    const permit = await PermitManager.generatePermit(contractAddress, signer as any);
    return permit.publicKey as `0x${string}`;
  } catch {
    // Fallback: generate a random permit key for demo
    const randomKey = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}` as `0x${string}`;
    return randomKey;
  }
}

/**
 * Unseal a sealed output string from the contract (FHE.sealoutput result).
 * Decrypts client-side using the user's private key — nothing goes to a server.
 */
export async function unsealValue(
  provider: BrowserProvider,
  contractAddress: string,
  sealedData: string
): Promise<bigint> {
  try {
    const { PermitManager } = await import("cofhejs/browser");
    const signer = await provider.getSigner();
    const permit = await PermitManager.generatePermit(contractAddress, signer as any);
    const value = await PermitManager.unseal(sealedData, permit);
    return BigInt(value);
  } catch {
    // Fallback for demo mode
    return 0n;
  }
}

/** Format a score value into a human-readable credit tier */
export function scoreToCreditTier(score: bigint): { label: string; color: string; ltv: string } {
  if (score >= 9_000_000n) return { label: "Excellent",  color: "#f59e0b", ltv: "80%" };
  if (score >= 6_000_000n) return { label: "Good",       color: "#64ffda", ltv: "60%" };
  if (score >= 3_000_000n) return { label: "Fair",       color: "#a78bfa", ltv: "30%" };
  return                          { label: "Poor",       color: "#ef4444", ltv: "0%"  };
}
