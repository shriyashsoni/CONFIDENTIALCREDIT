"use client";

import { useState } from "react";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACTS, CREDIT_ABI, VAULT_ABI, LOAN_TIERS } from "@/lib/contracts";

// Tier to min score mapping (mirrors contract constants)
const TIER_SCORES: Record<number, bigint> = {
  1: BigInt(3000000),
  2: BigInt(6000000),
  3: BigInt(9000000),
};

export default function EligibilityChecker() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [checking, setChecking] = useState(false);
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(1);
  const [eligibilityResult, setEligibilityResult] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Read whether user has a score on-chain
  const { data: hasScore } = useReadContract({
    address: CONTRACTS.credit,
    abi: CREDIT_ABI,
    functionName: "hasScore",
    args: [address!],
    query: { enabled: !!address },
  });

  // Read active loan
  const { data: loanData } = useReadContract({
    address: CONTRACTS.vault,
    abi: VAULT_ABI,
    functionName: "getLoanDetails",
    args: [address!],
    query: { enabled: !!address },
  });

  const handleCheckEligibility = async () => {
    if (!address || !publicClient) return;
    setChecking(true);
    setEligibilityResult(null);
    setErrorMsg("");

    try {
      // Call checkEligibility as a view function directly via publicClient
      const minScore = TIER_SCORES[selectedTier];
      const eligible = await publicClient.readContract({
        address: CONTRACTS.credit,
        abi: CREDIT_ABI,
        functionName: "checkEligibility",
        args: [minScore],
        account: address,
      });
      setEligibilityResult(eligible as boolean);
    } catch (err: any) {
      // Extract revert reason if available
      const msg = err?.shortMessage || err?.message || "";
      if (msg.includes("No score") || msg.includes("hasScore")) {
        setErrorMsg("Submit your financial data first to compute your credit score.");
      } else {
        setErrorMsg("Could not read eligibility — try borrowing directly (contract will revert if ineligible).");
      }
    } finally {
      setChecking(false);
    }
  };

  if (!isConnected) return null;

  const activeLoan = loanData ? {
    principal: (loanData as any)[0] as bigint,
    interest:  (loanData as any)[1] as bigint,
    dueDate:   (loanData as any)[2] as bigint,
    active:    (loanData as any)[3] as boolean,
  } : null;

  return (
    <div className="glass-card" style={{ padding: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <span style={{ fontSize: "1.4rem" }}>📊</span>
        <h2 className="section-title">Credit Eligibility</h2>
        {hasScore && <span className="badge">Score on file</span>}
      </div>

      {!hasScore ? (
        <div className="alert alert-info">
          Submit your financial data first to compute your credit score.
        </div>
      ) : (
        <>
          {/* Tier selector */}
          <div style={{ marginBottom: "20px" }}>
            <div className="input-label" style={{ marginBottom: 12 }}>Select Loan Tier to Check</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {LOAN_TIERS.map((t) => (
                <button
                  key={t.tier}
                  id={`tier-${t.tier}-btn`}
                  onClick={() => { setSelectedTier(t.tier as 1|2|3); setEligibilityResult(null); setErrorMsg(""); }}
                  style={{
                    padding: "14px 8px",
                    borderRadius: "0px",
                    border: `1px solid ${selectedTier === t.tier ? "#ffffff" : "var(--border)"}`,
                    background: selectedTier === t.tier ? "#ffffff" : "transparent",
                    color: selectedTier === t.tier ? "#000000" : "var(--text-secondary)",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: 4, letterSpacing: "0.04em" }}>
                    TIER {t.tier}
                  </div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 800 }}>
                    ${t.maxLoan.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.7rem", opacity: selectedTier === t.tier ? 0.9 : 0.7 }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            id="check-eligibility-btn"
            className="btn-secondary"
            style={{ width: "100%", marginBottom: 16 }}
            onClick={handleCheckEligibility}
            disabled={checking}
          >
            {checking && <span className="spinner" />}
            {checking ? "Querying FHE coprocessor…" : "Check Eligibility (Private)"}
          </button>

          {/* Result */}
          {eligibilityResult !== null && (
            <div
              className={`alert ${eligibilityResult ? "alert-success" : "alert-error"}`}
              style={{ justifyContent: "center", textAlign: "center" }}
            >
              {eligibilityResult ? (
                <><strong>✅ Eligible!</strong> Your score qualifies for Tier {selectedTier} loans. No collateral required.</>
              ) : (
                <><strong>❌ Not Eligible</strong> for this tier. Submit better financial data or choose a lower tier.</>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-error" style={{ marginTop: 8 }}>
              {errorMsg}
            </div>
          )}

          {/* Active loan display */}
          {activeLoan?.active && (
            <>
              <div className="divider" />
              <div style={{
                padding: "16px",
                background: "#080808",
                border: "1px solid var(--border)",
                borderRadius: "0px",
              }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ffffff", marginBottom: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Active Loan
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Principal</div>
                    <div style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      ${formatUnits(activeLoan.principal, 6)} mUSDC
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Interest (5%)</div>
                    <div style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      ${formatUnits(activeLoan.interest, 6)} mUSDC
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Due Date</div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                      {activeLoan.dueDate > BigInt(0)
                        ? new Date(Number(activeLoan.dueDate) * 1000).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
