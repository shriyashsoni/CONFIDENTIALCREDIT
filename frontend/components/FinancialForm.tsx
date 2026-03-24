"use client";

import { useState } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { BrowserProvider } from "ethers";
import { CONTRACTS, CREDIT_ABI } from "@/lib/contracts";
import { encryptFinancialData } from "@/lib/fhe";

interface Props {
  onScoreSubmitted: () => void;
}

export default function FinancialForm({ onScoreSubmitted }: Props) {
  const { address, isConnected, connector } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [balance, setBalance] = useState("");
  const [income,  setIncome]  = useState("");
  const [status,  setStatus]  = useState<"idle" | "encrypting" | "submitting" | "confirming" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !balance || !income || !connector) return;

    try {
      // Step 1: Encrypt locally
      setStatus("encrypting");
      setErrorMsg("");

      const balanceBig = BigInt(Math.round(parseFloat(balance)));
      const incomeBig  = BigInt(Math.round(parseFloat(income)));

      if (balanceBig <= BigInt(0) || incomeBig <= BigInt(0)) {
        throw new Error("Values must be positive integers");
      }

      const rawProvider = await connector.getProvider();
      if (!rawProvider) throw new Error("No wallet provider found. Please reconnect your wallet.");
      const ethersProvider = new BrowserProvider(rawProvider as any);
      
      const encrypted = await encryptFinancialData(
        ethersProvider,
        CONTRACTS.credit,
        balanceBig,
        incomeBig
      );

      // Step 2: Submit ciphertext to chain via wallet popup
      setStatus("submitting");

      const hash = await writeContractAsync({
        address: CONTRACTS.credit,
        abi: CREDIT_ABI,
        functionName: "submitFinancialData",
        args: [encrypted.encBalance, encrypted.encIncome],
        gas: BigInt(8_000_000), // Massive explicit limit to satisfy Fhenix CoFHE block boundaries
      });
      
      setStatus("confirming");

      // Wait for it to map on-chain!
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setStatus("done");
      onScoreSubmitted();

    } catch (err: any) {
      console.error("Submission error:", err);
      setStatus("error");
      setErrorMsg(err?.message || "An unknown error occurred");
    }
  };

  const isLoading = status === "encrypting" || status === "submitting";

  return (
    <div className="glass-card" style={{ padding: "28px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "1.4rem" }} className={isLoading ? "cipher-blink" : ""}>⬛</span>
          <h2 className="section-title">Submit Financial Data</h2>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
          Your data is <strong style={{ color: "#ffffff" }}>encrypted in your browser</strong> using
          FHE before it's sent. The raw numbers never leave your device.
        </p>
      </div>

      {/* How encryption works visual */}
      <div
        style={{
          background: "#050505",
          border: "1px solid var(--border)",
          borderRadius: "0px",
          padding: "14px 16px",
          marginBottom: "24px",
          fontSize: "0.82rem",
          fontFamily: "'JetBrains Mono', monospace",
          color: "var(--text-secondary)",
        }}
      >
        <div style={{ color: "var(--text-muted)", marginBottom: 6, fontSize: "0.75rem", fontFamily: "Inter", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>FHE Pipeline</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ color: "#ffffff" }}>$50,000</span>
          <span>→</span>
          <span style={{ color: "#aaaaaa", fontSize: "0.75rem" }}
                className={status === "encrypting" ? "cipher-blink" : ""}>
            encrypt()
          </span>
          <span>→</span>
          <span style={{ color: "#666666", fontSize: "0.72rem" }}>0x7f3a…bc92</span>
          <span>→</span>
          <span style={{ color: "#ffffff", fontSize: "0.75rem" }}>chain</span>
          <span style={{ color: "#ffffff", fontSize: "0.75rem", fontWeight: "bold" }}>✓ PRIVATE</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "18px" }}>
          <label className="input-label" htmlFor="balance-input">
            Monthly Bank Balance (USD)
          </label>
          <input
            id="balance-input"
            className="input-field"
            type="number"
            placeholder="e.g. 50000"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            min="1"
            required
            disabled={isLoading || !isConnected}
          />
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 5 }}>
            Score contribution: balance × 0.6
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label className="input-label" htmlFor="income-input">
            Average Monthly Income (USD)
          </label>
          <input
            id="income-input"
            className="input-field"
            type="number"
            placeholder="e.g. 30000"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            min="1"
            required
            disabled={isLoading || !isConnected}
          />
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 5 }}>
            Score contribution: income × 0.4
          </div>
        </div>

        {/* Status messages */}
        {status === "encrypting" && (
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            <span className="spinner" />
            <span>Encrypting your data locally with FHE… raw values never leave your browser.</span>
          </div>
        )}
        {status === "submitting" && (
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            <span className="spinner" />
            <span>Approve the transaction in your Wallet popup…</span>
          </div>
        )}
        {status === "confirming" && (
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            <span className="spinner" />
            <span>Transaction submitted! Waiting for the Arbitrum Sepolia network to successfully mine your FHE computations. This may take a few moments.</span>
          </div>
        )}
        {status === "done" && (
          <div className="alert alert-success" style={{ marginBottom: 16 }}>
            ✅ Encrypted data submitted! Your credit score has been computed privately on-chain.
          </div>
        )}
        {status === "error" && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            ⚠ {errorMsg}
          </div>
        )}

        {!isConnected && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            Connect your wallet to submit financial data.
          </div>
        )}

        <button
          id="submit-financial-btn"
          type="submit"
          className="btn-primary"
          style={{ width: "100%" }}
          disabled={status === "encrypting" || status === "submitting" || status === "confirming" || !isConnected || status === "done"}
        >
          {(status === "encrypting" || status === "submitting" || status === "confirming") && <span className="spinner" />}
          {status === "encrypting" ? "Encrypting…"
            : status === "submitting" ? "Awaiting Wallet Signature…"
            : status === "confirming" ? "Mining On-Chain…"
            : status === "done" ? "✓ Score Submitted"
            : "🔐 Encrypt & Submit"}
        </button>
      </form>
    </div>
  );
}
