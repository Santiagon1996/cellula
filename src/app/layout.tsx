import type { Metadata } from 'next';
import { acidGrotesk, basisGrotesqueMono } from './fonts/fonts';
import { homeCopy } from '@/features/home/data/home-copy';
import './globals.css';

export const metadata: Metadata = {
  title: homeCopy.title,
  description: homeCopy.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" className={`${acidGrotesk.variable} ${basisGrotesqueMono.variable}`}><body>{children}</body></html>;
}
