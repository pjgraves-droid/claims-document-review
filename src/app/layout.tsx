import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Meridian Insurance — Claim Documents",
  description: "Demo: claim document upload and assessor review workflow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full">
        <StoreProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </StoreProvider>
      </body>
    </html>
  );
}
