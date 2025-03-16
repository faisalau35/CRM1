"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Table,
  Checkbox,
  Group,
  Text,
  Button,
  ActionIcon,
  Card,
  TextInput,
  Badge,
  Menu,
  Tooltip,
  Divider,
  Pagination,
  Box,
  Flex,
  Title,
  Paper,
  Loader,
  Avatar,
  ThemeIcon,
  rem,
} from "@mantine/core";
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconUsers,
  IconDownload,
  IconRefresh,
} from "@tabler/icons-react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  createdAt: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 10;

  // Fetch customers on component mount
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch('/api/customers');
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        const data = await response.json();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  // Toggle selection of a single customer
  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId) 
        : [...prev, customerId]
    );
  };

  // Toggle selection of all customers
  const toggleAllCustomers = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(customer => customer.id));
    }
  };

  // Delete selected customers
  const deleteSelectedCustomers = async () => {
    if (selectedCustomers.length === 0) return;

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      // Delete each selected customer
      const results = await Promise.all(
        selectedCustomers.map(async (id) => {
          const response = await fetch(`/api/customers/${id}`, {
            method: "DELETE",
          });
          return { id, success: response.ok };
        })
      );

      // Count successful deletions
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} customer(s)`, {
          description: "The page will refresh to show updated data.",
        });
        
        // Remove deleted customers from the state
        const deletedIds = results.filter(r => r.success).map(r => r.id);
        setCustomers(prev => prev.filter(customer => !deletedIds.includes(customer.id)));
        
        // Clear selection
        setSelectedCustomers([]);
      }
      
      // Report failures if any
      const failureCount = results.length - successCount;
      if (failureCount > 0) {
        toast.error(`Failed to delete ${failureCount} customer(s)`, {
          description: "Please try again or contact support if the issue persists.",
        });
      }
    } catch (error) {
      console.error("Error deleting customers:", error);
      toast.error("Failed to delete customers", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      customer.firstName.toLowerCase().includes(searchTerm) ||
      customer.lastName.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm) ||
      customer.phone.toLowerCase().includes(searchTerm) ||
      (customer.city && customer.city.toLowerCase().includes(searchTerm)) ||
      (customer.state && customer.state.toLowerCase().includes(searchTerm))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "—";
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return phone;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="70vh" direction="column" gap="md">
        <Loader size="lg" />
        <Text c="dimmed">Loading customers...</Text>
      </Flex>
    );
  }

  return (
    <div>
      <Card shadow="sm" p="lg" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Group>
            <ThemeIcon size={40} radius="md" color="blue" variant="light">
              <IconUsers size={24} />
            </ThemeIcon>
            <div>
              <Title order={3}>Customers</Title>
              <Text c="dimmed" size="sm">Manage your customer database</Text>
            </div>
          </Group>
          <Group>
            <Button 
              variant="outline" 
              leftSection={<IconDownload size={16} />}
              size="sm"
            >
              Export
            </Button>
            <Button 
              variant="filled" 
              leftSection={<IconPlus size={16} />}
              component={Link}
              href="/dashboard/customers/new"
              size="sm"
            >
              Add Customer
            </Button>
          </Group>
        </Group>

        <Divider mb="md" />

        <Group justify="space-between" mb="md">
          <TextInput
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ width: '300px' }}
            size="sm"
          />
          <Group>
            {selectedCustomers.length > 0 && (
              <Button 
                variant="light" 
                color="red" 
                onClick={deleteSelectedCustomers}
                disabled={isDeleting}
                leftSection={<IconTrash size={16} />}
                size="sm"
              >
                {isDeleting ? "Deleting..." : `Delete Selected (${selectedCustomers.length})`}
              </Button>
            )}
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="subtle" leftSection={<IconFilter size={16} />} size="sm">
                  Filter
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Filter by</Menu.Label>
                <Menu.Item>All Customers</Menu.Item>
                <Menu.Item>Recently Added</Menu.Item>
                <Menu.Item>Active Customers</Menu.Item>
                <Menu.Divider />
                <Menu.Label>Sort by</Menu.Label>
                <Menu.Item leftSection={<IconSortAscending size={14} />}>Name (A-Z)</Menu.Item>
                <Menu.Item leftSection={<IconSortDescending size={14} />}>Name (Z-A)</Menu.Item>
                <Menu.Item leftSection={<IconSortDescending size={14} />}>Newest First</Menu.Item>
                <Menu.Item leftSection={<IconSortAscending size={14} />}>Oldest First</Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <ActionIcon variant="subtle" size="lg" onClick={() => window.location.reload()}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <Paper withBorder radius="md">
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40 }}>
                  <Checkbox 
                    checked={filteredCustomers.length > 0 && selectedCustomers.length === filteredCustomers.length}
                    onChange={toggleAllCustomers}
                    aria-label="Select all customers"
                  />
                </Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Contact</Table.Th>
                <Table.Th>Location</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th style={{ width: 80 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedCustomers.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    <Box py="xl">
                      <ThemeIcon size={40} radius="xl" color="gray" variant="light" mx="auto" mb="md">
                        <IconUsers size={20} />
                      </ThemeIcon>
                      <Text fw={500} ta="center" mb="xs">No customers found</Text>
                      <Text size="sm" c="dimmed" ta="center" mb="md">
                        {searchQuery 
                          ? "Try adjusting your search terms" 
                          : "Add your first customer to get started"}
                      </Text>
                      {!searchQuery && (
                        <Button 
                          variant="light" 
                          leftSection={<IconPlus size={16} />}
                          component={Link}
                          href="/dashboard/customers/new"
                          mx="auto"
                          display="block"
                          size="xs"
                        >
                          Add Customer
                        </Button>
                      )}
                    </Box>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedCustomers.map((customer) => (
                  <Table.Tr key={customer.id}>
                    <Table.Td>
                      <Checkbox 
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => toggleCustomerSelection(customer.id)}
                        aria-label={`Select ${customer.firstName} ${customer.lastName}`}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar color="blue" radius="xl">
                          {customer.firstName.charAt(0) + customer.lastName.charAt(0)}
                        </Avatar>
                        <div>
                          <Text size="sm" fw={500} component={Link} href={`/dashboard/customers/${customer.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {customer.firstName} {customer.lastName}
                          </Text>
                          <Text size="xs" c="dimmed">ID: {customer.id.substring(0, 8)}</Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <div>
                        <Text size="sm">{customer.email || "—"}</Text>
                        <Text size="xs" c="dimmed">{formatPhoneNumber(customer.phone)}</Text>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      {customer.city && customer.state ? (
                        <Badge variant="light" color="gray">
                          {customer.city}, {customer.state}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(customer.createdAt).toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="center">
                        <Tooltip label="View details">
                          <ActionIcon 
                            variant="subtle" 
                            component={Link} 
                            href={`/dashboard/customers/${customer.id}`}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit">
                          <ActionIcon 
                            variant="subtle" 
                            component={Link} 
                            href={`/dashboard/customers/${customer.id}/edit`}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Menu shadow="md" position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item 
                              leftSection={<IconTrash style={{ width: rem(14), height: rem(14) }} />}
                              color="red"
                              onClick={() => {
                                setSelectedCustomers([customer.id]);
                                deleteSelectedCustomers();
                              }}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        {totalPages > 1 && (
          <Group justify="space-between" mt="lg">
            <Text size="sm" c="dimmed">
              Showing {Math.min(filteredCustomers.length, (activePage - 1) * itemsPerPage + 1)} to {Math.min(filteredCustomers.length, activePage * itemsPerPage)} of {filteredCustomers.length} customers
            </Text>
            <Pagination 
              total={totalPages} 
              value={activePage} 
              onChange={setActivePage} 
              size="sm"
            />
          </Group>
        )}
      </Card>
    </div>
  );
} 