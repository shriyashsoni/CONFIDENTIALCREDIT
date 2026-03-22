"use client";
import Footer from "@/components/Footer";
import WalletConnect from "@/components/WalletConnect";
import Link from "next/link";

export default function WhitepaperPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#111111", fontFamily: "'Inter', sans-serif" }}>
      {/* Light Navbar for whitepaper contrast */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 40px",
        borderBottom: "1px solid #e0e0e0",
        background: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 16, height: 16, background: "#111111" }} />
          <Link href="/" style={{ textDecoration: "none", color: "#111111" }}>
            <span style={{
              fontWeight: 900,
              fontSize: "1rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              CONFIDENTIAL<span style={{ color: "#888888" }}>CREDIT</span>
            </span>
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/about" style={{ color: "#666666", fontSize: "0.8rem", textDecoration: "none", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>ABOUT</Link>
          <div style={{ transform: "scale(0.9)", transformOrigin: "right" }}><WalletConnect /></div>
        </div>
      </nav>

      {/* Hero Header Area */}
      <header style={{
        background: "#f8f9fa",
        borderBottom: "1px solid #e0e0e0",
        padding: "80px 48px",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace", color: "#666666", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 24 }}>
          Whitepaper / V1.0 
        </div>
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          maxWidth: 900,
          margin: "0 auto",
          textTransform: "uppercase",
        }}>
          ZERO-KNOWLEDGE LENDING via FHE
        </h1>
        <p style={{
          fontSize: "1.2rem",
          color: "#555555",
          maxWidth: 700,
          margin: "24px auto 0",
          lineHeight: 1.6,
          fontFamily: "serif"
        }}>
          A technical exposition of Fully Homomorphic Encryption applied to undercollateralized decentralized credit systems on the Fhenix EVM.
        </p>
      </header>

      {/* Main Document Body */}
      <main style={{ maxWidth: 840, margin: "0 auto", padding: "80px 32px 120px" }}>
        
        {/* Abstract */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: 24, textTransform: "uppercase", borderBottom: "2px solid #111111", paddingBottom: 8, letterSpacing: "-0.02em" }}>
            Abstract
          </h2>
          <div style={{ fontFamily: "serif", fontSize: "1.15rem", lineHeight: 1.9, color: "#333333" }}>
            <p style={{ marginBottom: 24 }}>
              Current iterations of Decentralized Finance (DeFi) suffer from the "Overcollateralization Problem", severely restricting capital efficiency. While traditional finance handles undercollateralized lending via centralized credit bureaus operating in closed silos, replicating this on public blockchains mandates absolute exposure of sensitive personal financial history. This presents a critical zero-sum game between privacy and capital efficiency in Web3.
            </p>
            <p style={{ marginBottom: 24 }}>
              Through the deployment of <strong>Fully Homomorphic Encryption (FHE)</strong>, specifically referencing the `<span style={{fontFamily:"monospace", background:"#f1f1f1", padding:"2px 6px"}}>TFHE-rs</span>` specifications running atop the <strong>Fhenix Helium Coprocessor</strong>, this protocol resolves the zero-sum conflict. We introduce <strong>Confidential Credit</strong>: an open, permissionless system where algorithmic credit scoring is computed directly on immutable ciphertext—producing a deterministic "Eligibility boolean" without decrypting or exposing the underlying financial inputs.
            </p>
          </div>
        </section>

        {/* 1. Core Architecture */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: 24, textTransform: "uppercase", borderBottom: "2px solid #111111", paddingBottom: 8, letterSpacing: "-0.02em" }}>
            1. Core Architecture
          </h2>
          <div style={{ fontFamily: "serif", fontSize: "1.15rem", lineHeight: 1.9, color: "#333333" }}>
            <p style={{ marginBottom: 24 }}>
              The Confidential Credit Protocol architecture encompasses three distinct state channels: Client-Side Input, Fhenix Network Processing, and Vault Output.
            </p>
            
            <div style={{ background: "#fcfcfc", border: "1px solid #e0e0e0", padding: 24, marginBottom: 32 }}>
              <h4 style={{ fontFamily: "sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>1.1. Ingress & Client-Side Operations</h4>
              <p>
                Using the <code style={{background:"#f1f1f1", padding:"2px 6px", fontFamily:"monospace", fontSize:"0.95em"}}>fhenix.js</code> browser SDK, user financial variables (e.g. `Balance_&#123;USD&#125;`, `Income_&#123;Annual&#125;`) are mapped to unsigned 64-bit integers and encrypted locally. The transaction payload broadcast to the sequence layers contains entirely obfuscated ciphertext, masking both payload sizes and values against Mempool inspection.
              </p>
            </div>

            <div style={{ background: "#fcfcfc", border: "1px solid #e0e0e0", padding: 24, marginBottom: 32 }}>
              <h4 style={{ fontFamily: "sans-serif", fontSize: "1rem", fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>1.2. The On-Chain Cryptographic Coprocessor</h4>
              <p>
                The `ConfidentialCredit.sol` contract incorporates the standard `FHE.sol` wrapper provided by the network. The scoring engine evaluates the encrypted parameters linearly:
              </p>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", background: "#111111", color: "#ffffff", padding: "16px", margin: "16px 0", fontSize: "0.95rem" }}>
                Score<sub>[FHE]</sub> = (Balance<sub>[FHE]</sub> * Weight<sub>1</sub>) + (Income<sub>[FHE]</sub> * Weight<sub>2</sub>)<br/>
                Output = FHE.gte(Score<sub>[FHE]</sub>, Thresholds.Tier<sub>N</sub>)
              </div>
              <p>
                These arithmetic operations (`FHE.add`, `FHE.mul`, `FHE.gte`) are processed purely without prior decryption key access, leveraging TFHE gate bootstrapping.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Mathematical Proof of Correctness */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: 24, textTransform: "uppercase", borderBottom: "2px solid #111111", paddingBottom: 8, letterSpacing: "-0.02em" }}>
            2. Trust Assumptions & Execution Correctness
          </h2>
          <div style={{ fontFamily: "serif", fontSize: "1.15rem", lineHeight: 1.9, color: "#333333" }}>
            <p style={{ marginBottom: 24 }}>
              DeFi currently relies on ZK-Rollups (Zero-Knowledge) for scaling and localized privacy. However, ZK Proofs generally prove that a computation <em>knew</em> a hidden input, meaning the prover must securely hold the unencrypted data.
            </p>
            <p style={{ marginBottom: 24 }}>
              FHE fundamentally inverts this. The smart contract acts as a blind evaluator function `E()`. For any plaintext integers <em>x</em> and <em>y</em>, and encryption algorithm <em>Enc()</em>:
            </p>
            <div style={{ paddingLeft: 20, borderLeft: "4px solid #111111", margin: "0 0 24px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "#000000", fontSize: "1rem" }}>
                Dec( E( Enc(x), Enc(y) ) ) = x + y
              </div>
            </div>
            <p style={{ marginBottom: 24 }}>
              The output of the evaluation translates exclusively to an encrypted boolean indicating whether the user possesses adequate unencumbered capital to service a stablecoin loan. At no point is a central entity, relayer, or protocol owner capable of retrieving <em>x</em> or <em>y</em>.
            </p>
          </div>
        </section>

        {/* 3. The De-Anonymization Threat Vector (Default Mechanisms) */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, marginBottom: 24, textTransform: "uppercase", borderBottom: "2px solid #111111", paddingBottom: 8, letterSpacing: "-0.02em" }}>
            3. The De-Anonymization Threat Vector
          </h2>
          <div style={{ fontFamily: "serif", fontSize: "1.15rem", lineHeight: 1.9, color: "#333333" }}>
            <p style={{ marginBottom: 24 }}>
              Privacy in credit harbors inherent moral hazard. Absolute privacy guarantees encourage malignant default risk mapping. 
              Hence, <strong>Confidential Credit defines privacy not as an immutable right, but as a conditional privilege</strong> governed by programmable Smart Contract bounds.
            </p>
            <p style={{ marginBottom: 24 }}>
              While active and compliant loans obscure all inputs:
            </p>
            <ul style={{ paddingLeft: 24, marginBottom: 32 }}>
              <li style={{ marginBottom: 12 }}>If `block.timestamp &gt; Loan.dueDate` &amp;&amp; `Loan.status == UNPAID`</li>
              <li style={{ marginBottom: 12 }}>The Vault mechanism unlocks `adminDecryptOutput()` capabilities.</li>
              <li style={{ marginBottom: 12 }}>This converts the defaulting user's encrypted financial state into deterministic plaintext.</li>
            </ul>
            <p>
              This symmetric threat model effectively regulates undercollateralized markets natively without reliance on external bureaucratic enforcement agencies. 
            </p>
          </div>
        </section>

        {/* Footer info inside main content */}
        <div style={{ marginTop: 80, paddingTop: 40, borderTop: "1px solid #e0e0e0", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", color: "#666666" }}>
          Published: 2026 // Fhenix Helium Protocol // Trustless Credit Labs
        </div>

      </main>

      <Footer />
    </div>
  );
}
