"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { useState } from "react";

export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [showMenu, setShowMenu] = useState(false);

  const { data: balanceData } = useBalance({
    address,
    chainId: arbitrumSepolia.id, // Always fetch from Arbitrum Sepolia
  });

  const isWrongNetwork = isConnected && chain?.id !== arbitrumSepolia.id;
  const isTestnet = chain?.testnet ?? (chain?.name?.toLowerCase().includes("test") || chain?.name?.toLowerCase().includes("sepolia"));

  // Securely find the best connector (MetaMask or standard Injected)
  const handleConnect = () => {
    const connector =
      connectors.find((c) => c.id === "metaMask") ||
      connectors.find((c) => c.id === "injected") ||
      connectors[0];
    if (connector) connect({ connector });
  };

  if (isConnected && address) {
    return (
      <div style={{ position: "relative", zIndex: 1000 }}>
        {isWrongNetwork ? (
          <button
            id="switch-network-btn"
            onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
            disabled={isSwitching}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "linear-gradient(45deg, #ff3b30, #ff9500)",
              border: "none",
              borderRadius: "8px",
              color: "#ffffff",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px 0 rgba(255, 59, 48, 0.39)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {isSwitching ? <span className="spinner" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} /> : "⚠"}
            {isSwitching ? "Switching…" : "Switch to Arbitrum Sepolia"}
          </button>
        ) : (
          <button
            id="wallet-address-btn"
            onClick={() => setShowMenu((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "6px 6px 6px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "#ffffff",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            {/* Balance */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1, marginBottom: 2 }}>
                Balance
              </span>
              <span style={{ color: "#fff", fontWeight: 700, lineHeight: 1, fontSize: "0.85rem" }}>
                {balanceData ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}` : "— ETH"}
              </span>
            </div>

            {/* Address Pill */}
            <div style={{
              background: "rgba(0,0,0,0.6)",
              padding: "8px 12px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid rgba(255,255,255,0.08)"
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 10px #4ade80" }} />
              {`${address.slice(0, 6)}…${address.slice(-4)}`}
            </div>
          </button>
        )}

        {showMenu && !isWrongNetwork && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            right: 0,
            minWidth: "260px",
            padding: "16px",
            zIndex: 1000,
            background: "rgba(10, 10, 12, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            animation: "fadeInUp 0.2s ease-out forwards",
          }}>
            {/* Network badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Network</span>
              <span style={{
                fontSize: "0.7rem",
                padding: "4px 8px",
                background: isTestnet ? "rgba(168, 85, 247, 0.2)" : "rgba(74, 222, 128, 0.2)",
                color: isTestnet ? "#c084fc" : "#4ade80",
                borderRadius: "6px",
                fontWeight: 800,
                border: `1px solid ${isTestnet ? "rgba(168, 85, 247, 0.3)" : "rgba(74, 222, 128, 0.3)"}`
              }}>
                {isTestnet ? "TESTNET" : "MAINNET"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: 32, height: 32, borderRadius: "8px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🌐</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{chain?.name ?? "Unknown"}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>Chain ID: {chain?.id}</div>
              </div>
            </div>

            {/* Balance full */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700 }}>Balance</span>
              <span style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
                {balanceData ? `${parseFloat(balanceData.formatted).toFixed(6)} ${balanceData.symbol}` : "Loading…"}
              </span>
            </div>

            <div className="divider" style={{ margin: "16px 0", background: "rgba(255,255,255,0.1)" }} />

            <button
              id="disconnect-btn"
              onClick={() => { disconnect(); setShowMenu(false); }}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "center",
                borderRadius: "8px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; }}
            >
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    );
  }

  const hasConnectors = connectors.length > 0;

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      {hasConnectors ? (
        <button
          id="connect-wallet-btn"
          onClick={handleConnect}
          disabled={isPending}
          style={{
            padding: "12px 32px",
            fontSize: "0.95rem",
            background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)",
            color: "#0f172a",
            border: "none",
            borderRadius: "12px",
            fontWeight: 800,
            fontFamily: "'Inter', sans-serif",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 4px 14px rgba(255,255,255,0.15)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseOver={(e) => { if (!isPending) { e.currentTarget.style.transform = "translateY(-2px)"; } }}
          onMouseOut={(e) => { if (!isPending) { e.currentTarget.style.transform = "translateY(0)"; } }}
        >
          {isPending && <span className="spinner" style={{ width: 18, height: 18, borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#000" }} />}
          {isPending ? "Connecting…" : "Connect Wallet"}
        </button>
      ) : (
        <button
          disabled
          style={{
            padding: "12px 28px",
            fontSize: "0.95rem",
            opacity: 0.5,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            borderRadius: "12px",
            fontWeight: 600,
            cursor: "not-allowed",
          }}
        >
          No Wallet Detected — Install MetaMask
        </button>
      )}
    </div>
  );
}
