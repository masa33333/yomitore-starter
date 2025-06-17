// src/lib/fonts.ts
import { Inter, Roboto_Mono } from 'next/font/google';

export const geistSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const geistMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
