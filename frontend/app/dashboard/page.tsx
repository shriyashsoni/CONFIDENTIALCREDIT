"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import WalletConnect from "@/components/WalletConnect";
import FinancialForm from "@/components/FinancialForm";
import EligibilityChecker from "@/components/EligibilityChecker";
import BorrowVault from "@/components/BorrowVault";

export default function DashboardPage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      {/* Navbar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 40px",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
        background: "rgba(5, 11, 20, 0.9)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-primary)",
          }}
        >
          <div style={{ width: 16, height: 16, background: "#fff" }} />
          <span style={{ fontWeight: 800, fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Confidential<span style={{ color: "var(--text-muted)" }}>Credit</span>
          </span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {address && (
            <div style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontFamily: "'JetBrains Mono', monospace",
              display: "none",
            }}
            className="desktop-only">
              {address.slice(0,6)}…{address.slice(-4)}
            </div>
          )}
          <span className="badge" style={{ fontSize: "0.65rem" }}>Arbitrum Sepolia</span>
          <WalletConnect />
        </div>
      </nav>

      {/* Main dashboard content */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Page header */}
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontWeight: 900, fontSize: "1.8rem", letterSpacing: "-0.02em", marginBottom: 8 }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Encrypt your financial data, compute a private credit score, and borrow without collateral.
          </p>
        </div>

        {!isConnected ? (
          /* Not connected CTA */
          <div className="glass-card" style={{ padding: "60px 40px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
            <div style={{ width: 48, height: 48, border: "2px solid #fff", margin: "0 auto 20px" }} className="float-anim" />
            <h2 style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: 12 }}>
              Connect Your Wallet
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 28, fontSize: "0.9rem" }}>
              Connect MetaMask on Arbitrum Sepolia to access the confidential credit protocol.
            </p>
            <WalletConnect />
          </div>
        ) : (
          /* 3-step workflow */
          <div>
            {/* Progress indicator */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0",
              marginBottom: "32px",
              overflow: "hidden",
            }}>
              {[
                { num: 1, label: "Encrypt & Submit", done: scoreSubmitted },
                { num: 2, label: "Check Eligibility", done: false },
                { num: 3, label: "Borrow / Repay",   done: false },
              ].map((s, i) => (
                <div key={s.num} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "0px",
                      background: s.done ? "#ffffff" : "#000000",
                      border: `1px solid ${s.done ? "#ffffff" : "var(--border)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: s.done ? "#000000" : "var(--text-muted)",
                      flexShrink: 0,
                      transition: "all 0.3s",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {s.done ? "✓" : s.num}
                    </div>
                    <span style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: s.done ? "#ffffff" : "var(--text-muted)",
                      display: "block",
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div style={{
                      flex: 1,
                      height: 1,
                      background: "var(--border)",
                      margin: "0 12px",
                    }} />
                  )}
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* Left column: Submit + Eligibility */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <FinancialForm onScoreSubmitted={() => setScoreSubmitted(true)} />
                <EligibilityChecker />
              </div>

              {/* Right column: Vault */}
              <div>
                <BorrowVault />
              </div>
            </div>

            {/* Info panel */}
            <div className="glass-card" style={{ padding: "20px 24px", marginTop: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: "1.4rem" }}>ℹ️</span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Privacy Guarantee</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace" }}>
                    Your balance and income are <strong style={{ color: "#ffffff" }}>encrypted client-side with FHE</strong> before
                    being submitted. The Fhenix CoFHE coprocessor computes your score on ciphertext —
                    no node, validator, or observer ever sees your raw financial data.
                    Only a single bit (Eligible / Not Eligible) is ever decrypted publicly.
                    You can view your own score privately using the sealed output feature.
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
