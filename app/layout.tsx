import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/components/providers';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'VendorFlow OS — Event Vendor Intelligence',
  description: 'NY & NJ event discovery, pipeline, deadlines, and profit tracking for street fair vendors',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="night">
      <body className={`${geistSans.variable} antialiased font-sans`} style={{ margin: 0, minHeight: '100vh' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
