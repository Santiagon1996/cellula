import type { Metadata } from 'next';
import { acidGrotesk, basisGrotesqueMono } from './fonts/fonts';
import { homeCopy } from '@/features/home/data/home-copy';
import './globals.css';

export const metadata: Metadata = {
  title: homeCopy.title,
  description: homeCopy.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${acidGrotesk.variable} ${basisGrotesqueMono.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/google-font-display, @next/next/no-page-custom-font -- Keep the requested Google Fonts URL verbatim in the App Router root layout. */}
        <link
          id="material-symbols-outlined"
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=menu,close"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
