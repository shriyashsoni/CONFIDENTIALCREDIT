"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { useState } from "react";

export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [showMenu, setShowMenu] = useState(false);

  const isWrongNetwork = isConnected && chain?.id !== arbitrumSepolia.id;

  if (isConnected && address) {
    return (
      <div style={{ position: "relative" }}>
        {isWrongNetwork ? (
          <button
            id="switch-network-btn"
            onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
            disabled={isSwitching}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid #ffffff",
              borderRadius: "0px",
              color: "#ffffff",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isSwitching ? <span className="spinner" /> : "⚠"}
            {isSwitching ? "Switching…" : "Switch to Arbitrum Sepolia"}
          </button>
        ) : (
          <button
            id="wallet-address-btn"
            onClick={() => setShowMenu((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid #ffffff",
              borderRadius: "0px",
              color: "#ffffff",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "0px",
                background: "#ffffff",
                flexShrink: 0,
              }}
            />
            {`${address.slice(0, 6)}…${address.slice(-4)}`}
          </button>
        )}

        {showMenu && !isWrongNetwork && (
          <div
            className="glass-card"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: "220px",
              padding: "8px",
              zIndex: 50,
            }}
          >
            <div style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#94a3b8", wordBreak: "break-all", fontFamily: "'JetBrains Mono', monospace" }}>
              {address}
            </div>
            <div style={{ padding: "4px 12px", fontSize: "0.72rem", color: "#555", fontFamily: "'JetBrains Mono', monospace" }}>
              {chain?.name ?? "Unknown"} · Chain {chain?.id}
            </div>
            <div className="divider" style={{ margin: "4px 0" }} />
            <button
              id="disconnect-btn"
              onClick={() => { disconnect(); setShowMenu(false); }}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                borderRadius: "0px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#ffffff"; (e.currentTarget as HTMLButtonElement).style.color = "#000000"; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#ffffff"; }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show ALL available wallet connectors as separate buttons
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {connectors.length > 0 ? (
        connectors.map((connector) => (
          <button
            key={connector.uid}
            id={`connect-${connector.id}-btn`}
            className="btn-primary"
            onClick={() => connect({ connector })}
            disabled={isPending}
            style={{ padding: "9px 16px", fontSize: "0.82rem" }}
          >
            {isPending ? <span className="spinner" /> : null}
            {isPending ? "Connecting…" : connector.name}
          </button>
        ))
      ) : (
        <button
          className="btn-primary"
          disabled
          style={{ padding: "9px 20px", fontSize: "0.82rem", opacity: 0.5 }}
        >
          No Wallet Detected — Install MetaMask
        </button>
      )}
    </div>
  );
}
