import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "./components/bottom-nav";
import FeedbackButton from "./components/feedback-button";
import TrialBanner from "./components/trial-banner";
import ActivityTracker from "./components/activity-tracker";
import OfflineSync from "./components/offline-sync";

export const metadata: Metadata = {
  title: "JahtiPro",
  description: "Metsästysseuran hallintajärjestelmä",
};

// Inline script that runs BEFORE any React/Supabase JS loads.
// Detects recovery hash fragment and redirects to /reset-password
// before Supabase auto-processes the token and signs the user in.
const recoveryScript = `
  (function() {
    var h = window.location.hash;
    if (h && h.indexOf('type=recovery') !== -1 && window.location.pathname !== '/reset-password') {
      window.location.replace('/reset-password' + h);
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <head>
        <script dangerouslySetInnerHTML={{ __html: recoveryScript }} />
      </head>
      <body className="antialiased">
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
