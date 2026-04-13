import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Grand Meridian Admin Dashboard",
  description: "Admin UI migrated to Next.js TypeScript",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
