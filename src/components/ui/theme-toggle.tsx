"use client";

import { useTheme } from "next-themes";
import { Button } from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant={isDark ? "filled" : "subtle"}
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      color={isDark ? "yellow" : "blue"}
    >
      {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </Button>
  );
} 