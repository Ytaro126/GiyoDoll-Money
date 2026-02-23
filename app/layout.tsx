import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context";
import AppShell from "@/components/AppShell";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Giyodoll Money - ふたりの家計管理",
  description: "2人で使えるシンプルな家計管理アプリ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Giyodoll Money",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
