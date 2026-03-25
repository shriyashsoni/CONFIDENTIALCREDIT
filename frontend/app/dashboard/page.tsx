"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import WalletConnect from "@/components/WalletConnect";
import FinancialForm from "@/components/FinancialForm";
import EligibilityChecker from "@/components/EligibilityChecker";
import BorrowVault from "@/components/BorrowVault";
import { CONTRACTS, CREDIT_ABI, VAULT_ABI } from "@/lib/contracts";

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);

  // Read on-chain states to drive the progress bar dynamically
  const { data: hasScoreOnChain } = useReadContract({
    address: CONTRACTS.credit,
    abi: CREDIT_ABI,
    functionName: "hasScore",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: loanData } = useReadContract({
    address: CONTRACTS.vault,
    abi: VAULT_ABI,
    functionName: "getLoanDetails",
    args: [address!],
    query: { enabled: !!address },
  });

  const step1Done = !!hasScoreOnChain || scoreSubmitted;
  const activeLoan = loanData ? (loanData as any)[3] as boolean : false;
  const step3Done = activeLoan;
  const step2Done = step3Done || eligibilityChecked; // If they borrowed, they checked.

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, backgroundColor: "#02040a" }}>
      {/* Premium Background Effects */}
      <div className="glow-orb" style={{ top: "-10%", left: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)" }} />
      <div className="glow-orb" style={{ top: "40%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(0,0,0,0) 70%)" }} />
      
      {/* Modern Navbar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 48px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(2, 4, 10, 0.7)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
      }}>
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#ffffff",
          }}
        >
          <div style={{ width: 24, height: 24, background: "linear-gradient(135deg, #ffffff, #a3a3a3)", borderRadius: "4px", boxShadow: "0 0 15px rgba(255,255,255,0.3)" }} />
          <span style={{ fontWeight: 900, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Confidential<span style={{ color: "#64748b" }}>Credit</span>
          </span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <WalletConnect />
        </div>
      </nav>

      {/* Main dashboard content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 24px" }}>
        {/* Page header */}
        <div style={{ marginBottom: "48px", position: "relative" }}>
          <h1 style={{ fontWeight: 900, fontSize: "2.5rem", letterSpacing: "-0.03em", marginBottom: 12, background: "linear-gradient(to right, #ffffff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Credit Dashboard
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "1.05rem", maxWidth: "600px", lineHeight: 1.6 }}>
            Encrypt your financial data, compute a private credit score within the FHE coprocessor, and unlock undercollateralized borrowing power.
          </p>
        </div>

        {!isConnected ? (
          /* Not connected CTA */
          <div style={{ 
            padding: "80px 40px", 
            textAlign: "center", 
            maxWidth: 560, 
            margin: "0 auto",
            background: "rgba(10, 15, 30, 0.4)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)" }} />
            
            <div style={{ width: 64, height: 64, borderRadius: "16px", background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.2)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }} className="float-anim">
              🔐
            </div>
            <h2 style={{ fontWeight: 900, fontSize: "1.8rem", marginBottom: 16 }}>
              Unlock Your Credit Power
            </h2>
            <p style={{ color: "#94a3b8", marginBottom: 36, fontSize: "1rem", lineHeight: 1.6 }}>
              Connect your Web3 wallet on the <strong style={{ color: "#fff" }}>Arbitrum Sepolia</strong> network to access the world's first fully confidential lending protocol.
            </p>
            <WalletConnect />
          </div>
        ) : (
          /* 3-step workflow */
          <div className="fade-in-up">
            {/* Premium Progress Indicator */}
            <div style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "48px",
              background: "rgba(255,255,255,0.02)",
              padding: "20px 32px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
            }}>
              {[
                { num: 1, label: "Encrypt & Submit", done: step1Done, icon: "🛡️" },
                { num: 2, label: "Check Eligibility", done: step2Done, icon: "📊" },
                { num: 3, label: "Borrow / Repay",   done: step3Done, icon: "🏦" },
              ].map((s, i) => (
                <div key={s.num} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      background: s.done ? "linear-gradient(135deg, #ffffff, #d1d5db)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${s.done ? "#ffffff" : "rgba(255,255,255,0.1)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      color: s.done ? "#000000" : "#94a3b8",
                      boxShadow: s.done ? "0 0 20px rgba(255,255,255,0.2)" : "none",
                      transition: "all 0.4s ease",
                    }}>
                      {s.done ? "✓" : s.num}
                    </div>
                    <div>
                      <span style={{ fontSize: "0.7rem", color: s.done ? "#cbd5e1" : "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, display: "block", marginBottom: 2 }}>
                        Step 0{s.num}
                      </span>
                      <span style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: s.done ? "#ffffff" : "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                  {i < 2 && (
                    <div style={{
                      flex: 1,
                      height: 2,
                      background: s.done ? "linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.1))" : "rgba(255,255,255,0.05)",
                      margin: "0 24px",
                      borderRadius: "2px"
                    }} />
                  )}
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "32px" }}>
              {/* Left column: Submit + Eligibility */}
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                <div style={{ padding: "32px", background: "rgba(10, 15, 30, 0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", backdropFilter: "blur(12px)" }}>
                  <FinancialForm onScoreSubmitted={() => setScoreSubmitted(true)} />
                </div>
                <div style={{ padding: "32px", background: "rgba(10, 15, 30, 0.4)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", backdropFilter: "blur(12px)" }}>
                  <EligibilityChecker onChecked={() => setEligibilityChecked(true)} />
                </div>
              </div>

              {/* Right column: Vault */}
              <div style={{ padding: "32px", background: "linear-gradient(180deg, rgba(10, 15, 30, 0.6) 0%, rgba(5, 7, 15, 0.8) 100%)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}>
                <BorrowVault />
              </div>
            </div>

            {/* Premium Info panel */}
            <div style={{ 
              padding: "24px 32px", 
              marginTop: "48px",
              background: "linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))",
              border: "1px solid rgba(139, 92, 246, 0.2)",
              borderRadius: "16px",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "4px", bottom: 0, background: "linear-gradient(180deg, #3b82f6, #8b5cf6)" }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                  🛡️
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: 6, color: "#fff" }}>Hardware-Level Privacy Guarantee</div>
                  <div style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.7 }}>
                    Your balance and income are <strong style={{ color: "#c084fc" }}>encrypted client-side (FHE)</strong> before leaving your browser. 
                    The Fhenix CoFHE coprocessor computes your score solely on ciphertext. 
                    Zero knowledge of your personal wealth is ever exposed to nodes, validators, or the blockchain ledger.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
