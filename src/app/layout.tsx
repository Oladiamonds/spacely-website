import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

// Body font — DM Sans (clean, modern, excellent readability on mobile)
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

// Display font — Playfair Display (editorial serif, italic for expressive headlines)
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
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
      className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-secondary-100 text-neutral-800 font-sans">
        {children}
      </body>
    </html>
  );
}
