import type { Metadata } from "next";
import "./globals.css";
import { Orbitron, Inter } from "next/font/google"
import { Toaster } from 'react-hot-toast';

const orbitron = Orbitron({
  subsets: ["latin"],
  // This generates a CSS variable named --font-orbitron
  variable: "--font-orbitron",
});

const inter = Inter({
  subsets: ["latin"],
  // This generates a CSS variable named --font-orbitron
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Quizify",
  description: "Generate gamified, AI-driven quizzes instantly. A full-stack assessment platform designed for interactive learning between teachers and students.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${orbitron.variable} ${inter.variable}`}>
      <body>{children}<Toaster position="bottom-right" reverseOrder={false} /></body>
    </html>
  );
}
