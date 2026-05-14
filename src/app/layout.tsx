import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "SmallLet - Property Management for Small Landlords",
    template: "%s | SmallLet",
  },
  description:
    "The simplest, most powerful property management platform for landlords with 1-20 units. Collect rent, manage tenants, track maintenance, and handle accounting — all in one place.",
  keywords: [
    "property management",
    "landlord software",
    "rent collection",
    "tenant management",
    "small landlord",
    "rental property",
  ],
  authors: [{ name: "SmallLet" }],
  creator: "SmallLet",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://smalllet.app",
    siteName: "SmallLet",
    title: "SmallLet - Property Management for Small Landlords",
    description:
      "The simplest, most powerful property management platform for landlords with 1-20 units.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmallLet - Property Management for Small Landlords",
    description:
      "The simplest, most powerful property management platform for landlords with 1-20 units.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers session={session}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
