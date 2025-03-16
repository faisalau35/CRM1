'use client';

import { ReactNode } from 'react';
import { MantineProvider as BaseMantineProvider, createTheme, MantineColorsTuple } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { SessionProvider } from 'next-auth/react';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/carousel/styles.css';

// Custom primary color
const primaryColor: MantineColorsTuple = [
  '#f0f9ff',
  '#e0f2fe',
  '#bae6fd',
  '#7dd3fc',
  '#38bdf8',
  '#0ea5e9',
  '#0284c7',
  '#0369a1',
  '#075985',
  '#0c4a6e',
];

// Create theme with custom colors and other configurations
const theme = createTheme({
  primaryColor: 'primary',
  colors: {
    primary: primaryColor,
  },
  fontFamily: 'Inter, sans-serif',
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
        withBorder: true,
        p: 'lg',
      },
    },
  },
});

export function MantineProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <BaseMantineProvider theme={theme} defaultColorScheme="light">
        <Notifications position="top-right" />
        {children}
      </BaseMantineProvider>
    </SessionProvider>
  );
} 