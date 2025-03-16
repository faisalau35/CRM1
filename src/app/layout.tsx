import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import '@mantine/core/styles.css';
import { Toaster } from "sonner";
import AuthProvider from "@/components/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM System",
  description: "A modern CRM system for managing customers and projects",
};

const theme = {
  primaryColor: 'blue',
  colors: {
    // Add custom colors if needed
  },
  fontFamily: inter.style.fontFamily,
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        p: 'lg',
      },
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <MantineProvider theme={theme} defaultColorScheme="light">
            {children}
            <Toaster position="top-right" richColors closeButton />
          </MantineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
