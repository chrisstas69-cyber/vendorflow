import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "LI Tools — NY & NJ Event Tracker",
  description: "NY & NJ street fair, festival, fireworks & event tracker for LED toy vendors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased bg-gray-950`}>
        <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-white hover:text-blue-400 transition-colors">
              LI Tools
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/events" className="text-gray-400 hover:text-white transition-colors">
                Events
              </Link>
              <Link href="/setup" className="text-gray-500 hover:text-white transition-colors">
                Setup
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
