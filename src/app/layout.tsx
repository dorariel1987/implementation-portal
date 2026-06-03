import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Implementation Portal',
  description:
    'פורטל onboarding ללקוחות שהופך checklists של הטמעה לחוויית מוצר מודרכת.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
