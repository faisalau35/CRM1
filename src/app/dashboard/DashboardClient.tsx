"use client";

import { useRouter } from "next/navigation";
import { 
  Card, 
  Text, 
  Group, 
  RingProgress, 
  SimpleGrid, 
  Title, 
  Button, 
  ThemeIcon, 
  useMantineTheme,
  Stack,
  Avatar,
  Timeline,
  Divider,
  Badge
} from '@mantine/core';
import { 
  IconArrowUpRight, 
  IconArrowDownRight, 
  IconUsers, 
  IconClipboardList, 
  IconCreditCard, 
  IconChartBar, 
  IconPlus,
  IconCheck,
  IconMessage,
  IconFileUpload
} from '@tabler/icons-react';
import React from 'react';

interface DashboardClientProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const router = useRouter();
  const theme = useMantineTheme();

  // Mock data for dashboard
  const stats = [
    { title: 'Total Customers', value: '24', diff: 12, icon: IconUsers, color: 'blue' },
    { title: 'Active Projects', value: '8', diff: -2, icon: IconClipboardList, color: 'green' },
    { title: 'Revenue', value: '$12,430', diff: 4, icon: IconCreditCard, color: 'violet' },
    { title: 'Conversion Rate', value: '24%', diff: 8, icon: IconChartBar, color: 'teal' },
  ];

  // Mock data for recent activity
  const activities = [
    { id: 1, title: 'New customer added', description: 'John Smith was added as a new customer', time: '2 hours ago', icon: IconUsers, color: 'blue' },
    { id: 2, title: 'Project completed', description: 'Website redesign project was marked as completed', time: '5 hours ago', icon: IconCheck, color: 'green' },
    { id: 3, title: 'New message', description: 'You received a new message from Sarah Johnson', time: 'Yesterday', icon: IconMessage, color: 'violet' },
    { id: 4, title: 'File uploaded', description: 'Contract document was uploaded to the system', time: '2 days ago', icon: IconFileUpload, color: 'orange' },
  ];

  const StatsCard = ({ title, value, diff, icon: Icon, color }: { 
    title: string, 
    value: string, 
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
            variant="light" 
            leftSection={<IconPlus size={16} />}
            onClick={() => router.push("/dashboard/customers/new")}
          >
            Add Customer
          </Button>
          <Button 
            variant="filled" 
            leftSection={<IconClipboardList size={16} />}
            onClick={() => router.push("/dashboard/projects/new")}
          >
            New Project
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="xl">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {/* Performance Overview */}
        <Card withBorder p="md" radius="md" shadow="sm">
          <Card.Section withBorder inheritPadding py="xs" mb="md">
            <Group justify="space-between">
              <Text fw={600}>Performance Overview</Text>
              <Badge size="sm">This Month</Badge>
            </Group>
          </Card.Section>
          
          <Group justify="center" mb="md">
            <RingProgress
              size={150}
              thickness={12}
              roundCaps
              sections={[
                { value: 40, color: theme.colors.blue[6] },
                { value: 25, color: theme.colors.green[6] },
                { value: 15, color: theme.colors.orange[6] },
              ]}
              label={
                <div style={{ textAlign: 'center' }}>
                  <Text fw={700} size="xl">80%</Text>
                  <Text size="xs" c="dimmed">Completion</Text>
                </div>
              }
            />
          </Group>
          
          <SimpleGrid cols={3} mt="md">
            <div>
              <Text ta="center" fz="lg" fw={700} c={theme.colors.blue[6]}>
                40%
              </Text>
              <Text ta="center" fz="xs" c="dimmed">
                Customers
              </Text>
            </div>
            <div>
              <Text ta="center" fz="lg" fw={700} c={theme.colors.green[6]}>
                25%
              </Text>
              <Text ta="center" fz="xs" c="dimmed">
                Projects
              </Text>
            </div>
            <div>
              <Text ta="center" fz="lg" fw={700} c={theme.colors.orange[6]}>
                15%
              </Text>
              <Text ta="center" fz="xs" c="dimmed">
                Revenue
              </Text>
            </div>
          </SimpleGrid>
        </Card>

        {/* Recent Activity */}
        <Card withBorder p="md" radius="md" shadow="sm">
          <Card.Section withBorder inheritPadding py="xs" mb="md">
            <Group justify="space-between">
              <Text fw={600}>Recent Activity</Text>
              <Text fz="xs" c="dimmed">Last 7 days</Text>
            </Group>
          </Card.Section>
          
          <Timeline active={activities.length - 1} bulletSize={24} lineWidth={2}>
            {activities.map((activity) => (
              <Timeline.Item 
                key={activity.id} 
                bullet={
                  <ThemeIcon size={22} radius="xl" color={activity.color}>
                    <activity.icon size="0.8rem" />
                  </ThemeIcon>
                } 
                title={activity.title}
              >
                <Text size="sm">{activity.description}</Text>
                <Text size="xs" mt={4} c="dimmed">{activity.time}</Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>

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
              color="green" 
              fullWidth 
              leftSection={<IconClipboardList size="1rem" />}
              onClick={() => router.push("/dashboard/projects")}
            >
              Manage Projects
            </Button>
            <Button 
              variant="light" 
              color="violet" 
              fullWidth 
              leftSection={<IconCreditCard size="1rem" />}
              onClick={() => router.push("/dashboard/billing")}
            >
              Billing & Invoices
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