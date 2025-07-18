import "./globals.css";
import PointsProvider from "@/context/PointsContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { RewardProvider } from "@/context/RewardContext";
import ConditionalHeader from "@/components/ConditionalHeader";
import ScrollController from "@/components/ScrollController";
import AnimationPreloader from "@/components/AnimationPreloader";
import ExitCalendarHandler from "@/components/ExitCalendarHandler";
import LevelMigration from "@/components/LevelMigration";
import MessageNotification from "@/components/MessageNotification";
import MessageCatchup from "@/components/MessageCatchup";
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
            <RewardProvider>
              <LevelMigration />
              <AnimationPreloader />
              {/* <ScrollController /> */}
              <ConditionalHeader />
              <ExitCalendarHandler />
              <MessageNotification />
              {/* <MessageCatchup /> */}
              <main className="min-h-screen">{children}</main>
            </RewardProvider>
          </PointsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
