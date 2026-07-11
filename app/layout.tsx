import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Headroom — API runway monitor",
  description: "Know which usage-based provider will become a constraint next.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
