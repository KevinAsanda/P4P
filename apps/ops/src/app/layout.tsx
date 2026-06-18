import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "P4P Portal | Internal Operations & Admin",
  description: "Staff and Admin portal for Prepped 4 Prep order fulfillment, stock management, and QuickBooks synchronization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans bg-purewhite text-jetblack">
        {children}
      </body>
    </html>
  );
}
