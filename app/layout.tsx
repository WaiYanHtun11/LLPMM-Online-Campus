import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://llpmmcampus.com"),
  title: "LLPMM Online Campus - Let's Learn Programming Myanmar",
  description: "Myanmar's leading online programming education platform. Learn Python, Web Development, React, Flutter, and more.",
  openGraph: {
    title: "LLPMM Online Campus - Let's Learn Programming Myanmar",
    description: "Myanmar's leading online programming education platform. Learn Python, Web Development, React, Flutter, and more.",
    url: "/",
    siteName: "LLPMM Online Campus",
    type: "website",
    images: [
      {
        url: "/cover.png",
        secureUrl: "https://llpmmcampus.com/cover.png",
        alt: "LLPMM Online Campus",
        width: 740,
        height: 493,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LLPMM Online Campus - Let's Learn Programming Myanmar",
    description: "Myanmar's leading online programming education platform. Learn Python, Web Development, React, Flutter, and more.",
    images: ["/cover.png"],
  },
  manifest: "/favicon_io/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon_io/favicon.ico" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon_io/favicon.ico",
    apple: "/favicon_io/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
