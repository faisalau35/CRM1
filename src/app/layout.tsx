import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ColorSchemeScript } from "@mantine/core";
import '@mantine/core/styles.css';
import { Toaster } from "sonner";
import AuthProvider from "@/components/auth-provider";
import { ThemeProvider } from "next-themes";
import MantineThemeProvider from "@/components/MantineThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM System",
  description: "A modern CRM system for managing customers and projects",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <MantineThemeProvider>
              {children}
              <Toaster position="top-right" richColors closeButton />
            </MantineThemeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
