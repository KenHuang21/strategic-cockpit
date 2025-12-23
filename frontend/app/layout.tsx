import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strategic Cockpit Dashboard - The Founder's Sentinel",
  description: "High-performance strategic dashboard for crypto-executive decision making",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
