import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/Header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "QBE — Claim Documents",
  description: "Demo: claim document upload and assessor review workflow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-full font-sans">
        <StoreProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
