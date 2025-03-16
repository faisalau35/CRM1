'use client';

import { ReactNode } from 'react';
import { MantineProvider } from './MantineProvider';

export default function MantineThemeProvider({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
} 