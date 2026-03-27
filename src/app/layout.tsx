import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgenTool Rank — AI Agent Tools Directory, Ranked by Data",
  description: "Data-driven directory of AI agent tools. Ranked by GitHub activity, updated daily. Find frameworks, orchestration tools, coding agents, and more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://agentoolrank.com"),
  openGraph: {
    title: "AgenTool Rank — AI Agent Tools Directory",
    description: "Data-driven directory of AI agent tools. Ranked by GitHub activity, updated daily.",
    type: "website",
    siteName: "AgenTool Rank",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        {children}
      </body>
    </html>
  );
}
