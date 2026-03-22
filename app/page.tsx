"use client";

import WalletConnect from "@/components/WalletConnect";
import Footer from "@/components/Footer";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ── 3D Cylinder Carousel ──────────────────────────────────────
const slides = [
  {
    title: "ZERO KNOWLEDGE",
    desc: "Your balance & income are encrypted client-side. The FHE coprocessor computes your score on ciphertext — raw numbers never touch the chain.",
    tag: "TFHE Encryption",
  },
  {
    title: "ZERO COLLATERAL",
    desc: "Borrow without locking any assets. Your cryptographic credit score is your collateral.",
    tag: "Undercollateralized",
  },
  {
    title: "ABSOLUTE PRIVACY",
    desc: "Only a single bit is ever revealed: Eligible or Not Eligible. Nothing else is exposed to anyone.",
    tag: "1-bit Disclosure",
  },
  {
    title: "BUILT ON FHENIX",
    desc: "Powered by the Fhenix Helium CoFHE network. The first production-grade FHE L2 with on-chain encrypted computation.",
    tag: "Fhenix Helium",
  },
  {
    title: "DE-ANON SHIELD",
    desc: "Defaulters face privacy revocation as deterrent. A proof-of-concept for accountable privacy in DeFi.",
    tag: "Accountability Layer",
  },
];

const TOTAL = slides.length;

function Carousel3D() {
  const [active, setActive] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const autoRef = useRef<NodeJS.Timeout | null>(null);

  const theta = 360 / TOTAL;
  const radius = 360; // px — controls how "deep" the cylinder is

  const startAuto = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setActive((p) => (p + 1) % TOTAL);
    }, 3500);
  };

  useEffect(() => {
    startAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  const go = (dir: 1 | -1) => {
    setActive((p) => (p + dir + TOTAL) % TOTAL);
    startAuto();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = startX.current - e.clientX;
    if (Math.abs(diff) > 40) go(diff > 0 ? 1 : -1);
  };

  return (
    <div
      style={{
        perspective: "1200px",
        perspectiveOrigin: "50% 50%",
        height: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        position: "relative",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsDragging(false)}
    >
      {/* 3D stage */}
      <div
        style={{
          width: 360,
          height: 260,
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)",
          transform: `rotateY(${-active * theta}deg)`,
        }}
      >
        {slides.map((s, i) => {
          const angle = i * theta;
          const isActive = i === active;
          return (
            <div
              key={i}
              onClick={() => { setActive(i); startAuto(); }}
              style={{
                position: "absolute",
                width: 320,
                height: 240,
                left: "50%",
                top: "50%",
                marginLeft: -160,
                marginTop: -120,
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                backfaceVisibility: "visible",
                transition: "all 0.6s ease",
                padding: "32px 28px",
                background: isActive ? "#ffffff" : "#050505",
                color: isActive ? "#000000" : "#888888",
                border: `1px solid ${isActive ? "#ffffff" : "#333333"}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
                boxShadow: isActive
                  ? "0 0 60px rgba(255,255,255,0.25), 8px 8px 0px rgba(255,255,255,0.1)"
                  : "none",
              }}
            >
              {/* Top tag */}
              <div style={{
                fontSize: "0.65rem",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: isActive ? "#000000" : "#444444",
                borderBottom: `1px solid ${isActive ? "#00000022" : "#333333"}`,
                paddingBottom: 12,
                marginBottom: 16,
              }}>
                {s.tag}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: "1.4rem",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                textTransform: "uppercase",
                flex: 1,
                display: "flex",
                alignItems: "center",
              }}>
                {s.title}
              </h3>

              {/* Desc */}
              <p style={{
                fontSize: "0.8rem",
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.6,
                marginTop: 12,
                color: isActive ? "#333333" : "#444444",
              }}>
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Arrow buttons */}
      <button
        onClick={(e) => { e.stopPropagation(); go(-1); }}
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 44,
          height: 44,
          background: "transparent",
          border: "1px solid #333",
          color: "#fff",
          fontSize: "1.2rem",
          cursor: "pointer",
          zIndex: 10,
          transition: "all 0.3s",
          fontFamily: "monospace",
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#fff";
          (e.currentTarget as HTMLButtonElement).style.color = "#000";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
        }}
        aria-label="Previous"
      >
        ←
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); go(1); }}
        style={{
          position: "absolute",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 44,
          height: 44,
          background: "transparent",
          border: "1px solid #333",
          color: "#fff",
          fontSize: "1.2rem",
          cursor: "pointer",
          zIndex: 10,
          transition: "all 0.3s",
          fontFamily: "monospace",
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "#fff";
          (e.currentTarget as HTMLButtonElement).style.color = "#000";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "#fff";
        }}
        aria-label="Next"
      >
        →
      </button>

      {/* Dot nav */}
      <div style={{
        position: "absolute",
        bottom: -28,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 10,
      }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setActive(i); startAuto(); }}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: i === active ? 24 : 8,
              height: 3,
              background: i === active ? "#ffffff" : "#333333",
              border: "none",
              cursor: "pointer",
              transition: "all 0.4s ease",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────
export default function HomePage() {
  const { isConnected } = useAccount();
  const router = useRouter();

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
          <span style={{
            fontWeight: 900,
            fontSize: "1.1rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            CONFIDENTIAL<span style={{ color: "#555" }}>CREDIT</span>
          </span>
          <span style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', monospace",
            border: "1px solid #333",
            padding: "3px 8px",
            color: "#888",
            marginLeft: 8,
          }}>
            FHENIX HELIUM
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <Link
            href="/whitepaper"
            style={{
              color: "#555",
              fontSize: "0.8rem",
              textDecoration: "none",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              transition: "color 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#555")}
          >
            WHITEPAPER
          </Link>
          <WalletConnect />
        </div>
      </nav>

      {/* Hero */}
      <main style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "80px 48px 100px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 0,
      }}>
        {/* Eyebrow label */}
        <div style={{
          fontSize: "0.7rem",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#555",
          border: "1px solid #222",
          padding: "6px 18px",
          marginBottom: 32,
        }}>
          Deployedon Arbitrum Sepolia · Chain ID 421614
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(3.2rem, 8vw, 6rem)",
          fontWeight: 900,
          lineHeight: 1.02,
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          marginBottom: 28,
        }}>
          Lend &amp; Borrow<br />
          <span style={{ color: "#333" }}>Without Trace</span>
        </h1>

        <p style={{
          fontSize: "1rem",
          fontFamily: "'JetBrains Mono', monospace",
          color: "#555",
          maxWidth: 540,
          lineHeight: 1.7,
          marginBottom: 44,
        }}>
          THE FIRST UNDERCOLLATERALIZED DeFi PROTOCOL POWERED BY FULLY HOMOMORPHIC ENCRYPTION. NO RAW DATA. NO COLLATERAL. NO COMPROMISE.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 16, marginBottom: 80, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            id="launch-app-btn"
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "14px 40px",
              background: "#fff",
              color: "#000",
              border: "1px solid #fff",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "0.88rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#000";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0 #fff";
              (e.currentTarget as HTMLButtonElement).style.transform = "translate(-2px,-2px)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#fff";
              (e.currentTarget as HTMLButtonElement).style.color = "#000";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              (e.currentTarget as HTMLButtonElement).style.transform = "none";
            }}
          >
            {isConnected ? "ENTER DASHBOARD →" : "LAUNCH PROTOCOL →"}
          </button>
          <a
            href="https://sepolia.arbiscan.io/address/0xD7840983B638cFcf9fC0CD32b358B02eb43E59Ef"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "14px 40px",
              background: "transparent",
              color: "#555",
              border: "1px solid #333",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "0.88rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.3s",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "#fff";
              (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "#333";
              (e.currentTarget as HTMLAnchorElement).style.color = "#555";
            }}
          >
            ARBISCAN ↗
          </a>
        </div>

        {/* ── 3D Carousel ── */}
        <div style={{ width: "100%", marginBottom: 100 }}>
          <div style={{
            fontSize: "0.65rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "#333",
            textTransform: "uppercase",
            marginBottom: 48,
          }}>
            ── PROTOCOL FEATURES ──
          </div>
          <Carousel3D />
        </div>

        {/* Stats bar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0,
          width: "100%",
          borderTop: "1px solid #1a1a1a",
          borderLeft: "1px solid #1a1a1a",
          marginBottom: 80,
        }}>
          {[
            { label: "Vault Liquidity", value: "50,000", unit: "mUSDC" },
            { label: "Max Loan", value: "2,000", unit: "mUSDC Tier 3" },
            { label: "Interest Rate", value: "5%", unit: "Flat Rate" },
          ].map((s) => (
            <div key={s.label} style={{
              padding: "28px 20px",
              borderRight: "1px solid #1a1a1a",
              borderBottom: "1px solid #1a1a1a",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: "0.65rem",
                fontFamily: "'JetBrains Mono', monospace",
                color: "#444",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}>
                {s.label}
              </div>
              <div style={{
                fontSize: "1.8rem",
                fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace",
                color: "#fff",
                lineHeight: 1,
                marginBottom: 4,
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: "0.7rem",
                color: "#444",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {s.unit}
              </div>
            </div>
          ))}
        </div>

        {/* ── Feature Sequence ── */}
        <div style={{ width: "100%", marginBottom: 80, textAlign: "left" }}>
          <div style={{
            fontSize: "0.65rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "#333",
            textTransform: "uppercase",
            marginBottom: 48,
          }}>
            ── HOW IT WORKS ──
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 0, borderLeft: "2px solid #1a1a1a", paddingLeft: 32 }}>
            {[
              {
                step: "01",
                title: "CLIENT-SIDE ENCRYPTION",
                desc: "Your browser encrypts your bank balance and income into ciphertext using the Fhenix SDK (fhenix.js). Only the network's master key can operate on this data."
              },
              {
                step: "02",
                title: "ON-CHAIN FHE COMPUTATION",
                desc: "The Fhenix CoFHE coprocessor evaluates your ciphertext against our credit scoring formula blindly. The smart contract never sees your actual income."
              },
              {
                step: "03",
                title: "SEALED ELIGIBILITY",
                desc: "The output of the computation is a sealed boolean: True or False. If True, the Vault unlocks zero-collateral funds instantly to your wallet."
              }
            ].map((s) => (
              <div key={s.step} style={{ position: "relative", marginBottom: 48 }}>
                <div style={{
                  position: "absolute",
                  left: -39,
                  top: 0,
                  width: 12,
                  height: 12,
                  background: "#000",
                  border: "2px solid #fff",
                }} />
                <div style={{ fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace", color: "#666", marginBottom: 8, letterSpacing: "0.1em" }}>{s.step}</div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 900, textTransform: "uppercase", marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: "1rem", color: "#888", lineHeight: 1.6, maxWidth: 600 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
      
      {/* Global Footer */}
      <Footer />
    </div>
  );
}
