import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vehicle QR Safety System | Smart & Private Contact",
  description: "Generate QR codes for your vehicle for secure, private communication during parking or emergency situations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-white`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
