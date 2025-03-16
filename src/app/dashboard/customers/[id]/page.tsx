"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import {
  Container,
  Group,
  Title,
  Text,
  Button,
  Paper,
  Divider,
  SimpleGrid,
  Box,
  Table,
  ActionIcon,
  Menu,
  Card,
  Avatar,
  Badge,
  Flex,
  ThemeIcon,
  Tooltip,
  Loader,
  Modal,
  CopyButton,
  rem,
} from "@mantine/core";
import {
  IconUser,
  IconCreditCard,
  IconTrash,
  IconEdit,
  IconArrowLeft,
  IconCopy,
  IconCheck,
  IconMapPin,
  IconPhone,
  IconMail,
  IconCalendar,
  IconId,
  IconLicense,
  IconRefresh,
} from "@tabler/icons-react";
import { lookupCardDetails } from "@/lib/binLookup";

interface CreditCardBinInfo {
  scheme?: string;
  type?: string;
  brand?: string;
  country?: {
    name?: string;
    emoji?: string;
  };
  bank?: {
    name?: string;
    city?: string;
    phone?: string;
  };
  isLoading?: boolean;
}

interface CreditCard {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  binInfo?: CreditCardBinInfo;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  ssn: string;
  dateOfBirth: string;
  driverLicense?: string;
  creditCards: CreditCard[];
  createdAt: string;
  updatedAt: string;
}

export default function CustomerPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshingBin, setRefreshingBin] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Fetch customer data
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    async function fetchCustomer() {
      try {
        // Extract customer ID from URL
        const customerId = window.location.pathname.split("/").pop();
        
        if (!customerId) {
          throw new Error("Customer ID not found");
        }
        
        const response = await fetch(`/api/customers/${customerId}`, {
          signal: abortController.signal
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            return notFound();
          }
          throw new Error("Failed to fetch customer");
        }
        
        const data = await response.json();
        
        if (isMounted) {
          setCustomer(data);
          
          // After setting customer data, load BIN info if there are credit cards
          if (data.creditCards?.length > 0) {
            // Use setTimeout to break the state update cycle and avoid infinite loops
            setTimeout(() => {
              if (isMounted) {
                fetchAllBinInfo(data.creditCards);
              }
            }, 0);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        console.error("Error fetching customer:", error);
        if (isMounted) {
          toast.error("Failed to load customer data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchCustomer();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Format SSN for display
  const formatSSN = (ssn: string) => {
    if (!ssn) return "—";
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length !== 9) return ssn;
    return cleaned;
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "—";
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return phone;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  // Format credit card number for display - no masking
  const formatCardNumber = (cardNumber: string) => {
    if (!cardNumber) return "—";
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length !== 16) return cardNumber;
    return cleaned;
  };

  const fetchAllBinInfo = async (cards: CreditCard[]) => {
    if (!cards?.length) return;
    
    // Create a copy of the cards to update
    const updatedCards = [...cards];
    let hasUpdates = false;
    
    // Create a flag to track if the component is still mounted
    let isMounted = true;
    
    try {
      for (let i = 0; i < cards.length; i++) {
        // Check if component is still mounted
        if (!isMounted) return;
        
        const card = cards[i];
        try {
          const bin = card.cardNumber.slice(0, 6);
          
          // Skip if bin is not valid
          if (bin.length < 6) continue;
          
          // Use the API route directly
          const response = await fetch(`/api/bin-lookup?bin=${bin}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch BIN info for ${bin}`);
          }
          
          const data = await response.json();
          
          // Update the card with BIN info
          updatedCards[i] = {
            ...card,
            binInfo: {
              scheme: data.scheme?.toLowerCase(),
              type: data.type?.toLowerCase(),
              brand: data.category,
              country: {
                name: data.country
              },
              bank: {
                name: data.bank
              },
              isLoading: false
            }
          };
          hasUpdates = true;
        } catch (error) {
          console.error(`Error fetching BIN info for card ${card.id}:`, error);
          
          // Update the card to show error state
          updatedCards[i] = {
            ...card,
            binInfo: {
              scheme: undefined,
              type: undefined,
              brand: undefined,
              country: undefined,
              bank: {
                name: "Error loading card details"
              },
              isLoading: false
            }
          };
          hasUpdates = true;
        }
      }
      
      // Only update the state once with all changes if component is still mounted
      if (hasUpdates && isMounted) {
        setCustomer(prevCustomer => {
          if (!prevCustomer) return null;
          return {
            ...prevCustomer,
            creditCards: updatedCards
          };
        });
      }
    } finally {
      isMounted = false;
    }
  };

  // Helper function to get country emoji from country code
  const getCountryEmoji = (countryCode: string) => {
    if (!countryCode) return '';
    
    // Convert country code to regional indicator symbols
    const codePoints = [...countryCode.toUpperCase()].map(
      char => 127397 + char.charCodeAt(0)
    );
    
    return String.fromCodePoint(...codePoints);
  };

  // Refresh BIN info for all cards
  const refreshBinInfo = async () => {
    if (!customer?.creditCards?.length) return;
    
    setRefreshingBin(true);
    
    try {
      // Mark all cards as loading
      const cardsWithLoading = customer.creditCards.map(card => ({
        ...card,
        binInfo: card.binInfo ? { ...card.binInfo, isLoading: true } : { isLoading: true }
      }));
      
      // Update state with loading indicators
      setCustomer(prevCustomer => {
        if (!prevCustomer) return null;
        return {
          ...prevCustomer,
          creditCards: cardsWithLoading
        };
      });
      
      // Fetch new BIN info
      await fetchAllBinInfo(cardsWithLoading);
    } catch (error) {
      console.error("Error refreshing BIN info:", error);
      toast.error("Failed to refresh card information");
    } finally {
      setRefreshingBin(false);
    }
  };

  // Handle customer deletion
  const handleDeleteCustomer = async () => {
    if (!customer) return;
    
    setIsDeleting(true);
    setDeleteModalOpen(false);
    
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }
      
      // Show success notification
      toast.success("Customer deleted successfully", {
        description: "Redirecting to customers list...",
        duration: 3000,
      });
      
      // Redirect to customers list
      setTimeout(() => {
        router.push("/dashboard/customers");
      }, 1500);
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="70vh" direction="column" gap="md">
        <Loader size="lg" />
        <Text c="dimmed">Loading customer information...</Text>
      </Flex>
    );
  }

  if (!customer) {
    return notFound();
  }

  return (
    <Container size="xl" py="md">
      {/* Header with actions */}
      <Card shadow="sm" radius="md" withBorder mb="xl">
        <Group justify="space-between" mb="md">
          <Group>
            <Avatar 
              size="lg" 
              radius="xl" 
              color="blue"
              src={null}
            >
              {customer.firstName.charAt(0) + customer.lastName.charAt(0)}
            </Avatar>
            <div>
              <Title order={3}>{customer.firstName} {customer.lastName}</Title>
              <Group gap="xs">
                <Badge color="blue" variant="light">Customer</Badge>
                <Text size="sm" c="dimmed">ID: {customer.id}</Text>
              </Group>
            </div>
          </Group>
          
          <Group>
            <Button 
              variant="light" 
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.push("/dashboard/customers")}
            >
              Back to Customers
            </Button>
            <Button 
              variant="outline" 
              leftSection={<IconEdit size={16} />}
              onClick={() => router.push(`/dashboard/customers/${customer.id}/edit`)}
            >
              Edit
            </Button>
            <Button 
              variant="light" 
              color="red" 
              leftSection={<IconTrash size={16} />}
              onClick={() => setDeleteModalOpen(true)}
              loading={isDeleting}
            >
              Delete
            </Button>
          </Group>
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="xl">
        {/* Personal Information */}
        <Card shadow="sm" radius="md" withBorder>
          <Card.Section withBorder inheritPadding py="xs" mb="md">
            <Group>
              <IconUser size="1.2rem" color="var(--mantine-color-blue-6)" />
              <Title order={4}>Personal Information</Title>
            </Group>
          </Card.Section>
          
          <Table>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td width="40%">
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="xl" color="blue" variant="light">
                      <IconUser size="0.8rem" />
                    </ThemeIcon>
                    <Text fw={500}>Full Name</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text>{customer.firstName} {customer.lastName}</Text>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="xl" color="blue" variant="light">
                      <IconMail size="0.8rem" />
                    </ThemeIcon>
                    <Text fw={500}>Email</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Text>{customer.email}</Text>
                    <CopyButton value={customer.email} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                          <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                            {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Group>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="xl" color="blue" variant="light">
                      <IconPhone size="0.8rem" />
                    </ThemeIcon>
                    <Text fw={500}>Phone</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Text>{formatPhoneNumber(customer.phone)}</Text>
                    <CopyButton value={customer.phone} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                          <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                            {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Group>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="xl" color="blue" variant="light">
                      <IconId size="0.8rem" />
                    </ThemeIcon>
                    <Text fw={500}>SSN</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text>{formatSSN(customer.ssn)}</Text>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="xl" color="blue" variant="light">
                      <IconCalendar size="0.8rem" />
                    </ThemeIcon>
                    <Text fw={500}>Date of Birth</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text>{new Date(customer.dateOfBirth).toLocaleDateString()}</Text>
                </Table.Td>
              </Table.Tr>
              {customer.driverLicense && (
                <Table.Tr>
                  <Table.Td>
                    <Group gap="xs">
                      <ThemeIcon size="sm" radius="xl" color="blue" variant="light">
                        <IconLicense size="0.8rem" />
                      </ThemeIcon>
                      <Text fw={500}>Driver License</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text>{customer.driverLicense}</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
        
        {/* Address Information */}
        <Card shadow="sm" radius="md" withBorder>
          <Card.Section withBorder inheritPadding py="xs" mb="md">
            <Group>
              <IconMapPin size="1.2rem" color="var(--mantine-color-blue-6)" />
              <Title order={4}>Address Information</Title>
            </Group>
          </Card.Section>
          
          <Table>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td width="40%">
                  <Text fw={500}>Street Address</Text>
                </Table.Td>
                <Table.Td>
                  <Text>{customer.address}</Text>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>City</Text>
                </Table.Td>
                <Table.Td>
                  <Text>{customer.city}</Text>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>State</Text>
                </Table.Td>
                <Table.Td>
                  <Text>{customer.state}</Text>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>Zip Code</Text>
                </Table.Td>
                <Table.Td>
                  <Text>{customer.zipCode}</Text>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>Customer Since</Text>
                </Table.Td>
                <Table.Td>
                  <Text>{new Date(customer.createdAt).toLocaleDateString()}</Text>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>Last Updated</Text>
                </Table.Td>
                <Table.Td>
                  <Text>{new Date(customer.updatedAt).toLocaleDateString()}</Text>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>
      </SimpleGrid>

      {/* Credit Card Information */}
      <Card shadow="sm" radius="md" withBorder mb="xl">
        <Card.Section withBorder inheritPadding py="xs" mb="md">
          <Group justify="space-between">
            <Group>
              <IconCreditCard size="1.2rem" color="var(--mantine-color-blue-6)" />
              <Title order={4}>Credit Cards</Title>
            </Group>
            <Button 
              variant="light" 
              size="xs" 
              leftSection={<IconRefresh size="0.9rem" />}
              onClick={refreshBinInfo} 
              loading={refreshingBin}
              disabled={!customer.creditCards || customer.creditCards.length === 0}
            >
              Refresh BIN Info
            </Button>
          </Group>
        </Card.Section>
        
        {customer.creditCards && customer.creditCards.length > 0 ? (
          <div>
            {customer.creditCards.map((card) => (
              <Paper key={card.id} withBorder p="md" mb="md">
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <div>
                    <Title order={5} mb="md">Card Details</Title>
                    <Table>
                      <Table.Tbody>
                        <Table.Tr>
                          <Table.Td width="40%">
                            <Text fw={500}>Cardholder Name</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text>{card.cardholderName}</Text>
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Text fw={500}>Card Number</Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Text>{formatCardNumber(card.cardNumber)}</Text>
                              <CopyButton value={card.cardNumber} timeout={2000}>
                                {({ copied, copy }) => (
                                  <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                                    <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                                      {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
                                    </ActionIcon>
                                  </Tooltip>
                                )}
                              </CopyButton>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Text fw={500}>Expiration</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text>{card.expirationMonth}/{card.expirationYear}</Text>
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Text fw={500}>CVV</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text>{card.cvv}</Text>
                          </Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </div>
                  
                  <div>
                    <Title order={5} mb="md">BIN Information</Title>
                    <Table>
                      <Table.Tbody>
                        <Table.Tr>
                          <Table.Td width="40%">
                            <Text fw={500}>BIN</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text>{card.cardNumber.slice(0, 6)}</Text>
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Text fw={500}>Scheme</Text>
                          </Table.Td>
                          <Table.Td>
                            {card.binInfo?.scheme ? (
                              <Badge color={card.binInfo?.scheme === 'visa' ? 'blue' : card.binInfo?.scheme === 'mastercard' ? 'red' : 'gray'}>
                                {card.binInfo.scheme.toUpperCase()}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Text fw={500}>Type</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text tt="capitalize">{card.binInfo?.type || "—"}</Text>
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Text fw={500}>Brand</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text>{card.binInfo?.brand || "—"}</Text>
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Text fw={500}>Country</Text>
                          </Table.Td>
                          <Table.Td>
                            {card.binInfo?.country ? (
                              <Group gap="xs">
                                <Text>{card.binInfo.country.emoji || ""}</Text>
                                <Text>{card.binInfo.country.name || "—"}</Text>
                              </Group>
                            ) : (
                              "—"
                            )}
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Text fw={500}>Bank</Text>
                          </Table.Td>
                          <Table.Td>
                            {card.binInfo?.bank ? (
                              <div>
                                <Text>{card.binInfo.bank.name || "—"}</Text>
                                {card.binInfo.bank.city && (
                                  <Text size="xs" c="dimmed">City: {card.binInfo.bank.city}</Text>
                                )}
                                {card.binInfo.bank.phone && (
                                  <Text size="xs" c="dimmed">Phone: {card.binInfo.bank.phone}</Text>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </div>
                </SimpleGrid>
              </Paper>
            ))}
          </div>
        ) : (
          <Box py="xl" ta="center">
            <ThemeIcon size={48} radius="xl" color="gray" variant="light" mx="auto" mb="md">
              <IconCreditCard size={24} />
            </ThemeIcon>
            <Text fw={500}>No credit cards found</Text>
            <Text size="sm" c="dimmed" maw={400} mx="auto" mt="xs">
              This customer doesn't have any credit cards on file. You can add a credit card by editing the customer.
            </Text>
            <Button 
              variant="light" 
              mt="md" 
              leftSection={<IconEdit size={16} />}
              onClick={() => router.push(`/dashboard/customers/${customer.id}/edit`)}
            >
              Add Credit Card
            </Button>
          </Box>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal 
        opened={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)}
        title={<Text fw={600}>Delete Customer</Text>}
        centered
      >
        <Text size="sm" mb="lg">
          Are you sure you want to delete <strong>{customer.firstName} {customer.lastName}</strong>? This action cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="filled" 
            color="red" 
            onClick={handleDeleteCustomer}
            loading={isDeleting}
          >
            Delete Customer
          </Button>
        </Group>
      </Modal>
    </Container>
  );
} 