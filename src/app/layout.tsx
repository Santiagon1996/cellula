import type { Metadata } from 'next';
import { dmMono, spaceGrotesk } from './fonts/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'CÉLULA — Espacio creativo',
  description: 'Un espacio para la creación, el arte y la experimentación.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" className={`${spaceGrotesk.variable} ${dmMono.variable}`}><body>{children}</body></html>;
}
