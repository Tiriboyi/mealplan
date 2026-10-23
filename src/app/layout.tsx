import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import AppShell from "@/components/AppShell";
import PlanProvider from "@/components/PlanProvider";
import "./globals.css";

// Instrument Serif ships a single weight.
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display" });

// Satoshi's licence forbids keeping the font file in a public repository, so it comes from Fontshare.
const SATOSHI_CSS = "https://api.fontshare.com/v2/css?f[]=satoshi@1&display=swap";

export const metadata: Metadata = {
  title: { default: "Mealplan", template: "%s · Mealplan" },
  description: "A week of dinners and a shopping list built from this week's Dutch supermarket promotions.",
  appleWebApp: { capable: true, title: "Mealplan" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f8" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1c2b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={SATOSHI_CSS} precedence="default" />
      </head>
      <body>
        {/* One provider above every page, so the week survives moving between them. */}
        <PlanProvider>
          <AppShell>{children}</AppShell>
        </PlanProvider>
      </body>
    </html>
  );
}
