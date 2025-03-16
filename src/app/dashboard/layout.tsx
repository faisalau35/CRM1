"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Title,
  Text,
  UnstyledButton,
  Avatar,
  Menu,
  rem,
  useMantineTheme,
  Divider,
  Box,
  ActionIcon,
  Tooltip,
  Badge,
  Container,
  Paper,
  Button,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconUsers,
  IconClipboardList,
  IconSettings,
  IconChevronRight,
  IconLogout,
  IconUser,
  IconBell,
  IconSearch,
  IconSun,
  IconBrandGithub,
} from "@tabler/icons-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <IconDashboard size="1.2rem" stroke={1.5} />,
  },
  {
    title: "Customers",
    href: "/dashboard/customers",
    icon: <IconUsers size="1.2rem" stroke={1.5} />,
    badge: "New",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <IconSettings size="1.2rem" stroke={1.5} />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mantineTheme = useMantineTheme();
  const [opened, { toggle }] = useDisclosure();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isDark = mounted && theme === "dark";

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
      bg={isDark ? "#050505" : "gray.0"}
    >
      <AppShell.Header 
        style={{ 
          borderBottom: `1px solid ${isDark ? "#1A1A1A" : mantineTheme.colors.gray[2]}`,
          backgroundColor: isDark ? "#0A0A0A" : mantineTheme.white,
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group visibleFrom="sm">
              <Box 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '8px',
                  background: 'linear-gradient(45deg, #4263EB, #0ACF83)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '18px'
                }}
              >
                C
              </Box>
              <Title order={3} style={{ fontWeight: 600 }}>CRM System</Title>
            </Group>
          </Group>

          <Group>
            <Tooltip label="Search" position="bottom">
              <ActionIcon variant="subtle" size="lg">
                <IconSearch size="1.2rem" stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Notifications" position="bottom">
              <ActionIcon variant="subtle" size="lg" pos="relative">
                <IconBell size="1.2rem" stroke={1.5} />
                <Badge 
                  size="xs" 
                  variant="filled" 
                  color="red" 
                  style={{ 
                    position: 'absolute', 
                    top: '3px', 
                    right: '3px',
                    padding: '2px',
                    minWidth: '16px',
                    height: '16px',
                  }}
                >
                  3
                </Badge>
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Toggle theme" position="bottom">
              <ThemeToggle />
            </Tooltip>

            <Menu
              width={200}
              position="bottom-end"
              transitionProps={{ transition: "pop-top-right" }}
              withinPortal
            >
              <Menu.Target>
                <UnstyledButton>
                  <Group gap={7}>
                    <Avatar
                      src={null}
                      alt="User avatar"
                      color="blue"
                      radius="xl"
                    >
                      <IconUser size="1.5rem" />
                    </Avatar>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={600} visibleFrom="sm">
                        Admin User
                      </Text>
                    </div>
                    <IconChevronRight
                      size="1rem"
                      stroke={1.5}
                    />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={
                    <IconUser style={{ width: rem(16), height: rem(16) }} />
                  }
                >
                  Profile
                </Menu.Item>
                <Menu.Item
                  leftSection={
                    <IconSettings style={{ width: rem(16), height: rem(16) }} />
                  }
                >
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={
                    <IconLogout style={{ width: rem(16), height: rem(16) }} />
                  }
                  onClick={handleSignOut}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar 
        p="md" 
        style={{ 
          borderRight: `1px solid ${isDark ? "#1A1A1A" : mantineTheme.colors.gray[2]}`,
          backgroundColor: isDark ? "#0A0A0A" : mantineTheme.white,
        }}
      >
        <AppShell.Section grow>
          <Box mb="lg">
            <Text size="xs" fw={500} c="dimmed" tt="uppercase" mb="xs">
              MAIN NAVIGATION
            </Text>
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={
                  <Group justify="space-between" w="100%">
                    <Text>{item.title}</Text>
                    {item.badge && (
                      <Badge size="xs" variant="filled" color="blue">
                        {item.badge}
                      </Badge>
                    )}
                  </Group>
                }
                leftSection={item.icon}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                variant={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "filled" : "light"}
                mb={8}
                style={{
                  borderRadius: mantineTheme.radius.md,
                }}
              />
            ))}
          </Box>
        </AppShell.Section>
        
        <AppShell.Section>
          <Divider my="sm" />
          <Paper 
            p="md" 
            radius="md" 
            withBorder 
            style={{ 
              backgroundColor: isDark ? "#101010" : mantineTheme.colors.blue[0], 
              borderColor: isDark ? "#1A1A1A" : mantineTheme.colors.blue[2],
            }}
          >
            <Text size="sm" fw={500} mb="xs">Need help?</Text>
            <Text size="xs" c="dimmed" mb="md">
              Check our documentation or contact support for assistance.
            </Text>
            <Button 
              component={Link} 
              href="/dashboard/support" 
              variant="light" 
              color="blue" 
              fullWidth 
              size="xs"
            >
              Contact Support
            </Button>
          </Paper>
          <Box p="xs" mt="md">
            <Group justify="center" gap="xs">
              <ActionIcon variant="subtle" size="md" radius="xl">
                <IconBrandGithub size="1rem" />
              </ActionIcon>
            </Group>
            <Text size="xs" c="dimmed" ta="center" mt="xs">
              © 2024 CRM System
            </Text>
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="xl" py="md">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
} 