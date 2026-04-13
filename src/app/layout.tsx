import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Body font — Inter (system-like, loads from Google Fonts with fast preload)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Display font — Instrument Serif (premium feel without being corporate)
// Loaded as a local font from the public directory for performance
const instrumentSerif = localFont({
  src: [
    {
      path: "../../public/fonts/InstrumentSerif-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/InstrumentSerif-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | SpaceLY",
    default: "SpaceLY — Book Creative Workspaces in Nigeria",
  },
  description:
    "Book photography studios, fashion ateliers, recording studios, commercial kitchens, and beauty suites by the hour across Lagos. Nigeria's first creative workspace marketplace.",
  keywords: [
    "photography studio Lagos",
    "tailoring studio rent Ikeja",
    "music studio hourly Lagos",
    "commercial kitchen rent Lagos",
    "creative workspace Nigeria",
    "studio booking Lagos",
  ],
  authors: [{ name: "SpaceLY" }],
  creator: "SpaceLY",
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "SpaceLY",
    title: "SpaceLY — Book Creative Workspaces in Nigeria",
    description:
      "On-demand hourly workspace booking for Nigeria's 4.2M creative workers. Fashion, photography, music, kitchen, and beauty studios across Lagos.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@spacely_ng",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#C4472B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-secondary-100 text-neutral-800 font-sans">
        {children}
      </body>
    </html>
  );
}
