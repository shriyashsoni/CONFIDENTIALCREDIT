"use client";
import Footer from "@/components/Footer";
import WalletConnect from "@/components/WalletConnect";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff" }}>
      {/* Navbar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 48px",
        borderBottom: "1px solid #1a1a1a",
        background: "#000",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 20, height: 20, background: "#fff" }} />
          <Link href="/" style={{ textDecoration: "none", color: "#fff" }}>
            <span style={{
              fontWeight: 900,
              fontSize: "1.1rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              CONFIDENTIAL<span style={{ color: "#555" }}>CREDIT</span>
            </span>
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link href="/whitepaper" style={{ color: "#555", fontSize: "0.8rem", textDecoration: "none", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", transition: "color 0.2s" }} onMouseOver={(e) => (e.currentTarget.style.color = "#fff")} onMouseOut={(e) => (e.currentTarget.style.color = "#555")}>WHITEPAPER</Link>
          <WalletConnect />
        </div>
      </nav>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "100px 48px 120px" }}>
        <h1 style={{
          fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          marginBottom: 40,
        }}>
          REDEFINING <span style={{ color: "#444" }}>TRUST</span><br/>IN DEFI.
        </h1>

        <div style={{
          width: 60,
          height: 4,
          background: "#fff",
          marginBottom: 60,
        }} />

        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 24, fontFamily: "'JetBrains Mono', monospace" }}>
            THE PROBLEM: CAPITAL INEFFICIENCY
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#888", lineHeight: 1.8, marginBottom: 24 }}>
            In traditional DeFi lending, collateral is king. If you want to borrow $1,000, you must lock $1,500 of Ethereum in a smart contract. This inherently neuters the power of decentralized finance, turning it into a playground for the wealthy rather than an engine for global credit.
          </p>
          <p style={{ fontSize: "1.1rem", color: "#888", lineHeight: 1.8 }}>
            Without centralized credit bureaus, DeFi struggled to create undercollateralized loans because proving repayment ability required revealing your entire financial history to a public ledger. Absolute transparency ruined privacy.
          </p>
        </section>

        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 24, fontFamily: "'JetBrains Mono', monospace" }}>
            THE SOLUTION: FHE PRIVACY
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#888", lineHeight: 1.8, marginBottom: 24 }}>
            Enter Fully Homomorphic Encryption (FHE). Using the Fhenix network, we encrypt your financial data (bank balance, income) client-side before it ever reaches the blockchain. The Fhenix coprocessor runs the credit scoring algorithm directly on the <strong style={{color:"#fff"}}>encrypted ciphertext</strong>.
          </p>
          <p style={{ fontSize: "1.1rem", color: "#888", lineHeight: 1.8 }}>
            A validator never sees your real net worth. The smart contract never stores your balance. The protocol only receives a cryptographic boolean: <code style={{background:"#111", padding:"4px 8px", border:"1px solid #333"}}>isEligible = true</code>. 
          </p>
        </section>

        <section style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 24, fontFamily: "'JetBrains Mono', monospace" }}>
            ACCOUNTABLE ANONYMITY
          </h2>
          <div style={{ background: "#050505", border: "1px solid #222", padding: "40px", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "#fff" }} />
            <p style={{ fontSize: "1.1rem", color: "#aaa", lineHeight: 1.8, fontStyle: "italic" }}>
              "Privacy is a fundamental right, but it must be earned through accountability in financial systems."
            </p>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.8, marginTop: 24 }}>
              To protect the protocol liquidity, Confidential Credit uses a De-Anon mechanism. As a borrower, your data remains fully private as long as your loans are in good standing. Failure to repay past the deadline grants the protocol the right to decrypt your credit score output as a penalty and initiate trust reduction.
            </p>
          </div>
        </section>

      </main>
      
      <Footer />
    </div>
  );
}
