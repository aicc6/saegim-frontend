import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { DEFAULT_METADATA } from '@/constants/metadata';
import '../globals.css';

export const metadata: Metadata = DEFAULT_METADATA;

export default function UnauthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-10 to-sage-20">
      <Header />

      {children}

      <Footer />
    </div>
  );
}
