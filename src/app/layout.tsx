import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CÉLULA — Espacio creativo',
  description: 'Un espacio para la creación, el arte y la experimentación.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
