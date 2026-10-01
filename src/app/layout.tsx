import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppQueryProvider } from '@/lib/query/provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'PGinfo Management — Owner Portal',
  description: 'Enterprise-grade PG and Hostel Management platform for property owners, managing rooms, beds, tenants, rents, and expenses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full`}>
      <body className="h-full flex flex-col bg-[#080c14] text-slate-100 antialiased font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        <AppQueryProvider>
          {children}
        </AppQueryProvider>
      </body>
    </html>
  );
}
