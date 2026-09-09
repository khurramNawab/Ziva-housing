import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './globals.css';

const rubik = Rubik({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rubik',
});

export const metadata: Metadata = {
  title: {
    default: 'Ziva Housing — Find Your Perfect Home',
    template: '%s | Ziva Housing',
  },
  description:
    'Ziva Housing is India\'s trusted real estate marketplace. Buy, sell, or rent properties with verified listings and lead-protected enquiry system.',
  keywords: ['real estate', 'property', 'buy property', 'rent property', 'India', 'Ziva Housing'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://zivahousing.com',
    siteName: 'Ziva Housing',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className={`${rubik.variable} font-sans`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

