import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use webpack instead of turbopack for build (avoids cofhejs/ethers compat issues)
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },

  // Ensure environment variables are available at build time
  env: {
    NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS ?? "0xD7840983B638cFcf9fC0CD32b358B02eb43E59Ef",
    NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS:  process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS  ?? "0x24bE9C74CFCA5313f388c87106cb7B4a41A8F3c9",
    NEXT_PUBLIC_USDC_CONTRACT_ADDRESS:   process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS   ?? "0xE114AA229DE7c88BC22d2F5ec628532c9c46663c",
    NEXT_PUBLIC_CHAIN_ID:                process.env.NEXT_PUBLIC_CHAIN_ID                ?? "421614",
    NEXT_PUBLIC_ARBITRUM_RPC:            process.env.NEXT_PUBLIC_ARBITRUM_RPC            ?? "https://sepolia-rollup.arbitrum.io/rpc",
  },
};

export default nextConfig;
