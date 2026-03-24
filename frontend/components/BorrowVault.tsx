"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS, VAULT_ABI, USDC_ABI, LOAN_TIERS } from "@/lib/contracts";

export default function BorrowVault() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [borrowAmount, setBorrowAmount] = useState("");
  const [step, setStep] = useState<"idle" | "approving" | "borrowing" | "repaying" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Read loan details
  const { data: loanData, refetch: refetchLoan } = useReadContract({
    address: CONTRACTS.vault,
    abi: VAULT_ABI,
    functionName: "getLoanDetails",
    args: [address!],
    query: { enabled: !!address },
  });

  // Read USDC balance
  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.usdc,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });

  // Read USDC allowance for vault
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.usdc,
    abi: USDC_ABI,
    functionName: "allowance",
    args: [address!, CONTRACTS.vault],
    query: { enabled: !!address },
  });

  // Read REAL Vault Liquidity
  const { data: vaultLiquidityData, refetch: refetchVaultLiquidity } = useReadContract({
    address: CONTRACTS.usdc,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [CONTRACTS.vault],
  });

  const activeLoan = loanData
    ? {
        principal: (loanData as any)[0] as bigint,
        interest:  (loanData as any)[1] as bigint,
        dueDate:   (loanData as any)[2] as bigint,
        active:    (loanData as any)[3] as boolean,
      }
    : null;

  const handleBorrow = async () => {
    if (!address || !borrowAmount) return;
    setErrorMsg("");

    const amountParsed = parseUnits(borrowAmount, 6);

    try {
      setStep("borrowing");
      const hash = await writeContractAsync({
        address: CONTRACTS.vault,
        abi: VAULT_ABI,
        functionName: "borrow",
        args: [amountParsed],
        gas: BigInt(5_000_000), // Hardcoded gas override for FHE ops (RPC underestimate fix)
      });
      
      // Wait for it to be statically mined!
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setStep("done"); 
      await refetchLoan();
      await refetchBalance();
    } catch (err: any) {
      setStep("error");
      const reason = err?.message?.includes("Credit score insufficient")
        ? "❌ Credit score insufficient for this loan amount. Try a smaller amount or improve your score."
        : err?.message?.includes("Active loan exists")
        ? "❌ You already have an active loan. Repay it first."
        : err?.shortMessage || err?.message || "Transaction failed";
      setErrorMsg(reason);
    }
  };

  const handleRepay = async () => {
    if (!address || !activeLoan) return;
    setErrorMsg("");

    const total = activeLoan.principal + activeLoan.interest;

    try {
      // Step 1: Approve USDC spending if needed
      if ((usdcAllowance as bigint ?? BigInt(0)) < total) {
        setStep("approving");
        const approveTx = await writeContractAsync({
          address: CONTRACTS.usdc,
          abi: USDC_ABI,
          functionName: "approve",
          args: [CONTRACTS.vault, total],
          gas: BigInt(1_000_000), // Override standard estimate
        });
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash: approveTx });
        await refetchAllowance();
      }

      // Step 2: Repay Loan!
      setStep("repaying");
      const hash = await writeContractAsync({
        address: CONTRACTS.vault,
        abi: VAULT_ABI,
        functionName: "repay",
        gas: BigInt(2_000_000),
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      
      setStep("done");
      await refetchLoan();
      await refetchBalance();
    } catch (err: any) {
      setStep("error");
      setErrorMsg(err?.shortMessage || err?.message || "Repayment failed");
    }
  };

  const isLoading = ["approving", "borrowing", "repaying"].includes(step);

  if (!isConnected) return null;

  return (
    <div className="glass-card" style={{ padding: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <span style={{ fontSize: "1.4rem" }}>🔳</span>
        <h2 className="section-title">Confidential Vault</h2>
        <span className="badge">No Collateral</span>
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px",
        marginBottom: "12px",
      }}>
        {[
          { label: "Vault Liquidity", value: vaultLiquidityData !== undefined ? parseFloat(formatUnits(vaultLiquidityData as bigint, 6)).toLocaleString() : "Loading...", unit: "mUSDC", color: vaultLiquidityData === BigInt(0) ? "#ef4444" : "#ffffff" },
          { label: "Max Loan (T3)",   value: "2,000",  unit: "mUSDC", color: "#aaaaaa" },
          { label: "Interest Rate",   value: "5%",     unit: "flat",  color: "#cccccc" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "14px",
              background: "#050505",
              border: "1px solid var(--border)",
              borderRadius: "0px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace" }}>
              {s.label}
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>
              {s.value}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Tier quick reference */}
      <div style={{ marginBottom: "24px" }}>
        <div className="input-label" style={{ marginBottom: 10 }}>Loan Tiers (based on FHE score)</div>
        {LOAN_TIERS.map((t) => (
          <div
            key={t.tier}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              marginBottom: 6,
              borderRadius: 8,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "0.88rem", fontFamily: "'JetBrains Mono', monospace" }}>
              Tier {t.tier} — {t.label}
            </span>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontFamily: "'JetBrains Mono', monospace" }}>
              Up to ${t.maxLoan.toLocaleString()} mUSDC
            </span>
          </div>
        ))}
      </div>

      {vaultLiquidityData === BigInt(0) && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          ⚠ The lending vault currently has 0 liquidity. Please contact the protocol owner to fund the vault.
        </div>
      )}

      {/* Borrow form — only shown if no active loan */}
      {!activeLoan?.active ? (
        <>
          <div style={{ marginBottom: "18px" }}>
            <label className="input-label" htmlFor="borrow-amount">
              Borrow Amount (mUSDC)
            </label>
            <input
              id="borrow-amount"
              className="input-field"
              type="number"
              placeholder="e.g. 500"
              value={borrowAmount}
              onChange={(e) => { setBorrowAmount(e.target.value); setStep("idle"); }}
              min="1"
              max="2000"
              disabled={isLoading}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 5, marginBottom: 12 }}>
              No collateral required — eligibility determined by your FHE credit score
            </div>

            {/* Quick Amount Buttons */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {[500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { setBorrowAmount(amt.toString()); setStep("idle"); }}
                  style={{
                    flex: 1,
                    padding: "6px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  ${amt} Max
                </button>
              ))}
            </div>
          </div>

          {step === "error" && errorMsg && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              {errorMsg}
            </div>
          )}
          {step === "done" && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              ✅ Loan disbursed! Check your mUSDC balance.
            </div>
          )}

          <button
            id="borrow-btn"
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={handleBorrow}
            disabled={isLoading || !borrowAmount}
          >
            {isLoading && <span className="spinner" />}
            {step === "borrowing" ? "Confirming…" : "Borrow (No Collateral)"}
          </button>

          {usdcBalance !== undefined && (
            <div style={{ marginTop: 12, fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
              Your mUSDC balance: <strong style={{ color: "#ffffff", fontFamily: "'JetBrains Mono', monospace" }}>
                ${formatUnits(usdcBalance as bigint, 6)}
              </strong>
            </div>
          )}
        </>
      ) : (
        /* Repay panel */
        <div style={{
          padding: "20px",
          background: "#080808",
          border: "1px solid var(--border)",
          borderRadius: "0px",
        }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ffffff", marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>
            Active Loan — Repayment Required
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>Principal</div>
              <div style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1rem" }}>
                ${formatUnits(activeLoan.principal, 6)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>+ Interest</div>
              <div style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1rem", color: "#aaaaaa" }}>
                +${formatUnits(activeLoan.interest, 6)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase" }}>Total Due</div>
              <div style={{ fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1rem", color: "#ffffff" }}>
                ${formatUnits(activeLoan.principal + activeLoan.interest, 6)}
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 16, borderLeft: "2px solid #555", paddingLeft: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
            ⚠ Failure to repay by{" "}
            <strong style={{ color: "#ffffff" }}>
              {activeLoan.dueDate > BigInt(0)
                ? new Date(Number(activeLoan.dueDate) * 1000).toLocaleDateString()
                : "30 days from loan date"}
            </strong>{" "}
            will allow the protocol owner to{" "}
            <strong style={{ color: "#ffffff", textDecoration: "underline" }}>reveal your credit score</strong> and initiate legal action.
          </div>

          {step === "error" && errorMsg && (
            <div className="alert alert-error" style={{ marginBottom: 12 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              id="repay-btn"
              className="btn-primary"
              style={{ flex: 1 }}
              onClick={handleRepay}
              disabled={isLoading}
            >
              {isLoading && <span className="spinner" />}
              {step === "approving" ? "Approving USDC…"
                : step === "repaying" ? "Repaying…"
                : "Repay Loan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
