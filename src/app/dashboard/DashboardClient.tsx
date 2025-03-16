"use client";

import { useRouter } from "next/navigation";
import { 
  Card, 
  Text, 
  Group, 
  SimpleGrid, 
  Title, 
  Button, 
  ThemeIcon, 
  useMantineTheme,
  Stack,
  Avatar,
  Divider,
  Loader
} from '@mantine/core';
import { 
  IconArrowUpRight, 
  IconArrowDownRight, 
  IconUsers, 
  IconChartBar, 
  IconPlus,
} from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';

interface DashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const theme = useMantineTheme();
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [diff, setDiff] = useState(0);

  // Fetch actual customer count from API
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/customers');
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        const customers = await response.json();
        setCustomerCount(customers.length);
        
        // For demonstration purposes, we're setting a random diff value
        // In a real application, you would compare with previous month's data
        setDiff(Math.floor(Math.random() * 20) - 5);
        
      } catch (error) {
        console.error('Error fetching customer data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  const StatsCard = ({ title, value, diff, icon: Icon, color }: { 
    title: string, 
    value: string | React.ReactNode, 
    diff: number, 
    icon: React.ElementType, 
    color: string 
  }) => {
    return (
      <Card withBorder p="md" radius="md" shadow="sm">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text fz="xs" c="dimmed" fw={500}>
              {title}
            </Text>
            <Text fw={700} fz="xl" mt={5}>
              {value}
            </Text>
          </div>
          <ThemeIcon 
            color={color} 
            variant="light" 
            size={38} 
            radius="md"
          >
            <Icon size="1.5rem" stroke={1.5} />
          </ThemeIcon>
        </Group>

        <Group mt="xs" gap="xs" align="center">
          <Text c={diff > 0 ? 'teal' : 'red'} fz="sm" fw={500}>
            {diff > 0 ? '+' : ''}{diff}%
          </Text>
          {diff > 0 ? (
            <IconArrowUpRight size={16} color={theme.colors.teal[6]} stroke={1.5} />
          ) : (
            <IconArrowDownRight size={16} color={theme.colors.red[6]} stroke={1.5} />
          )}
          <Text fz="xs" c="dimmed">
            compared to last month
          </Text>
        </Group>
      </Card>
    );
  };

  return (
    <div>
      <Group justify="space-between" align="center" mb="xl">
        <div>
          <Text fz="sm" c="dimmed">Welcome back,</Text>
          <Title order={2} fw={600}>{user.name || user.email}</Title>
        </div>
        <Group>
          <Button 
            variant="filled" 
            leftSection={<IconPlus size={16} />}
            onClick={() => router.push("/dashboard/customers/new")}
          >
            Add Customer
          </Button>
        </Group>
      </Group>

      {/* Only show Total Customers card */}
      <SimpleGrid cols={{ base: 1, sm: 1, md: 1 }} spacing="md" mb="xl">
        <StatsCard 
          title="Total Customers" 
          value={isLoading ? <Loader size="sm" /> : customerCount?.toString() || '0'} 
          diff={diff} 
          icon={IconUsers} 
          color="blue" 
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 1 }} spacing="md">
        {/* Quick Actions */}
        <Card withBorder p="md" radius="md" shadow="sm">
          <Card.Section withBorder inheritPadding py="xs" mb="md">
            <Text fw={600}>Quick Actions</Text>
          </Card.Section>
          
          <Stack gap="sm">
            <Button 
              variant="light" 
              color="blue" 
              fullWidth 
              leftSection={<IconUsers size="1rem" />}
              onClick={() => router.push("/dashboard/customers")}
            >
              View All Customers
            </Button>
            <Button 
              variant="light" 
              color="gray" 
              fullWidth 
              leftSection={<IconChartBar size="1rem" />}
              onClick={() => router.push("/dashboard/reports")}
            >
              Generate Reports
            </Button>
          </Stack>
          
          <Divider my="md" />
          
          <Group gap="md" mb="xs">
            <Avatar radius="xl" size="md" src={null} color="blue">
              {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </Avatar>
            <div>
              <Text size="sm" fw={500}>{user.name || user.email}</Text>
              <Text size="xs" c="dimmed">Administrator</Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>
    </div>
  );
} 