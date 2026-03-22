"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{
      width: "100%",
      borderTop: "1px solid #1a1a1a",
      background: "#000",
      color: "#fff",
      padding: "60px 48px 40px",
    }}>
      <div style={{
        maxWidth: 1000,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 48,
        marginBottom: 60,
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 16, height: 16, background: "#fff" }} />
            <span style={{
              fontWeight: 900,
              fontSize: "1rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              CONFIDENTIAL<span style={{ color: "#555" }}>CREDIT</span>
            </span>
          </div>
          <p style={{
            fontSize: "0.8rem",
            color: "#666",
            lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', monospace",
            maxWidth: 280,
          }}>
            The first fully homomorphic encryption powered undercollateralized lending protocol on Fhenix Helium.
          </p>
        </div>

        {/* Links */}
        <div>
          <div style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#fff",
            marginBottom: 24,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Protocol
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Link href="/" style={{ color: "#888", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="#888"}>Home</Link>
            <Link href="/dashboard" style={{ color: "#888", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="#888"}>Terminal Dashboard</Link>
            <Link href="/about" style={{ color: "#888", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="#888"}>About Us</Link>
            <Link href="/whitepaper" style={{ color: "#888", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="#888"}>Whitepaper</Link>
          </div>
        </div>

        {/* Social / Dev */}
        <div>
          <div style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#fff",
            marginBottom: 24,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Developers
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <a href="https://docs.fhenix.io" target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="#888"}>Fhenix Docs</a>
            <a href="https://sepolia.arbiscan.io" target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="#888"}>Arbitrum Sepolia Explorer</a>
            <a href="https://github.com/FhenixProtocol" target="_blank" rel="noopener noreferrer" style={{ color: "#888", textDecoration: "none", fontSize: "0.85rem", transition: "color 0.2s" }} onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="#888"}>GitHub</a>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1000,
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        borderTop: "1px solid #111",
        paddingTop: 32,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.65rem",
          color: "#444",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          © {new Date().getFullYear()} CONFIDENTIAL CREDIT · FHENIX HELIUM
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.65rem",
          color: "#444",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          POWERED BY TFHE-RS FULLY HOMOMORPHIC ENCRYPTION
        </span>
      </div>
    </footer>
  );
}
