'use client';

import { useState, useEffect } from 'react';
import { Card, Text, Title, Button, Group, Badge, Loader, Alert, Table, Tabs, Code, Accordion } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCreditCard, IconDatabase, IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export default function CreditCardDebugPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [exportTestData, setExportTestData] = useState<any>(null);
  const [directTestData, setDirectTestData] = useState<any>(null);
  const router = useRouter();

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/debug/credit-cards');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setDebugData(data);
      console.log('Credit card debug data:', data);
    } catch (error) {
      console.error('Error fetching debug data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testExportAPI = async () => {
    notifications.show({
      title: 'Testing Export API',
      message: 'Checking if credit cards are included in exports...',
      loading: true,
      autoClose: false,
      id: 'export-test'
    });
    
    try {
      // Get a sample of customers to test
      const response = await fetch('/api/customers?limit=5');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.customers || data.customers.length === 0) {
        throw new Error('No customers found for export test');
      }
      
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
        throw new Error(`Export API error: ${exportResponse.status}`);
      }
      
      const exportData = await exportResponse.json();
      setExportTestData({
        customers: data.customers,
        exportResult: exportData
      });
      
      // Check if credit cards are included
      let customersWithCards = 0;
      let totalCards = 0;
      
      exportData.forEach((customer: any) => {
        if (customer.creditCards && customer.creditCards.length > 0) {
          customersWithCards++;
          totalCards += customer.creditCards.length;
        }
      });
      
      notifications.update({
        id: 'export-test',
        title: 'Export API Test',
        message: totalCards > 0 
          ? `Found ${totalCards} credit cards for ${customersWithCards}/${exportData.length} customers` 
          : 'No credit cards found in exported data',
        color: totalCards > 0 ? 'green' : 'yellow',
        icon: totalCards > 0 ? <IconCheck size="1.1rem" /> : <IconAlertCircle size="1.1rem" />,
        loading: false,
        autoClose: 5000
      });
    } catch (error) {
      console.error('Error testing export API:', error);
      notifications.update({
        id: 'export-test',
        title: 'Export API Test Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        color: 'red',
        icon: <IconX size="1.1rem" />,
        loading: false,
        autoClose: 5000
      });
    }
  };

  const testDirectAPI = async () => {
    notifications.show({
      title: 'Testing Direct API',
      message: 'Checking if credit cards can be fetched directly...',
      loading: true,
      autoClose: false,
      id: 'direct-test'
    });
    
    try {
      // Get a sample customer to test
      const response = await fetch('/api/customers?limit=1');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customer: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.customers || data.customers.length === 0) {
        throw new Error('No customers found for direct test');
      }
      
      const customerId = data.customers[0].id;
      
      // Test direct credit card API
      const directResponse = await fetch(`/api/customers/${customerId}/credit-cards`);
      
      if (!directResponse.ok) {
        throw new Error(`Direct API error: ${directResponse.status}`);
      }
      
      const directData = await directResponse.json();
      setDirectTestData({
        customer: data.customers[0],
        creditCardData: directData
      });
      
      const cardCount = directData.creditCards ? directData.creditCards.length : 0;
      
      notifications.update({
        id: 'direct-test',
        title: 'Direct API Test',
        message: cardCount > 0 
          ? `Found ${cardCount} credit cards for customer ${data.customers[0].firstName} ${data.customers[0].lastName}` 
          : 'No credit cards found for this customer',
        color: cardCount > 0 ? 'green' : 'yellow',
        icon: cardCount > 0 ? <IconCheck size="1.1rem" /> : <IconAlertCircle size="1.1rem" />,
        loading: false,
        autoClose: 5000
      });
    } catch (error) {
      console.error('Error testing direct API:', error);
      notifications.update({
        id: 'direct-test',
        title: 'Direct API Test Failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        color: 'red',
        icon: <IconX size="1.1rem" />,
        loading: false,
        autoClose: 5000
      });
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <Group justify="space-between" mb="md">
        <Title order={2}>Credit Card Debug</Title>
        <Group>
          <Button onClick={() => router.push('/dashboard/customers')} variant="outline">
            Back to Customers
          </Button>
          <Button onClick={fetchDebugData} loading={loading}>
            Refresh Data
          </Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" mb="md">
          {error}
        </Alert>
      )}

      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconCreditCard size="0.8rem" />}>Overview</Tabs.Tab>
          <Tabs.Tab value="schema" leftSection={<IconDatabase size="0.8rem" />}>Schema</Tabs.Tab>
          <Tabs.Tab value="tests" leftSection={<IconCheck size="0.8rem" />}>API Tests</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="xs">
          {loading ? (
            <Card withBorder p="xl" radius="md" style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
              <Loader />
            </Card>
          ) : debugData ? (
            <>
              <Card withBorder p="xl" radius="md" mb="md">
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                      Credit Card Table Status
                    </Text>
                    <Text size="xl" fw={700}>
                      {debugData.exists ? 'Exists' : 'Does Not Exist'}
                    </Text>
                  </div>
                  <Badge color={debugData.exists ? 'green' : 'red'} size="xl">
                    {debugData.exists ? 'Active' : 'Missing'}
                  </Badge>
                </Group>
              </Card>

              {debugData.exists && (
                <>
                  <Card withBorder p="xl" radius="md" mb="md">
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="md">
                      Credit Card Statistics
                    </Text>
                    <Group grow>
                      <div>
                        <Text size="xl" fw={700}>
                          {debugData.count}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Total Credit Cards
                        </Text>
                      </div>
                      <div>
                        <Text size="xl" fw={700}>
                          {debugData.distribution ? debugData.distribution.length : 0}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Customers with Cards
                        </Text>
                      </div>
                      <div>
                        <Text size="xl" fw={700}>
                          {debugData.customersWithMultipleCards ? debugData.customersWithMultipleCards.length : 0}
                        </Text>
                        <Text size="sm" c="dimmed">
                          Customers with Multiple Cards
                        </Text>
                      </div>
                    </Group>
                  </Card>

                  {debugData.sampleCards && debugData.sampleCards.length > 0 && (
                    <Card withBorder p="xl" radius="md">
                      <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="md">
                        Sample Credit Cards (Unmasked)
                      </Text>
                      <Table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Customer ID</th>
                            <th>Cardholder Name</th>
                            <th>Card Number</th>
                            <th>Expiry</th>
                            <th>Default</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debugData.sampleCards.map((card: any) => (
                            <tr key={card.id}>
                              <td>{card.id.substring(0, 8)}...</td>
                              <td>{card.customerId.substring(0, 8)}...</td>
                              <td>{card.cardholderName}</td>
                              <td>{card.cardNumber}</td>
                              <td>{card.expiryMonth}/{card.expiryYear}</td>
                              <td>{card.isDefault ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card>
                  )}
                </>
              )}
            </>
          ) : (
            <Card withBorder p="xl" radius="md">
              <Text ta="center">No data available. Click Refresh Data to load.</Text>
            </Card>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="schema" pt="xs">
          {loading ? (
            <Card withBorder p="xl" radius="md" style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
              <Loader />
            </Card>
          ) : debugData && debugData.exists ? (
            <>
              <Card withBorder p="xl" radius="md" mb="md">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="md">
                  Credit Card Table Columns
                </Text>
                <Table>
                  <thead>
                    <tr>
                      <th>Column Name</th>
                      <th>Data Type</th>
                      <th>Nullable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugData.columns.map((column: any, index: number) => (
                      <tr key={index}>
                        <td>{column.column_name}</td>
                        <td>{column.data_type}</td>
                        <td>{column.is_nullable === 'YES' ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>

              <Card withBorder p="xl" radius="md">
                <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb="md">
                  Foreign Key Relationships
                </Text>
                {debugData.foreignKeys && debugData.foreignKeys.length > 0 ? (
                  <Table>
                    <thead>
                      <tr>
                        <th>Table</th>
                        <th>Column</th>
                        <th>References Table</th>
                        <th>References Column</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debugData.foreignKeys.map((fk: any, index: number) => (
                        <tr key={index}>
                          <td>{fk.table_name}</td>
                          <td>{fk.column_name}</td>
                          <td>{fk.foreign_table_name}</td>
                          <td>{fk.foreign_column_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Text>No foreign key relationships found</Text>
                )}
              </Card>
            </>
          ) : (
            <Card withBorder p="xl" radius="md">
              <Text ta="center">
                {error ? 'Error loading schema data' : 'No schema data available. Click Refresh Data to load.'}
              </Text>
            </Card>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="tests" pt="xs">
          <Group mb="md">
            <Button onClick={testExportAPI} leftSection={<IconCreditCard size="1rem" />}>
              Test Export API
            </Button>
            <Button onClick={testDirectAPI} leftSection={<IconCreditCard size="1rem" />}>
              Test Direct API
            </Button>
          </Group>

          <Accordion>
            <Accordion.Item value="export">
              <Accordion.Control>Export API Test Results</Accordion.Control>
              <Accordion.Panel>
                {exportTestData ? (
                  <div>
                    <Text fw={700} mb="xs">Test Summary:</Text>
                    <Text mb="md">
                      Tested with {exportTestData.customers.length} customers.
                      {exportTestData.exportResult.some((c: any) => c.creditCards && c.creditCards.length > 0) 
                        ? ` Found credit cards in the export data.` 
                        : ` No credit cards found in the export data.`}
                    </Text>
                    
                    <Text fw={700} mb="xs">Export Data:</Text>
                    <Code block style={{ maxHeight: '300px', overflow: 'auto' }}>
                      {JSON.stringify(exportTestData.exportResult, null, 2)}
                    </Code>
                  </div>
                ) : (
                  <Text>No test results yet. Click "Test Export API" to run the test.</Text>
                )}
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="direct">
              <Accordion.Control>Direct API Test Results</Accordion.Control>
              <Accordion.Panel>
                {directTestData ? (
                  <div>
                    <Text fw={700} mb="xs">Test Summary:</Text>
                    <Text mb="md">
                      Tested with customer: {directTestData.customer.firstName} {directTestData.customer.lastName}.
                      {directTestData.creditCardData.creditCards && directTestData.creditCardData.creditCards.length > 0 
                        ? ` Found ${directTestData.creditCardData.creditCards.length} credit cards.` 
                        : ` No credit cards found for this customer.`}
                    </Text>
                    
                    <Text fw={700} mb="xs">API Response:</Text>
                    <Code block style={{ maxHeight: '300px', overflow: 'auto' }}>
                      {JSON.stringify(directTestData.creditCardData, null, 2)}
                    </Code>
                  </div>
                ) : (
                  <Text>No test results yet. Click "Test Direct API" to run the test.</Text>
                )}
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
} 