import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prepped 4 Prep | School Stationery, Book Covering & Labeling — Durban",
  description:
    "Order your child's complete school stationery pack online. We cover exercise books, print waterproof name labels, and deliver to your door across Durban & KZN. Avoid the Fuss, Trust Us!",
  openGraph: {
    title: "Prepped 4 Prep | School Stationery, Book Covering & Labeling",
    description:
      "Order your child's complete school stationery pack online. Book covering, custom name labels, and doorstep delivery across Durban & KZN.",
    url: "https://prepped4prep.co.za",
    siteName: "Prepped 4 Prep",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prepped 4 Prep | School Stationery & Labeling — Durban",
    description:
      "Complete school stationery packs, book covering, and custom name labels delivered to your door. Servicing 15+ Durban & KZN schools.",
  },
  icons: {
    icon: "/brand/square-logo.png",
    apple: "/brand/square-logo.png",
  },
  other: {
    "theme-color": "#F8C83E",
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans bg-purewhite text-jetblack">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-papaya focus:text-jetblack focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:text-sm"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
