import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ediworks SBT Admin',
  description: 'Ediworks SBT Control Plane Administration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}