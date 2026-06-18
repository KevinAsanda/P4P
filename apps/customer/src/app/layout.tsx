import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prepped 4 Prep | School Stationery & Labeling Services",
  description: "Avoid the Fuss, Trust us! Order customized back-to-school stationery packs, book covering, and labeling services online in Durban.",
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
