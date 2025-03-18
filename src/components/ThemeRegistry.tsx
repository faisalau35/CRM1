'use client';

import { ReactNode, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface ThemeRegistryProps {
  children: ReactNode;
}

export default function ThemeRegistry({ children }: ThemeRegistryProps) {
  const { resolvedTheme } = useTheme();

  // This script will run only on the client side after hydration
  useEffect(() => {
    // Create the mantine-color-scheme in localStorage to avoid hydration mismatch
    const colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';
    localStorage.setItem('mantine-color-scheme', colorScheme);
    
    // Apply the theme class to the document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(colorScheme);
  }, [resolvedTheme]);

  return <>{children}</>;
} 