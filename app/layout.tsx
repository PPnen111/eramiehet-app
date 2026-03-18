import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "./components/bottom-nav";
import RolePreviewBanner from "./components/role-preview-banner";

export const metadata: Metadata = {
  title: "Erämiesten App",
  description: "Metsästysseuran hallinta helpoksi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <body className="antialiased">
        <RolePreviewBanner />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
