import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "./components/bottom-nav";
import FeedbackButton from "./components/feedback-button";
import TrialBanner from "./components/trial-banner";
import ActivityTracker from "./components/activity-tracker";
import OfflineSync from "./components/offline-sync";
import PWARegister from "./components/pwa-register";
import PWAInstallPrompt from "./components/pwa-install-prompt";

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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a2e14" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JahtiPro" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: recoveryScript }} />
      </head>
      <body className="antialiased">
        <ActivityTracker />
        <OfflineSync />
        <PWARegister />
        <PWAInstallPrompt />
        <TrialBanner />
        {children}
        <BottomNav />
        <FeedbackButton />
      </body>
    </html>
  );
}
