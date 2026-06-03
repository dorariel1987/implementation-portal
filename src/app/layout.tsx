import type { Metadata } from 'next';
import './globals.css';
import { direction } from '@/lib/i18n/config';
import { getServerDictionary } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Implementation Portal',
  description:
    'Customer onboarding portal that turns implementation checklists into a guided product experience.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { locale } = getServerDictionary();
  return (
    <html lang={locale} dir={direction(locale)}>
      <body>{children}</body>
    </html>
  );
}
