import ReduxProvider from './providers/ReduxProvider';
import SocketProvider from './components/SocketProvider';
import { ThemeInitScript } from "./components/ThemeInitScript";

import './globals.css';

export const metadata = {
  title: 'LawHelpZone - Legal Services Platform',
  description: 'Connect with legal professionals for your legal needs',
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
          <SocketProvider>
            {children}
          </SocketProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}