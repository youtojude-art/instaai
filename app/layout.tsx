import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instagram運用AI社員",
  description: "自社専用Instagram運用AI社員システム"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
