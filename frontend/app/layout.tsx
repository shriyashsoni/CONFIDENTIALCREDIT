import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ConfidentialCredit — Trustless Private Lending on Fhenix",
  description:
    "The first fully private undercollateralized lending protocol. Your financial data is encrypted with FHE — only a Yes/No eligibility answer is ever revealed on-chain.",
  keywords: ["DeFi", "FHE", "Fhenix", "privacy", "credit", "lending", "crypto"],
  openGraph: {
    title: "ConfidentialCredit",
    description: "Trustless. Private. Undercollateralized.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
