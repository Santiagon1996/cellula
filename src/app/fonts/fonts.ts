import { DM_Mono, Space_Grotesk } from 'next/font/google';

// Keep the existing CSS variable as a compatibility alias for Space Grotesk.
export const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '700'],
  style: 'normal',
  subsets: ['latin'],
  variable: '--font-acid',
  display: 'swap',
  preload: false,
  fallback: ['Arial', 'Helvetica', 'sans-serif'],
});

// Keep the existing CSS variable as a compatibility alias for DM Mono.
export const dmMono = DM_Mono({
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-basis-mono',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
});
