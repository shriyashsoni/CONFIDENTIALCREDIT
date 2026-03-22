// ─────────────────────────────────────────────────────────────────────────
// Contract ABIs — must match the deployed Solidity source exactly.
// ─────────────────────────────────────────────────────────────────────────

// inEuint64 is the Solidity calldata struct used by Fhenix FHE contracts:
//   struct inEuint64 { bytes data; int32 securityZone; }
// We expose it via the ABI as a tuple so viem can encode it correctly.
export const CREDIT_ABI = [
  {
    type: "function",
    name: "submitFinancialData",
    inputs: [
      {
        name: "encBalance",
        type: "tuple",
        components: [
          { name: "data",         type: "bytes" },
          { name: "securityZone", type: "int32"  },
        ],
      },
      {
        name: "encIncome",
        type: "tuple",
        components: [
          { name: "data",         type: "bytes" },
          { name: "securityZone", type: "int32"  },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "checkEligibility",
    inputs: [{ name: "minScoreX10", type: "uint64" }],
    outputs: [{ name: "eligible", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getScoreSealed",
    inputs: [{ name: "publicKey", type: "bytes32" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getCreditLimitSealed",
    inputs: [{ name: "publicKey", type: "bytes32" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasScore",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasSubmitted",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ScoreSubmitted",
    inputs: [{ name: "user", type: "address", indexed: true }],
  },
] as const;

export const VAULT_ABI = [
  {
    type: "function",
    name: "borrow",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "repay",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "loans",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "principal", type: "uint256" },
      { name: "startTime", type: "uint256" },
      { name: "active",    type: "bool"    },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getLoanDetails",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "principal", type: "uint256" },
      { name: "interest",  type: "uint256" },
      { name: "dueDate",   type: "uint256" },
      { name: "active",    type: "bool"    },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "TIER1_MIN_SCORE",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "TIER2_MIN_SCORE",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "TIER3_MIN_SCORE",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "TIER1_MAX_LOAN",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "TIER2_MAX_LOAN",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "TIER3_MAX_LOAN",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "LoanIssued",
    inputs: [
      { name: "borrower", type: "address", indexed: true },
      { name: "amount",   type: "uint256", indexed: false },
      { name: "tier",     type: "uint8",   indexed: false },
    ],
  },
  {
    type: "event",
    name: "LoanRepaid",
    inputs: [
      { name: "borrower",  type: "address", indexed: true  },
      { name: "principal", type: "uint256", indexed: false },
      { name: "interest",  type: "uint256", indexed: false },
    ],
  },
] as const;

export const USDC_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner",   type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────
// Deployed contract addresses — Arbitrum Sepolia (Chain ID 421614)
// ─────────────────────────────────────────────────────────────────────────
export const CONTRACTS = {
  credit: (process.env.NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS || "0xD7840983B638cFcf9fC0CD32b358B02eb43E59Ef") as `0x${string}`,
  vault:  (process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS  || "0x24bE9C74CFCA5313f388c87106cb7B4a41A8F3c9") as `0x${string}`,
  usdc:   (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS   || "0xE114AA229DE7c88BC22d2F5ec628532c9c46663c") as `0x${string}`,
} as const;

export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "421614");

// Loan tiers — mirrors contract constants
export const LOAN_TIERS = [
  { tier: 1, label: "Starter", maxLoan: 500,  minScore: 3_000_000, color: "#ffffff" },
  { tier: 2, label: "Growth",  maxLoan: 1000, minScore: 6_000_000, color: "#cccccc" },
  { tier: 3, label: "Premium", maxLoan: 2000, minScore: 9_000_000, color: "#999999" },
] as const;
