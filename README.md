# Confidential Credit — Vercel Deploy

### Deployed on Arbitrum Sepolia

**Contracts:**
- ConfidentialCredit: `0xD7840983B638cFcf9fC0CD32b358B02eb43E59Ef`
- ConfidentialVault: `0x24bE9C74CFCA5313f388c87106cb7B4a41A8F3c9`
- MockUSDC: `0xE114AA229DE7c88BC22d2F5ec628532c9c46663c`

---

## Deploying to Vercel

> **Important:** The Next.js app lives inside the `/frontend` subdirectory.
> The `vercel.json` at the root handles this automatically.

### Steps:
1. Import the GitHub repo in [Vercel](https://vercel.com/new)
2. **Root Directory** → Leave as repo root (vercel.json handles it)
3. Add these **Environment Variables** in Vercel project settings:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_CREDIT_CONTRACT_ADDRESS` | `0xD7840983B638cFcf9fC0CD32b358B02eb43E59Ef` |
| `NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS` | `0x24bE9C74CFCA5313f388c87106cb7B4a41A8F3c9` |
| `NEXT_PUBLIC_USDC_CONTRACT_ADDRESS` | `0xE114AA229DE7c88BC22d2F5ec628532c9c46663c` |
| `NEXT_PUBLIC_CHAIN_ID` | `421614` |
| `NEXT_PUBLIC_ARBITRUM_RPC` | `https://sepolia-rollup.arbitrum.io/rpc` |

4. Click **Deploy** — the app will build and go live.

---

## Local Development

```bash
# Install root deps (Hardhat)
npm install

# Install frontend deps
cd frontend && npm install

# Start dev server
npm run dev
```

Create `frontend/.env.local` with the env vars from the table above.
