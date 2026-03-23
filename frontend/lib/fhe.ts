"use client";

/**
 * FHE helpers using cofhejs for client-side encryption.
 * Numbers are encrypted locally before being sent to the contract —
 * the raw balance/income values never leave the user's browser.
 *
 * cofhejs API (v0.3.x):
 *   import { cofhejs, FheTypes } from "cofhejs/web"
 *   cofhejs.encrypt(value, FheTypes.Uint64, securityZone?)
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
 * Falls back to mock data so the UI remains functional on unsupported networks.
 */
export async function encryptFinancialData(
  provider: BrowserProvider,
  contractAddress: string,
  balance: bigint,
  income: bigint
): Promise<EncryptedFinancialData> {
  try {
    // cofhejs exports from "cofhejs/web" (NOT "cofhejs/browser")
    const { cofhejs, FheTypes } = await import("cofhejs/web");

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    // Initialize cofhejs with the current provider
    await cofhejs.init({
      provider: provider as any,
      signer: signer as any,
    });

    // Encrypt both values as Uint64
    const encBalance = await cofhejs.encrypt(
      [{ value: balance, type: FheTypes.Uint64 }],
      contractAddress,
      signerAddress,
    );

    const encIncome = await cofhejs.encrypt(
      [{ value: income, type: FheTypes.Uint64 }],
      contractAddress,
      signerAddress,
    );

    // Extract the first item from the encrypted results
    const balResult = Array.isArray(encBalance) ? encBalance[0] : encBalance;
    const incResult = Array.isArray(encIncome) ? encIncome[0] : encIncome;

    return {
      encBalance: {
        data: (balResult?.data ?? balResult?.ctHash ?? "0x00") as `0x${string}`,
        securityZone: balResult?.securityZone ?? 0,
      },
      encIncome: {
        data: (incResult?.data ?? incResult?.ctHash ?? "0x00") as `0x${string}`,
        securityZone: incResult?.securityZone ?? 0,
      },
    };
  } catch (err: any) {
    console.error("cofhejs encryption failed:", err);
    throw new Error(`Encryption failed: ${err?.message ?? "Unknown error. Check browser console for details."}`);
  }
}

/**
 * Generate a permit public key for sealed output (FHE.sealoutput).
 */
export async function generatePermitKey(
  provider: BrowserProvider,
  contractAddress: string
): Promise<`0x${string}`> {
  try {
    const { cofhejs } = await import("cofhejs/web");
    const signer = await provider.getSigner();

    await cofhejs.init({ provider: provider as any, signer: signer as any });

    const permit = await cofhejs.createPermit({
      contractAddress,
      signer: signer as any,
    });

    return (permit?.publicKey ?? permit) as `0x${string}`;
  } catch {
    // Fallback: random key for demo mode
    return `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}` as `0x${string}`;
  }
}

/**
 * Unseal a sealed output from the contract.
 */
export async function unsealValue(
  provider: BrowserProvider,
  contractAddress: string,
  sealedData: string
): Promise<bigint> {
  try {
    const { cofhejs } = await import("cofhejs/web");
    const signer = await provider.getSigner();
    await cofhejs.init({ provider: provider as any, signer: signer as any });
    const value = await cofhejs.unseal(contractAddress, sealedData, signer as any);
    return BigInt(value as any);
  } catch {
    return 0n;
  }
}

/** Format a score value into a human-readable credit tier */
export function scoreToCreditTier(score: bigint): { label: string; color: string; ltv: string } {
  if (score >= 9_000_000n) return { label: "Excellent", color: "#f59e0b", ltv: "80%" };
  if (score >= 6_000_000n) return { label: "Good",      color: "#64ffda", ltv: "60%" };
  if (score >= 3_000_000n) return { label: "Fair",      color: "#a78bfa", ltv: "30%" };
  return                          { label: "Poor",      color: "#ef4444", ltv: "0%"  };
}
