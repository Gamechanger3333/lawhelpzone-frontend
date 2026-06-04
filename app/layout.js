import ReduxProvider from "./providers/ReduxProvider";
import SocketProvider from "./components/SocketProvider";
import { ThemeInitScript } from "./components/ThemeInitScript";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.lawhelpzone.com"),
  title: {
    default: "LawHelpZone — Find a Lawyer Online | Legal Help Platform",
    template: "%s | LawHelpZone",
  },
  description:
    "LawHelpZone connects clients with verified lawyers for business, family, criminal, immigration, and more. Get legal help online — fast, secure, and affordable.",
  keywords: [
    "find a lawyer online",
    "legal help platform",
    "hire lawyer Pakistan",
    "online legal advice",
    "LawHelpZone",
    "criminal lawyer",
    "family lawyer",
    "business law",
    "immigration lawyer",
    "legal services",
  ],
  authors: [{ name: "LawHelpZone", url: "https://www.lawhelpzone.com" }],
  creator: "LawHelpZone",
  publisher: "LawHelpZone",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.lawhelpzone.com",
    siteName: "LawHelpZone",
    title: "LawHelpZone — Find a Lawyer Online",
    description:
      "Connect with verified lawyers for business, family, criminal, and immigration law. Legal help that's fast, secure, and affordable.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LawHelpZone — Legal Services Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LawHelpZone — Find a Lawyer Online",
    description:
      "Connect with verified lawyers for business, family, criminal, and immigration law.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://www.lawhelpzone.com",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body
        style={{
          background: "var(--bg, #f8fafc)",
          color: "var(--text, #1e293b)",
          transition: "background 0.3s, color 0.3s",
          minHeight: "100vh",
        }}
      >
        <ReduxProvider>
          <SocketProvider>{children}</SocketProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}