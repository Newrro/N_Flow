import type { Metadata, Viewport } from "next";
import { Syne } from "next/font/google";
import { Toaster } from "sonner";
import PWARegistration from "@/components/PWARegistration";
import CapacitorIntegration from "@/components/CapacitorIntegration";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "N-Flow — Strategic Resource Interface",
  description: "Modular workspace for operations, risk, and personnel.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "N-Flow",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#080B12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} antialiased`}>
      <body className={`${syne.variable} font-sans bg-[var(--background)] text-[var(--foreground)]`}>
        <PWARegistration />
        <CapacitorIntegration />
        <main className="relative min-h-screen safe-area-main">
          {children}
          <Toaster position="bottom-right" richColors closeButton theme="dark" />
        </main>
      </body>
    </html>
  );
}
