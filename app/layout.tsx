import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "./components/bottom-nav";
import FeedbackButton from "./components/feedback-button";
import TrialBanner from "./components/trial-banner";
import ActivityTracker from "./components/activity-tracker";
import OfflineSync from "./components/offline-sync";
import RecoveryRedirect from "./components/recovery-redirect";

export const metadata: Metadata = {
  title: "JahtiPro",
  description: "Metsästysseuran hallintajärjestelmä",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <body className="antialiased">
        <RecoveryRedirect />
        <ActivityTracker />
        <OfflineSync />
        <TrialBanner />
        {children}
        <BottomNav />
        <FeedbackButton />
      </body>
    </html>
  );
}
