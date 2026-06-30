import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayush | Software Engineer — High-Performance Engineering Portfolio",
  description:
    "Precision-engineered software portfolio. Full-stack engineer specializing in React, Next.js, Java, Spring Boot, and data-driven architecture. Built for performance.",
  keywords: [
    "Software Engineer",
    "Full Stack Developer",
    "React",
    "Next.js",
    "Java",
    "Spring Boot",
    "Portfolio",
  ],
  authors: [{ name: "Ayush" }],
  openGraph: {
    title: "Ayush | Software Engineer",
    description:
      "Precision-engineered software. Zero-latency execution. A portfolio built on performance metrics and technical precision.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
