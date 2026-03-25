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

// Convert Uint8Array to hex string for viem compatibility
function bufToHex(buf: Uint8Array | string): `0x${string}` {
  if (typeof buf === "string") return (buf.startsWith("0x") ? buf : `0x${buf}`) as `0x${string}`;
  return ("0x" + Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;
}

/**
 * Encrypt balance and income values using cofhejs.
 */
export async function encryptFinancialData(
  provider: BrowserProvider,
  contractAddress: string,
  balance: bigint,
  income: bigint
): Promise<EncryptedFinancialData> {
  try {
    const { cofhejs, FheTypes } = await import("cofhejs/web");

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

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
        data: bufToHex(balResult?.data ?? balResult?.ctHash ?? new Uint8Array()),
        securityZone: balResult?.securityZone ?? 0,
      },
      encIncome: {
        data: bufToHex(incResult?.data ?? incResult?.ctHash ?? new Uint8Array()),
        securityZone: incResult?.securityZone ?? 0,
      },
    };
  } catch (err: any) {
    console.error("cofhejs encryption failed:", err);
    throw new Error(`Encryption failed: ${err?.message ?? "Check browser console for details."}`);
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
