import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import BottomNav from "./components/bottom-nav";
import FeedbackButton from "./components/feedback-button";
import TrialBanner from "./components/trial-banner";
import ActivityTracker from "./components/activity-tracker";
import OfflineSync from "./components/offline-sync";
import PWARegister from "./components/pwa-register";
import PWAInstallPrompt from "./components/pwa-install-prompt";

export const metadata: Metadata = {
  title: 'JahtiPro — Metsästysseuran hallintasovellus',
  description:
    'Vähemmän hallintoa, enemmän metsästystä. JahtiPro kokoaa jäsenrekisterin, maksut, vierasluvat ja tapahtumat yhteen paikkaan.',
  icons: {
    icon: 'https://jpljpvkooeoriyfopesr.supabase.co/storage/v1/object/public/assets/favicon.ico',
    apple: 'https://jpljpvkooeoriyfopesr.supabase.co/storage/v1/object/public/assets/apple-touch-icon.png',
  },
  openGraph: {
    title: 'JahtiPro — Metsästysseuran hallintasovellus',
    description: 'Vähemmän hallintoa, enemmän metsästystä.',
    images: [
      'https://jpljpvkooeoriyfopesr.supabase.co/storage/v1/object/public/assets/og-image.png',
    ],
    locale: 'fi_FI',
    type: 'website',
  },
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
        <meta name="theme-color" content="#1e3d1e" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="JahtiPro" />
        <link
          rel="apple-touch-icon"
          href="https://jpljpvkooeoriyfopesr.supabase.co/storage/v1/object/public/assets/apple-touch-icon.png"
        />
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
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "wspu471kly");
  `}
        </Script>
      </body>
    </html>
  );
}
