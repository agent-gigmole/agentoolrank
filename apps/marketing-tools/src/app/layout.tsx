import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RootNav } from "@/components/RootNav";
import { RootFooter } from "@/components/RootFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIMarketRank — AI Marketing Tools Directory, Ranked by Data",
  description: "Data-driven directory of AI marketing tools. Compare 200+ tools for SEO, email automation, content creation, social media, CRM, and analytics.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://aimarketrank.com"),
  openGraph: {
    title: "AIMarketRank — AI Marketing Tools Directory",
    description: "Compare 200+ AI marketing tools with real data. From SEO to email automation, find the right tools for your marketing stack.",
    type: "website",
    siteName: "AIMarketRank",
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
        <RootNav />
        <div className="flex-1">{children}</div>
        <RootFooter />
      </body>
    </html>
  );
}
