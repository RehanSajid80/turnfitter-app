import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TurnFitter — booking & rewards for independent gyms & studios",
  description:
    "The reward-based platform that helps personal trainers and independent gyms stand out. Free studio booking pages, check-in, and member management.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
