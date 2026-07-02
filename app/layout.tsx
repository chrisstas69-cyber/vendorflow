import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/components/providers';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://vendorflow-mu.vercel.app').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'VendorFlow — Event Vendor Intelligence for NY & NJ',
    template: '%s | VendorFlow',
  },
  description:
    'Find street fairs and festivals, apply for booths, track deadlines, and log profits — event discovery and vendor operations for NY & NJ vendors and organizers.',
  keywords: [
    'street fair vendor',
    'festival booth application',
    'event vendor NY',
    'event vendor NJ',
    'craft fair events',
    'vendor booth fees',
  ],
  openGraph: {
    siteName: 'VendorFlow',
    type: 'website',
    title: 'VendorFlow — Event Vendor Intelligence for NY & NJ',
    description:
      'Find street fairs and festivals, apply for booths, track deadlines, and log profits.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VendorFlow — Event Vendor Intelligence for NY & NJ',
    description:
      'Find street fairs and festivals, apply for booths, track deadlines, and log profits.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased font-sans`} style={{ margin: 0, minHeight: '100vh' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
