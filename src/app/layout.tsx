import "./globals.css";
import PointsProvider from "@/context/PointsContext";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "多読トレーニングアプリ",
  description: "Vocabulary-based extensive reading app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-page-bg">
        <LanguageProvider>
          <PointsProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
          </PointsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
