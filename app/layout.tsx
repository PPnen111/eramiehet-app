import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Erämiehet",
  description: "Metsästysseuran hallintasovellus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
