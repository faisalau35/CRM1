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
  IconFileSpreadsheet,
  IconFile,
  IconFileText,
} from "@tabler/icons-react";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  secondaryEmail?: string;
  phone: string;
  secondaryPhone?: string;
  address?: string;
  city: string;
  state: string;
  zipCode?: string;
  dateOfBirth?: string;
  ssn?: string;
  driverLicense?: string;
  notes?: string;
  status: 'IN_PROGRESS' | 'ENGAGED' | 'DEAD';
  createdAt: string;
  creditCards?: CreditCard[];
}

interface CreditCard {
  id: string;
  cardNumber: string;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
  bankName?: string;
  cardType?: string;
  scheme?: string;
  country?: string;
  bin?: string;
  isDefault?: boolean;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const itemsPerPage = 25;

  // Fetch customers on component mount
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch('/api/customers?includeAll=true');
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

  // Update customer status
  const updateCustomerStatus = async (customerId: string, newStatus: 'IN_PROGRESS' | 'ENGAGED' | 'DEAD') => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update customer status');
      }

      // Update local state
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === customerId 
            ? { ...customer, status: newStatus } 
            : customer
        )
      );

      toast.success(`Customer status updated to ${newStatus.toLowerCase().replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating customer status:', error);
      toast.error('Failed to update customer status');
    }
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      (customer.firstName?.toLowerCase() || '').includes(searchTerm) ||
      (customer.lastName?.toLowerCase() || '').includes(searchTerm) ||
      (customer.email?.toLowerCase() || '').includes(searchTerm) ||
      (customer.phone?.toLowerCase() || '').includes(searchTerm) ||
      (customer.city?.toLowerCase() || '').includes(searchTerm) ||
      (customer.state?.toLowerCase() || '').includes(searchTerm) ||
      (customer.status?.toLowerCase() || '').includes(searchTerm)
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

  // Helper function to get data to export based on selection criteria
  const getDataToExport = async (exportSelected = false): Promise<Customer[]> => {
    try {
      // Determine which customer IDs to export
      let customerIds: string[] = [];
      
      if (exportSelected && selectedCustomers.length > 0) {
        customerIds = selectedCustomers;
      } else if (searchQuery) {
        customerIds = filteredCustomers.map(customer => customer.id);
      } else {
        customerIds = customers.map(customer => customer.id);
      }
      
      if (customerIds.length === 0) {
        return [];
      }
      
      // Fetch complete data for these customers
      const response = await fetch('/api/customers/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerIds }),
      });
      
      if (!response.ok) {
        // If the export endpoint fails, fall back to using the data we already have
        console.warn('Export API failed, using existing data');
        
        // Log the error for debugging
        const errorText = await response.text();
        console.error('Export API error:', response.status, errorText);
        
        // Fall back to existing data
        if (exportSelected && selectedCustomers.length > 0) {
          return customers.filter(customer => selectedCustomers.includes(customer.id));
        } else if (searchQuery) {
          return filteredCustomers;
        }
        return customers;
      }
      
      const completeData = await response.json();
      console.log(`Received ${completeData.length} customers from export API`);
      
      // Check if credit cards are included
      const hasCreditCards = completeData.some((customer: any) => 
        customer.creditCards && customer.creditCards.length > 0
      );
      console.log(`Credit cards included in export data: ${hasCreditCards}`);
      
      return completeData as Customer[];
    } catch (error) {
      console.error('Error fetching complete customer data:', error);
      // Fall back to using the data we already have
      if (exportSelected && selectedCustomers.length > 0) {
        return customers.filter(customer => selectedCustomers.includes(customer.id));
      } else if (searchQuery) {
        return filteredCustomers;
      }
      return customers;
    }
  };

  // Export customers to CSV
  const exportCustomersToCSV = async (exportSelected = false) => {
    try {
      setIsExporting(true);
      
      // Show warning about unmasked credit card data
      toast.warning('Warning: Credit card numbers will be exported unmasked', {
        description: 'Please ensure you handle this sensitive data securely.',
        duration: 5000
      });
      
      // Get data to export
      const dataToExport = await getDataToExport(exportSelected);
      
      // Find the maximum number of credit cards any customer has
      const maxCreditCards = dataToExport.reduce((max, customer) => {
        const cardCount = customer.creditCards?.length || 0;
        return cardCount > max ? cardCount : max;
      }, 0);
      
      // Create CSV headers - include all possible customer fields
      const headers = [
        'ID',
        'First Name',
        'Last Name',
        'Email',
        'Secondary Email',
        'Phone',
        'Secondary Phone',
        'Address',
        'City',
        'State',
        'Zip Code',
        'Date of Birth',
        'SSN',
        'Driver License',
        'Notes',
        'Status',
        'Created Date'
      ];
      
      // Add credit card headers based on the maximum number of cards
      for (let i = 0; i < maxCreditCards; i++) {
        const cardPrefix = `Card ${i + 1}`;
        headers.push(
          `${cardPrefix} - Number`,
          `${cardPrefix} - Cardholder Name`,
          `${cardPrefix} - Expiry`,
          `${cardPrefix} - Type`,
          `${cardPrefix} - Bank`
        );
      }
      
      // Convert customer data to CSV rows with all available fields
      const csvRows = dataToExport.map((customer: Customer) => {
        // Start with basic customer data
        const rowData = [
          customer.id,
          customer.firstName || '',
          customer.lastName || '',
          customer.email || '',
          customer.secondaryEmail || '',
          customer.phone || '',
          customer.secondaryPhone || '',
          customer.address || '',
          customer.city || '',
          customer.state || '',
          customer.zipCode || '',
          customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : '',
          customer.ssn || '',
          customer.driverLicense || '',
          customer.notes || '',
          customer.status || '',
          new Date(customer.createdAt).toLocaleDateString()
        ];
        
        // Add credit card data
        if (customer.creditCards && customer.creditCards.length > 0) {
          customer.creditCards.forEach((card, index) => {
            if (index < maxCreditCards) {
              rowData.push(
                card.cardNumber || '',
                card.cardholderName || '',
                `${card.expiryMonth || ''}/${card.expiryYear || ''}`,
                card.cardType || '',
                card.bankName || ''
              );
            }
          });
          
          // Fill in empty cells for customers with fewer cards
          const remainingCards = maxCreditCards - customer.creditCards.length;
          for (let i = 0; i < remainingCards; i++) {
            rowData.push('', '', '', '', ''); // Empty cells for each missing card (5 fields per card)
          }
        } else {
          // No credit cards, add empty cells
          for (let i = 0; i < maxCreditCards; i++) {
            rowData.push('', '', '', '', ''); // Empty cells for each card (5 fields per card)
          }
        }
        
        return rowData;
      });
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...csvRows.map((row: any[]) => row.map((cell: any) => 
          // Escape commas and quotes in the data
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(','))
      ].join('\n');
      
      // Create a Blob with the CSV data
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create a download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Set up the download
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      // Add to document, trigger download, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Successfully exported ${dataToExport.length} customers to CSV`);
    } catch (error) {
      console.error('Error exporting customers to CSV:', error);
      toast.error('Failed to export customers');
    } finally {
      setIsExporting(false);
    }
  };

  // Export customers to JSON - already includes all data by default
  const exportCustomersToJSON = async (exportSelected = false) => {
    try {
      setIsExporting(true);
      
      // Show warning about unmasked credit card data
      toast.warning('Warning: Credit card numbers will be exported unmasked', {
        description: 'Please ensure you handle this sensitive data securely.',
        duration: 5000
      });
      
      // Get data to export - JSON naturally includes all fields
      const dataToExport = await getDataToExport(exportSelected);
      
      // Convert to JSON string with pretty formatting
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      
      // Create a Blob with the JSON data
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      // Create a download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Set up the download
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      
      // Add to document, trigger download, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Successfully exported ${dataToExport.length} customers to JSON`);
    } catch (error) {
      console.error('Error exporting customers to JSON:', error);
      toast.error('Failed to export customers');
    } finally {
      setIsExporting(false);
    }
  };

  // Export customers to Excel (XLSX)
  const exportCustomersToExcel = async (exportSelected = false) => {
    try {
      setIsExporting(true);
      
      // Show warning about unmasked credit card data
      toast.warning('Warning: Credit card numbers will be exported unmasked', {
        description: 'Please ensure you handle this sensitive data securely.',
        duration: 5000
      });
      
      // Get data to export
      const dataToExport = await getDataToExport(exportSelected);
      
      // Dynamically import the xlsx library (to reduce initial bundle size)
      let XLSX;
      try {
        XLSX = await import('xlsx').then(mod => mod.default || mod);
      } catch (importError) {
        console.error('Error importing xlsx library:', importError);
        toast.error('Failed to load Excel export library. Please try again or use CSV export instead.');
        setIsExporting(false);
        return;
      }
      
      // Prepare data for Excel with all available fields
      const worksheetData = dataToExport.map((customer: Customer) => {
        // Create a base object with all standard customer fields
        const customerData: Record<string, any> = {
          ID: customer.id,
          'First Name': customer.firstName || '',
          'Last Name': customer.lastName || '',
          'Email': customer.email || '',
          'Secondary Email': customer.secondaryEmail || '',
          'Phone': customer.phone || '',
          'Secondary Phone': customer.secondaryPhone || '',
          'Address': customer.address || '',
          'City': customer.city || '',
          'State': customer.state || '',
          'Zip Code': customer.zipCode || '',
          'Date of Birth': customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : '',
          'SSN': customer.ssn || '',
          'Driver License': customer.driverLicense || '',
          'Notes': customer.notes || '',
          'Status': customer.status || '',
          'Created Date': new Date(customer.createdAt).toLocaleDateString()
        };
        
        // Add credit card information if available
        if (customer.creditCards && customer.creditCards.length > 0) {
          customer.creditCards.forEach((card, index) => {
            const prefix = `Credit Card ${index + 1}`;
            customerData[`${prefix} - Card Number`] = card.cardNumber || '';
            customerData[`${prefix} - Cardholder Name`] = card.cardholderName || '';
            customerData[`${prefix} - Expiry`] = `${card.expiryMonth || ''}/${card.expiryYear || ''}`;
            customerData[`${prefix} - Type`] = card.cardType || '';
            customerData[`${prefix} - Bank`] = card.bankName || '';
            customerData[`${prefix} - Default`] = card.isDefault ? 'Yes' : 'No';
            if (card.scheme) customerData[`${prefix} - Scheme`] = card.scheme;
            if (card.country) customerData[`${prefix} - Country`] = card.country;
            if (card.bin) customerData[`${prefix} - BIN`] = card.bin;
          });
        }
        
        // Add any other custom fields that might be in the data
        Object.entries(customer).forEach(([key, value]) => {
          if (!customerData[key] && key !== 'creditCards' && value !== null && value !== undefined) {
            customerData[key] = value;
          }
        });
        
        return customerData;
      });
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Create Blob and download
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `customers_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Successfully exported ${dataToExport.length} customers to Excel`);
    } catch (error) {
      console.error('Error exporting customers to Excel:', error);
      toast.error('Failed to export customers to Excel. You may need to install the xlsx package.');
    } finally {
      setIsExporting(false);
    }
  };

  // Debug function to check customer data
  const debugCustomerData = async () => {
    try {
      // Get selected customer IDs or use the first customer if none selected
      const customerIds = selectedCustomers.length > 0 
        ? selectedCustomers 
        : customers.length > 0 ? [customers[0].id] : [];
      
      if (customerIds.length === 0) {
        toast.error('No customers available to debug');
        return;
      }

      toast.info('Debugging customer data...', {
        description: 'Check the browser console for detailed information'
      });
      
      console.log('Selected customer IDs for debugging:', customerIds);
      
      // Check if we have credit cards in the local state
      const localCustomers = customers.filter(c => customerIds.includes(c.id));
      console.log('Local customer data:', localCustomers);
      
      const localCreditCards = localCustomers.flatMap(c => c.creditCards || []);
      console.log(`Found ${localCreditCards.length} credit cards in local state`);
      
      // Fetch complete data for these customers
      console.log('Fetching data from API...');
      const response = await fetch('/api/customers/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerIds }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export API error:', response.status, errorText);
        toast.error(`API Error: ${response.status} - ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Customer data from API:', data);
      
      // Check if credit cards are included
      const creditCardInfo = data.map((customer: Customer) => ({
        customerId: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        hasCards: customer.creditCards && customer.creditCards.length > 0,
        cardCount: customer.creditCards?.length || 0,
        cards: customer.creditCards || []
      }));
      
      console.table(creditCardInfo);
      
      // Compare with direct API call to /api/customers/:id
      console.log('Fetching individual customer data for comparison...');
      const individualResponses = await Promise.all(
        customerIds.slice(0, 3).map(async (id) => {
          try {
            const response = await fetch(`/api/customers/${id}`);
            if (!response.ok) {
              return { id, error: `Status ${response.status}` };
            }
            const data = await response.json();
            return { 
              id, 
              data,
              hasCards: data.creditCards && data.creditCards.length > 0,
              cardCount: data.creditCards?.length || 0
            };
          } catch (error) {
            return { id, error: String(error) };
          }
        })
      );
      
      console.log('Individual customer API responses:', individualResponses);
      
      // Try a direct fetch to the credit cards API if it exists
      try {
        const cardResponse = await fetch(`/api/customers/${customerIds[0]}/credit-cards`);
        if (cardResponse.ok) {
          const cardData = await cardResponse.json();
          console.log('Direct credit card API response:', cardData);
        }
      } catch (error) {
        console.log('No direct credit card API available');
      }
      
      toast.success(`Debug info logged to console for ${data.length} customers`);
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Error debugging customer data');
    }
  };

  // Debug function to check database schema
  const debugDatabaseSchema = async () => {
    try {
      toast.info('Checking database schema...', {
        description: 'Check the browser console for detailed information'
      });
      
      const response = await fetch('/api/debug/schema');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Schema API error:', response.status, errorText);
        toast.error(`API Error: ${response.status} - ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log('Database schema information:', data);
      
      // Log specific information about credit cards
      console.log('Credit Card table exists:', data.tables.some((t: any) => t.table_name === 'CreditCard'));
      console.log('Credit Card columns:', data.creditCardColumns);
      console.log('Foreign keys:', data.foreignKeys);
      console.log('Credit Card count:', data.counts.creditCards);
      console.log('Sample credit cards:', data.samples.creditCards);
      console.log('Linked cards for sample customers:', data.samples.linkedCards);
      
      toast.success('Database schema information logged to console');
    } catch (error) {
      console.error('Error checking schema:', error);
      toast.error('Error checking database schema');
    }
  };

  // Function to check credit card debug info
  const debugCreditCards = async () => {
    try {
      toast.info('Checking credit card debug info...');
      
      const response = await fetch('/api/debug/credit-cards');
      
      if (!response.ok) {
        console.error('Credit card debug API error:', response.status);
        toast.error('Failed to fetch credit card debug info');
        return;
      }
      
      const data = await response.json();
      console.log('Credit card debug data:', data);
      
      if (data.exists) {
        toast.success(`Found ${data.count} credit cards in database`);
        
        if (data.count > 0) {
          console.log('Credit card columns:', data.columns);
          console.log('Credit card foreign keys:', data.foreignKeys);
          console.log('Credit card distribution:', data.distribution);
          console.log('Customers with multiple cards:', data.customersWithMultipleCards);
          
          toast.success('Credit card debug info logged to console', {
            description: 'Check browser console for details'
          });
        }
      } else {
        toast.error('Credit card table does not exist in the database');
      }
    } catch (error) {
      console.error('Error checking credit card debug info:', error);
      toast.error('Error checking credit card debug info');
    }
  };

  // Function to directly check if a customer has credit cards
  const checkCustomerCreditCards = async (customerId: string) => {
    try {
      toast.info('Checking credit cards...', {
        description: `Looking for credit cards for customer ${customerId.substring(0, 8)}`
      });
      
      // First try the direct credit card endpoint
      const response = await fetch(`/api/customers/${customerId}/credit-cards`);
      
      if (!response.ok) {
        console.error('Credit card API error:', response.status);
        
        // Fall back to direct database query via the debug schema endpoint
        const schemaResponse = await fetch('/api/debug/schema');
        if (schemaResponse.ok) {
          const schemaData = await schemaResponse.json();
          console.log('Schema data:', schemaData);
          
          // Check if there are any credit cards in the database
          if (schemaData.counts.creditCards === 0) {
            toast.error('No credit cards exist in the database');
            return;
          }
          
          // Try to find any credit cards for this customer
          const directQuery = await fetch('/api/customers/export', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ customerIds: [customerId] }),
          });
          
          if (directQuery.ok) {
            const queryData = await directQuery.json();
            console.log('Direct query result:', queryData);
            
            if (queryData.length > 0 && queryData[0].creditCards && queryData[0].creditCards.length > 0) {
              toast.success(`Found ${queryData[0].creditCards.length} credit cards via export API`);
            } else {
              toast.error('No credit cards found via export API');
            }
          }
          
          return;
        }
        
        toast.error('Failed to check credit cards');
        return;
      }
      
      const data = await response.json();
      console.log('Credit card data:', data);
      
      if (data.creditCards && data.creditCards.length > 0) {
        toast.success(`Found ${data.creditCards.length} credit cards for customer`);
      } else {
        toast.error('No credit cards found for this customer');
      }
    } catch (error) {
      console.error('Error checking credit cards:', error);
      toast.error('Error checking credit cards');
    }
  };

  // Function to test export API for credit cards
  const testExportForCreditCards = async () => {
    try {
      toast.info('Testing export API for credit cards...');
      
      // Get a sample of customers to test
      const response = await fetch('/api/customers?limit=5');
      
      if (!response.ok) {
        console.error('Failed to fetch customers:', response.status);
        toast.error('Failed to fetch customers for export test');
        return;
      }
      
      const data = await response.json();
      
      if (!data.customers || data.customers.length === 0) {
        toast.error('No customers found for export test');
        return;
      }
      
      console.log('Testing export with customers:', data.customers.map((c: any) => c.id));
      
      // Test export API with these customers
      const exportResponse = await fetch('/api/customers/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          customerIds: data.customers.map((c: any) => c.id),
          format: 'json'
        }),
      });
      
      if (!exportResponse.ok) {
        console.error('Export API error:', exportResponse.status);
        toast.error('Export API test failed');
        return;
      }
      
      const exportData = await exportResponse.json();
      console.log('Export API test result:', exportData);
      
      // Check if credit cards are included
      let customersWithCards = 0;
      let totalCards = 0;
      
      exportData.forEach((customer: any) => {
        if (customer.creditCards && customer.creditCards.length > 0) {
          customersWithCards++;
          totalCards += customer.creditCards.length;
        }
      });
      
      if (totalCards > 0) {
        toast.success(`Export API test successful: Found ${totalCards} credit cards for ${customersWithCards}/${exportData.length} customers`);
      } else {
        toast.warning('Export API test: No credit cards found in exported data');
      }
      
      console.log('Export API credit card test complete');
    } catch (error) {
      console.error('Error testing export API:', error);
      toast.error('Error testing export API for credit cards');
    }
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
      <Card shadow="sm" p="md" radius="md" withBorder mb="lg">
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
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button 
                  variant="outline" 
                  leftSection={<IconDownload size={16} />}
                  size="sm"
                  loading={isExporting}
                  disabled={customers.length === 0}
                >
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Export Format</Menu.Label>
                <Menu.Item 
                  leftSection={<IconFile size={14} />}
                  onClick={() => exportCustomersToCSV(false)}
                  disabled={customers.length === 0}
                >
                  Export All to CSV
                </Menu.Item>
                <Menu.Item 
                  leftSection={<IconFileText size={14} />}
                  onClick={() => exportCustomersToJSON(false)}
                  disabled={customers.length === 0}
                >
                  Export All to JSON
                </Menu.Item>
                <Menu.Item 
                  leftSection={<IconFileSpreadsheet size={14} />}
                  onClick={() => exportCustomersToExcel(false)}
                  disabled={customers.length === 0}
                >
                  Export All to Excel
                </Menu.Item>
                
                {selectedCustomers.length > 0 && (
                  <>
                    <Menu.Divider />
                    <Menu.Label>Selected Customers</Menu.Label>
                    <Menu.Item 
                      leftSection={<IconFile size={14} />}
                      onClick={() => exportCustomersToCSV(true)}
                    >
                      Export Selected to CSV ({selectedCustomers.length})
                    </Menu.Item>
                    <Menu.Item 
                      leftSection={<IconFileText size={14} />}
                      onClick={() => exportCustomersToJSON(true)}
                    >
                      Export Selected to JSON ({selectedCustomers.length})
                    </Menu.Item>
                    <Menu.Item 
                      leftSection={<IconFileSpreadsheet size={14} />}
                      onClick={() => exportCustomersToExcel(true)}
                    >
                      Export Selected to Excel ({selectedCustomers.length})
                    </Menu.Item>
                  </>
                )}
                
                {searchQuery && (
                  <>
                    <Menu.Divider />
                    <Menu.Label>Filtered Results</Menu.Label>
                    <Menu.Item 
                      leftSection={<IconFile size={14} />}
                      onClick={() => exportCustomersToCSV(false)}
                      disabled={filteredCustomers.length === 0}
                    >
                      Export Filtered to CSV ({filteredCustomers.length})
                    </Menu.Item>
                    <Menu.Item 
                      leftSection={<IconFileText size={14} />}
                      onClick={() => exportCustomersToJSON(false)}
                      disabled={filteredCustomers.length === 0}
                    >
                      Export Filtered to JSON ({filteredCustomers.length})
                    </Menu.Item>
                    <Menu.Item 
                      leftSection={<IconFileSpreadsheet size={14} />}
                      onClick={() => exportCustomersToExcel(false)}
                      disabled={filteredCustomers.length === 0}
                    >
                      Export Filtered to Excel ({filteredCustomers.length})
                    </Menu.Item>
                  </>
                )}
                
                {/* Debug option - only visible in development */}
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <Menu.Divider />
                    <Menu.Label>Debug</Menu.Label>
                    <Menu.Item 
                      onClick={debugCustomerData}
                      color="orange"
                    >
                      Debug Customer Data
                    </Menu.Item>
                    <Menu.Item 
                      onClick={debugDatabaseSchema}
                      color="orange"
                    >
                      Check Database Schema
                    </Menu.Item>
                    <Menu.Item 
                      onClick={debugCreditCards}
                      color="purple"
                    >
                      Check Credit Card Debug
                    </Menu.Item>
                    
                    <Menu.Item 
                      onClick={testExportForCreditCards}
                      color="green"
                    >
                      Test Export API
                    </Menu.Item>
                    
                    <Menu.Item 
                      onClick={() => router.push('/dashboard/debug/credit-cards')}
                      color="blue"
                    >
                      Credit Card Debug Page
                    </Menu.Item>
                    
                    {selectedCustomers.length === 1 && (
                      <Menu.Item 
                        onClick={() => checkCustomerCreditCards(selectedCustomers[0])}
                        color="blue"
                      >
                        Check Credit Cards
                      </Menu.Item>
                    )}
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
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

        <Divider mb="sm" />

        <Group justify="space-between" mb="sm">
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
          <Table highlightOnHover withColumnBorders striped style={{ '& td, & th': { padding: '8px' } }}>
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
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th style={{ width: 80 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedCustomers.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
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
                        <Avatar color="blue" radius="xl" size="sm">
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
                      <Badge 
                        variant="filled" 
                        color={
                          customer.status === 'IN_PROGRESS' ? 'green' : 
                          customer.status === 'ENGAGED' ? 'yellow' : 
                          'red'
                        }
                        size="xs"
                      >
                        {customer.status === 'IN_PROGRESS' ? 'In Progress' : 
                         customer.status === 'ENGAGED' ? 'Engaged' : 
                         'Dead'}
                      </Badge>
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
                            size="xs"
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit">
                          <ActionIcon 
                            variant="subtle" 
                            component={Link} 
                            href={`/dashboard/customers/${customer.id}/edit`}
                            size="xs"
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
                            <Menu.Label>Actions</Menu.Label>
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
                            <Menu.Divider />
                            <Menu.Label>Update Status</Menu.Label>
                            <Menu.Item 
                              leftSection={<div style={{ width: rem(14), height: rem(14), backgroundColor: 'green', borderRadius: '50%' }} />}
                              onClick={() => updateCustomerStatus(customer.id, 'IN_PROGRESS')}
                              disabled={customer.status === 'IN_PROGRESS'}
                            >
                              In Progress
                            </Menu.Item>
                            <Menu.Item 
                              leftSection={<div style={{ width: rem(14), height: rem(14), backgroundColor: 'yellow', borderRadius: '50%' }} />}
                              onClick={() => updateCustomerStatus(customer.id, 'ENGAGED')}
                              disabled={customer.status === 'ENGAGED'}
                            >
                              Engaged
                            </Menu.Item>
                            <Menu.Item 
                              leftSection={<div style={{ width: rem(14), height: rem(14), backgroundColor: 'red', borderRadius: '50%' }} />}
                              onClick={() => updateCustomerStatus(customer.id, 'DEAD')}
                              disabled={customer.status === 'DEAD'}
                            >
                              Dead
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
          <Group justify="space-between" mt="md">
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