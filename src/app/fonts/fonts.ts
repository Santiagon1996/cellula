import localFont from 'next/font/local';

export const acidGrotesk = localFont({
  src: [
    { path: './acid-grotesk/acid-grotesk-thin.otf', weight: '100', style: 'normal' },
    { path: './acid-grotesk/acid-grotesk-extralight.otf', weight: '200', style: 'normal' },
    { path: './acid-grotesk/acid-grotesk-light.otf', weight: '300', style: 'normal' },
    { path: './acid-grotesk/acid-grotesk-normal.otf', weight: '400', style: 'normal' },
    { path: './acid-grotesk/acid-grotesk-medium.otf', weight: '500', style: 'normal' },
    { path: './acid-grotesk/acid-grotesk-bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-acid',
  display: 'swap',
  preload: false,
  fallback: ['Arial', 'Helvetica', 'sans-serif'],
});

export const basisMono = localFont({
  src: [
    { path: './basis-grotesque-mono/Basis Grotesque Mono Pro Regular.otf', weight: '400', style: 'normal' },
    { path: './basis-grotesque-mono/Basis Grotesque Mono Pro Regular Italic.otf', weight: '400', style: 'italic' },
    { path: './basis-grotesque-mono/Basis Grotesque Mono Pro Medium.otf', weight: '500', style: 'normal' },
    { path: './basis-grotesque-mono/Basis Grotesque Mono Pro Medium Italic.otf', weight: '500', style: 'italic' },
  ],
  variable: '--font-basis-mono',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  fallback: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
});
