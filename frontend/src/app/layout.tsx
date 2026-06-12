import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexaCore - Total Rewards & Benefits',
  description: 'AI-powered benefits and rewards assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
