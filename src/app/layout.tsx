import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/shared/QueryProvider';
import { Toaster } from '@/components/ui/sonner';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Land Intel Platform',
  description: 'Map-based land intelligence platform for industrial real estate professionals',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css"
        />
      </head>
      <body className={`${dmSans.variable} font-sans antialiased`}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
