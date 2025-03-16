"use client";

import { useState, useEffect } from "react";
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
  SimpleGrid,
  Table,
  ActionIcon,
  Card,
  Avatar,
  Badge,
  Flex,
  ThemeIcon,
  Tooltip,
  Loader,
  Modal,
  CopyButton,
  Box,
  Textarea,
  useMantineColorScheme,
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
  IconDeviceFloppy,
  IconX,
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
  lastUpdated?: string;
  error?: string;
}

interface CreditCard {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  binInfo?: CreditCardBinInfo;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  secondaryEmail?: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  ssn: string;
  dateOfBirth: string;
  driverLicense?: string;
  notes?: string;
  creditCards: CreditCard[];
  createdAt: string;
  updatedAt: string;
}

// Reusable component for text with copy button
const CopyableText = ({ value, children }: { value: string, children?: React.ReactNode }) => {
  if (!value) return <Text>—</Text>;
  
  return (
    <Group gap="xs">
      {children || <Text>{value}</Text>}
      <CopyButton value={value} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
            <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
              {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
};

export default function CustomerPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshingBin, setRefreshingBin] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

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
          // Ensure credit card data is properly formatted
          if (data.creditCards?.length > 0) {
            data.creditCards = data.creditCards.map((card: any) => ({
              ...card,
              // Make sure we're using the correct property names
              expiryMonth: card.expiryMonth?.toString() || '',
              expiryYear: card.expiryYear?.toString() || ''
            }));
          }
          
          setCustomer(data);
          setNotesValue(data.notes || "");
          
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

  // Update the fetchAllBinInfo function to ensure it properly loads BIN information
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
          
          // Show loading state
          setCustomer(prevCustomer => {
            if (!prevCustomer) return null;
            
            const updatedCreditCards = [...prevCustomer.creditCards];
            updatedCreditCards[i] = {
              ...updatedCreditCards[i],
              binInfo: {
                ...(updatedCreditCards[i].binInfo || {}),
                isLoading: true
              }
            };
            
            return {
              ...prevCustomer,
              creditCards: updatedCreditCards
            };
          });
          
          // Use the API route directly with a timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
          
          const response = await fetch(`/api/bin-lookup?bin=${bin}`, {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            console.warn(`Failed to fetch BIN info for ${bin} - Status: ${response.status}`);
            
            // Set a simplified binInfo object with default values
            updatedCards[i] = {
              ...card,
              binInfo: {
                scheme: 'unknown',
                type: 'unknown',
                brand: 'Unknown',
                country: { name: 'Unknown' },
                bank: { name: 'Unknown' },
                isLoading: false
              }
            };
            
            hasUpdates = true;
            continue; // Skip to next card
          }
          
          const data = await response.json();
          
          // Update the card with BIN info
          updatedCards[i] = {
            ...card,
            // Ensure expiry fields are preserved
            expiryMonth: card.expiryMonth,
            expiryYear: card.expiryYear,
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
            // Ensure expiry fields are preserved
            expiryMonth: card.expiryMonth,
            expiryYear: card.expiryYear,
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

  // Update the refreshBinInfo function
  const refreshBinInfo = async () => {
    if (!customer?.creditCards?.length) return;
    
    setRefreshingBin(true);
    
    try {
      // Create a copy of the credit cards
      const cards = [...customer.creditCards];
      
      // Show loading state for all cards
      setCustomer(prevCustomer => {
        if (!prevCustomer) return null;
        
        const updatedCreditCards = prevCustomer.creditCards.map(card => ({
          ...card,
          binInfo: {
            ...(card.binInfo || {}),
            isLoading: true
          }
        }));
        
        return {
          ...prevCustomer,
          creditCards: updatedCreditCards
        };
      });
      
      // Process each card
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const bin = card.cardNumber.slice(0, 6);
        
        if (bin.length < 6) {
          // Skip invalid BINs but update loading state
          setCustomer(prevCustomer => {
            if (!prevCustomer) return null;
            
            const updatedCreditCards = [...prevCustomer.creditCards];
            updatedCreditCards[i] = {
              ...updatedCreditCards[i],
              binInfo: {
                ...(updatedCreditCards[i].binInfo || {}),
                isLoading: false
              }
            };
            
            return {
              ...prevCustomer,
              creditCards: updatedCreditCards
            };
          });
          continue;
        }
        
        try {
          // Use the API route with cache busting
          const timestamp = new Date().getTime();
          const response = await fetch(`/api/bin-lookup?bin=${bin}&t=${timestamp}`, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch BIN info for ${bin}`);
          }
          
          const data = await response.json();
          
          // Update the card with fresh BIN info
          setCustomer(prevCustomer => {
            if (!prevCustomer) return null;
            
            const updatedCreditCards = [...prevCustomer.creditCards];
            updatedCreditCards[i] = {
              ...updatedCreditCards[i],
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
                isLoading: false,
                lastUpdated: new Date().toISOString()
              }
            };
            
            return {
              ...prevCustomer,
              creditCards: updatedCreditCards
            };
          });
        } catch (error) {
          console.error(`Error refreshing BIN info for card ${card.id}:`, error);
          
          // Update error state for this card
          setCustomer(prevCustomer => {
            if (!prevCustomer) return null;
            
            const updatedCreditCards = [...prevCustomer.creditCards];
            updatedCreditCards[i] = {
              ...updatedCreditCards[i],
              binInfo: {
                ...(updatedCreditCards[i].binInfo || {}),
                isLoading: false,
                error: "Failed to refresh BIN information"
              }
            };
            
            return {
              ...prevCustomer,
              creditCards: updatedCreditCards
            };
          });
        }
      }
      
      toast.success("BIN information refreshed successfully");
    } catch (error) {
      console.error("Error refreshing BIN information:", error);
      toast.error("Failed to refresh BIN information");
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

  // Add a function to format date of birth consistently as MM/DD/YY
  const formatDateOfBirth = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // Save customer notes
  const saveCustomerNotes = async () => {
    if (!customer) return;
    
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/customers/${customer.id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notesValue }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save notes');
      }
      
      const updatedCustomer = await response.json();
      setCustomer(updatedCustomer);
      setIsEditingNotes(false);
      toast.success('Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Cancel notes editing
  const cancelNotesEditing = () => {
    setNotesValue(customer?.notes || "");
    setIsEditingNotes(false);
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
      <Card shadow="sm" radius="md" withBorder mb="xl" bg={isDark ? "#1A1A1A" : undefined}>
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
        <Card shadow="sm" radius="md" withBorder bg={isDark ? "#1A1A1A" : undefined}>
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
                  <CopyableText value={`${customer.firstName} ${customer.lastName}`}>
                    <Text>{customer.firstName} {customer.lastName}</Text>
                  </CopyableText>
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
                  <CopyableText value={customer.email}>
                    <Text>{customer.email}</Text>
                  </CopyableText>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="xl" color="blue" variant="light">
                      <IconMail size="0.8rem" />
                    </ThemeIcon>
                    <Text fw={500}>Secondary Email</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  {customer.secondaryEmail ? (
                    <CopyableText value={customer.secondaryEmail}>
                      <Text>{customer.secondaryEmail}</Text>
                    </CopyableText>
                  ) : (
                    <Text c="dimmed">Not provided</Text>
                  )}
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
                  <CopyableText value={customer.phone}>
                    <Text>{formatPhoneNumber(customer.phone)}</Text>
                  </CopyableText>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="xl" color="blue" variant="light">
                      <IconPhone size="0.8rem" />
                    </ThemeIcon>
                    <Text fw={500}>Secondary Phone</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  {customer.secondaryPhone ? (
                    <CopyableText value={customer.secondaryPhone}>
                      <Text>{formatPhoneNumber(customer.secondaryPhone)}</Text>
                    </CopyableText>
                  ) : (
                    <Text c="dimmed">Not provided</Text>
                  )}
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
                  <CopyableText value={customer.ssn}>
                    <Text>{formatSSN(customer.ssn)}</Text>
                  </CopyableText>
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
                  <CopyableText value={formatDateOfBirth(customer.dateOfBirth)}>
                    <Text>{formatDateOfBirth(customer.dateOfBirth)}</Text>
                  </CopyableText>
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
                    <CopyableText value={customer.driverLicense}>
                      <Text>{customer.driverLicense}</Text>
                    </CopyableText>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Card>
        
        {/* Address Information */}
        <Card shadow="sm" radius="md" withBorder bg={isDark ? "#1A1A1A" : undefined}>
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
                  <CopyableText value={customer.address}>
                    <Text>{customer.address}</Text>
                  </CopyableText>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>City</Text>
                </Table.Td>
                <Table.Td>
                  <CopyableText value={customer.city}>
                    <Text>{customer.city}</Text>
                  </CopyableText>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>State</Text>
                </Table.Td>
                <Table.Td>
                  <CopyableText value={customer.state}>
                    <Text>{customer.state}</Text>
                  </CopyableText>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>Zip Code</Text>
                </Table.Td>
                <Table.Td>
                  <CopyableText value={customer.zipCode}>
                    <Text>{customer.zipCode}</Text>
                  </CopyableText>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>Customer Since</Text>
                </Table.Td>
                <Table.Td>
                  <CopyableText value={new Date(customer.createdAt).toLocaleDateString()}>
                    <Text>{new Date(customer.createdAt).toLocaleDateString()}</Text>
                  </CopyableText>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>Last Updated</Text>
                </Table.Td>
                <Table.Td>
                  <CopyableText value={new Date(customer.updatedAt).toLocaleDateString()}>
                    <Text>{new Date(customer.updatedAt).toLocaleDateString()}</Text>
                  </CopyableText>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>
      </SimpleGrid>

      {/* Customer Notes */}
      <Card shadow="sm" radius="md" withBorder mb="xl" bg={isDark ? "#1A1A1A" : undefined}>
        <Card.Section withBorder inheritPadding py="xs" mb="md">
          <Group justify="apart">
            <Group>
              <IconUser size="1.2rem" color="var(--mantine-color-blue-6)" />
              <Title order={4}>Customer Notes</Title>
            </Group>
            {!isEditingNotes ? (
              <ActionIcon 
                variant="subtle" 
                color="blue" 
                onClick={() => setIsEditingNotes(true)}
                disabled={loading || isDeleting}
              >
                <IconEdit size="1rem" />
              </ActionIcon>
            ) : (
              <Group gap="xs">
                <ActionIcon 
                  variant="subtle" 
                  color="red" 
                  onClick={cancelNotesEditing}
                  disabled={savingNotes}
                >
                  <IconX size="1rem" />
                </ActionIcon>
                <ActionIcon 
                  variant="subtle" 
                  color="green" 
                  onClick={saveCustomerNotes}
                  loading={savingNotes}
                >
                  <IconDeviceFloppy size="1rem" />
                </ActionIcon>
              </Group>
            )}
          </Group>
        </Card.Section>
        
        <Box p="md">
          {!isEditingNotes ? (
            customer?.notes ? (
              <Text>{customer.notes}</Text>
            ) : (
              <Text c="dimmed">No notes available for this customer.</Text>
            )
          ) : (
            <Textarea
              placeholder="Add notes about this customer..."
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              minRows={3}
              disabled={savingNotes}
              autosize
            />
          )}
        </Box>
      </Card>

      {/* Credit Card Information */}
      <Card shadow="sm" radius="md" withBorder mb="xl" bg={isDark ? "#1A1A1A" : undefined}>
        <Card.Section withBorder inheritPadding py="xs" mb="md">
          <Group justify="apart">
            <Group>
              <IconCreditCard size="1.2rem" color="var(--mantine-color-blue-6)" />
              <Title order={4}>Credit Cards</Title>
            </Group>
            <Button 
              variant="light" 
              size="xs"
              leftSection={<IconRefresh size={14} />}
              onClick={refreshBinInfo}
              loading={refreshingBin}
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
                            <CopyableText value={card.cardholderName}>
                              <Text>{card.cardholderName}</Text>
                            </CopyableText>
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Text fw={500}>Card Number</Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <CopyableText value={formatCardNumber(card.cardNumber)}>
                                <Text>{formatCardNumber(card.cardNumber)}</Text>
                              </CopyableText>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Text fw={500}>Expiration</Text>
                          </Table.Td>
                          <Table.Td>
                            <CopyableText value={`${card.expiryMonth}/${card.expiryYear}`}>
                              <Text>{card.expiryMonth}/{card.expiryYear}</Text>
                            </CopyableText>
                          </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                          <Table.Td>
                            <Text fw={500}>CVV</Text>
                          </Table.Td>
                          <Table.Td>
                            <CopyableText value={card.cvv}>
                              <Text>{card.cvv}</Text>
                            </CopyableText>
                          </Table.Td>
                        </Table.Tr>
                      </Table.Tbody>
                    </Table>
                  </div>
                  
                  <div>
                    <Title order={5} mb="md">BIN Information</Title>
                    {card.binInfo?.isLoading ? (
                      <Flex align="center" gap="xs">
                        <Loader size="xs" />
                        <Text size="xs" c="dimmed">Loading BIN information...</Text>
                      </Flex>
                    ) : (
                      <>
                        <Group justify="space-between" mb="xs">
                          <Text fw={500} size="sm">BIN Information</Text>
                          {card.binInfo?.lastUpdated && (
                            <Text size="xs" c="dimmed">
                              Last updated: {new Date(card.binInfo.lastUpdated).toLocaleString()}
                            </Text>
                          )}
                        </Group>
                        <SimpleGrid cols={2} spacing="xs" mb="md">
                          <div>
                            <Text size="xs" c="dimmed">BIN</Text>
                            <CopyableText value={card.cardNumber.slice(0, 6) || ""}>
                              <Text>{card.cardNumber.slice(0, 6) || "—"}</Text>
                            </CopyableText>
                          </div>
                          <div>
                            <Text size="xs" c="dimmed">Scheme</Text>
                            <CopyableText value={card.binInfo?.scheme || ""}>
                              <Text tt="capitalize">{card.binInfo?.scheme || "—"}</Text>
                            </CopyableText>
                          </div>
                          <div>
                            <Text size="xs" c="dimmed">Type</Text>
                            <CopyableText value={card.binInfo?.type || ""}>
                              <Text tt="capitalize">{card.binInfo?.type || "—"}</Text>
                            </CopyableText>
                          </div>
                          <div>
                            <Text size="xs" c="dimmed">Brand</Text>
                            <CopyableText value={card.binInfo?.brand || ""}>
                              <Text>{card.binInfo?.brand || "—"}</Text>
                            </CopyableText>
                          </div>
                          <div>
                            <Text size="xs" c="dimmed">Country</Text>
                            <CopyableText value={card.binInfo?.country?.name || ""}>
                              <Text>{card.binInfo?.country?.name || "—"}</Text>
                            </CopyableText>
                          </div>
                          <div>
                            <Text size="xs" c="dimmed">Bank</Text>
                            <CopyableText value={card.binInfo?.bank?.name || ""}>
                              <Text>{card.binInfo?.bank?.name || "—"}</Text>
                            </CopyableText>
                          </div>
                        </SimpleGrid>
                        {card.binInfo?.error && (
                          <Text c="red" size="xs">{card.binInfo.error}</Text>
                        )}
                      </>
                    )}
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
        title="Delete Customer"
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