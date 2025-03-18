"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { lookupCardDetails, CardDetails } from "@/lib/binLookup";
import { use } from "react";

enum CustomerStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  ENGAGED = 'ENGAGED',
  DEAD = 'DEAD'
}

interface CreditCard {
  id?: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string; // Combined MM/YY format
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  isDefault?: boolean;
  bankName?: string;
  cardType?: string;
  scheme?: string;
  country?: string;
  isValid?: boolean;
  bin?: string;
}

interface Customer {
  id: string;
  fullName: string;
  email: string;
  secondaryEmail?: string;
  phone: string;
  secondaryPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  ssn?: string;
  driverLicense?: string;
  notes?: string;
  ipAddress?: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  creditCards: CreditCard[];
}

// Format SSN as XXX-XX-XXXX
const formatSSN = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format with hyphens
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  }
};

// Format credit card number with spaces after every 4 digits
const formatCreditCardNumber = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format with spaces
  const groups = [];
  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }
  
  return groups.join(' ');
};

interface EditCustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  // Unwrap the params Promise
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;
  
  return <EditCustomerPageContent customerId={customerId} />;
}

function EditCustomerPageContent({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ssn, setSsn] = useState("");
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [secondaryEmail, setSecondaryEmail] = useState<string>("");
  const [secondaryPhone, setSecondaryPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<CustomerStatus>(CustomerStatus.IN_PROGRESS);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [zipCode, setZipCode] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [driverLicense, setDriverLicense] = useState<string>("");
  const [ipAddress, setIpAddress] = useState<string>("");

  // Fetch customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/customers/${customerId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch customer");
        }
        
        const data = await response.json();
        
        // Format credit card data
        if (data.creditCards) {
          data.creditCards = data.creditCards.map((card: any) => {
            const month = card.expiryMonth.toString();
            const year = card.expiryYear.toString();
            const shortYear = year.length === 4 ? year.slice(2) : year;
            
            return {
              ...card,
              expiryMonth: month,
              expiryYear: year,
              expiryDate: `${month}/${shortYear}`,
              cardNumber: card.cardNumber || "",
              cardholderName: card.cardholderName || "",
            };
          });
        }
        
        setCustomer(data);
        setCreditCards(data.creditCards || []);
        setSsn(data.ssn || "");
        setStatus(data.status);
        
        // Set the form data
        setFullName(data.fullName || "");
        setEmail(data.email || "");
        setSecondaryEmail(data.secondaryEmail || "");
        setPhone(data.phone || "");
        setSecondaryPhone(data.secondaryPhone || "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setState(data.state || "");
        setZipCode(data.zipCode || "");
        setDateOfBirth(data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : "");
        setDriverLicense(data.driverLicense || "");
        setNotes(data.notes || "");
        setIpAddress(data.ipAddress || "");
      } catch (error) {
        console.error("Error fetching customer:", error);
        toast.error("Failed to load customer data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId, router]);

  const handleSsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatSSN(e.target.value);
    setSsn(formattedValue);
  };

  const addCreditCard = () => {
    // Get cardholder name from the first card if available
    const firstCardName = creditCards.length > 0 ? creditCards[0].cardholderName : "";
    
    setCreditCards([
      ...creditCards,
      {
        cardholderName: firstCardName,
        cardNumber: "",
        expiryDate: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
        isDefault: false,
        isValid: undefined,
      },
    ]);
  };

  const removeCreditCard = (index: number) => {
    setCreditCards(creditCards.filter((_, i) => i !== index));
  };

  const updateCreditCard = async (index: number, field: keyof CreditCard, value: string) => {
    const updatedCards = [...creditCards];
    
    if (field === "cardNumber") {
      // Format the card number
      const formattedValue = formatCreditCardNumber(value);
      updatedCards[index] = { 
        ...updatedCards[index], 
        [field]: formattedValue,
      };
      
      // Only lookup details if we have at least 6 digits
      const cleanNumber = formattedValue.replace(/\D/g, '');
      if (cleanNumber.length >= 6) {
        try {
          // Show loading state
          updatedCards[index].bankName = "Loading...";
          setCreditCards([...updatedCards]); // Create a new array to ensure state update
          
          // Extract BIN (first 6 digits)
          const bin = cleanNumber.slice(0, 6);
          
          // Use the API route
          const response = await fetch(`/api/bin-lookup?bin=${bin}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch BIN info for ${bin}`);
          }
          
          const data = await response.json();
          
          // Update with the card details
          setCreditCards(prevCards => {
            const newCards = [...prevCards];
            newCards[index] = {
              ...newCards[index],
              cardNumber: formattedValue, // Ensure the formatted number is preserved
              bankName: data.bank,
              cardType: data.type?.toLowerCase(),
              scheme: data.scheme?.toLowerCase(),
              country: data.country,
              isValid: true, // API doesn't return this, assume valid
              bin: bin, // Store the BIN for future reference
            };
            return newCards;
          });
        } catch (error) {
          console.error("Error looking up card details:", error);
          // Clear loading state on error
          setCreditCards(prevCards => {
            const errorCards = [...prevCards];
            errorCards[index] = {
              ...errorCards[index],
              cardNumber: formattedValue,
              bankName: "Error loading card details",
            };
            return errorCards;
          });
        }
      }
    } else if (field === 'expiryDate') {
      // Handle the combined MM/YY format
      // Format input as user types, enforcing MM/YY pattern
      let formattedValue = value.replace(/\D/g, '');
      
      // Limit to 4 digits
      if (formattedValue.length > 4) {
        formattedValue = formattedValue.slice(0, 4);
      }
      
      // Format as MM/YY
      if (formattedValue.length > 2) {
        formattedValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2)}`;
      }
      
      // Extract month and year for compatibility
      const parts = formattedValue.split('/');
      const month = parts[0] || '';
      const year = parts.length > 1 ? parts[1] : '';
      
      updatedCards[index] = { 
        ...updatedCards[index], 
        expiryDate: formattedValue,
        expiryMonth: month,
        expiryYear: year.length === 2 ? `20${year}` : year
      };
      setCreditCards(updatedCards);
    } else {
      // For other fields, just update the value
      updatedCards[index] = { 
        ...updatedCards[index], 
        [field]: value 
      };
      setCreditCards(updatedCards);
    }
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const updatedCustomer = {
        fullName,
        email,
        secondaryEmail,
        phone,
        secondaryPhone,
        address,
        city,
        state,
        zipCode,
        dateOfBirth: dateOfBirth || null,
        ssn,
        driverLicense,
        notes,
        ipAddress,
        status,
        creditCards: creditCards.map(card => ({
          ...card,
          // Convert expiry values to integers for API
          expiryMonth: parseInt(card.expiryMonth) || 0,
          expiryYear: card.expiryYear.length === 2 ? parseInt(`20${card.expiryYear}`) : parseInt(card.expiryYear) || 0
        })),
      };

      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedCustomer),
      });

      if (!response.ok) {
        throw new Error("Failed to update customer");
      }

      toast.success("Customer updated successfully");
      router.push(`/dashboard/customers/${customerId}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update customer");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading || !customer) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <p>Loading customer data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Customer</CardTitle>
          <CardDescription>
            Update the customer's information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={customer.fullName}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={customer.email || ""}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryEmail">Secondary Email</Label>
                <Input
                  id="secondaryEmail"
                  type="email"
                  value={secondaryEmail}
                  onChange={(e) => setSecondaryEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  defaultValue={customer.phone || ""}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryPhone">Secondary Phone</Label>
                <Input
                  id="secondaryPhone"
                  type="tel"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  defaultValue={customer.dateOfBirth ? new Date(customer.dateOfBirth).toISOString().split('T')[0] : ""}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ssn">Social Security Number</Label>
                <Input
                  id="ssn"
                  name="ssn"
                  type="text"
                  placeholder="XXX-XX-XXXX"
                  value={ssn}
                  onChange={handleSsnChange}
                  maxLength={11}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverLicense">Driver&apos;s License</Label>
                <Input
                  id="driverLicense"
                  name="driverLicense"
                  defaultValue={customer.driverLicense || ""}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Customer Notes</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  placeholder="Add notes about this customer..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address Information</h3>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={customer.address || ""}
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={customer.city || ""}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    defaultValue={customer.state || ""}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    defaultValue={customer.zipCode || ""}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input
                  id="ipAddress"
                  name="ipAddress"
                  defaultValue={customer.ipAddress || ""}
                  placeholder="xxx.xxx.xxx.xxx"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Credit Card Information</h3>
                <Button
                  type="button"
                  variant="default"
                  onClick={addCreditCard}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Another Card
                </Button>
              </div>
              {creditCards.map((card, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {index > 0 && (
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeCreditCard(index)}
                            disabled={isLoading}
                          >
                            Remove Card
                          </Button>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Cardholder Name</Label>
                        <Input
                          value={card.cardholderName}
                          onChange={(e) => updateCreditCard(index, "cardholderName", e.target.value)}
                          disabled={isLoading}
                          placeholder={index > 0 && !card.cardholderName && creditCards[0]?.cardholderName 
                            ? `Same as first card: ${creditCards[0].cardholderName}` 
                            : ""}
                          onFocus={(e) => {
                            // Auto-fill with first card's name if this is not the first card and the field is empty
                            if (index > 0 && !card.cardholderName && creditCards[0]?.cardholderName) {
                              updateCreditCard(index, "cardholderName", creditCards[0].cardholderName);
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Card Number</Label>
                        <div className="relative">
                          <Input
                            type="text"
                            value={card.cardNumber}
                            onChange={(e) => updateCreditCard(index, "cardNumber", e.target.value)}
                            disabled={isLoading}
                            maxLength={19} // 16 digits + 3 spaces
                            placeholder="XXXX XXXX XXXX XXXX"
                            className={card.isValid === false ? "border-red-500" : ""}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                            {card.scheme && (
                              <div className="h-6 w-10 flex items-center justify-center">
                                {card.scheme === "visa" && <Icons.visa className="h-5 w-8" />}
                                {card.scheme === "mastercard" && <Icons.mastercard className="h-5 w-8" />}
                                {card.scheme === "amex" && <Icons.amex className="h-5 w-8" />}
                                {card.scheme === "discover" && <Icons.discover className="h-5 w-8" />}
                                {card.scheme === "jcb" && <Icons.jcb className="h-5 w-8" />}
                                {card.scheme === "diners club" && <Icons.diners className="h-5 w-8" />}
                                {card.scheme === "maestro" && <Icons.maestro className="h-5 w-8" />}
                                {!["visa", "mastercard", "amex", "discover", "jcb", "diners club", "maestro"].includes(card.scheme) && 
                                  <Icons.generic className="h-5 w-8" />}
                              </div>
                            )}
                            {card.bankName && card.bankName !== "Loading..." && (
                              <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">
                                {card.bankName}
                              </div>
                            )}
                            {card.bankName === "Loading..." && (
                              <div className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-xs font-medium animate-pulse">
                                Loading...
                              </div>
                            )}
                          </div>
                        </div>
                        {card.bankName && card.bankName !== "Loading..." && (
                          <div className="text-xs mt-1 space-y-1">
                            <p className="text-gray-500">
                              <span className="font-medium">Bank:</span> {card.bankName}
                            </p>
                            {card.country && (
                              <p className="text-gray-500">
                                <span className="font-medium">Country:</span> {card.country}
                              </p>
                            )}
                            {card.cardType && (
                              <p className="text-gray-500">
                                <span className="font-medium">Type:</span> {card.cardType}
                              </p>
                            )}
                            {card.isValid === false && (
                              <p className="text-red-500">
                                Invalid card number
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Expiry Date (MM/YY)</Label>
                          <Input
                            type="text"
                            placeholder="MM/YY"
                            maxLength={5}
                            value={card.expiryDate}
                            onChange={(e) => updateCreditCard(index, "expiryDate", e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input
                            type="text"
                            maxLength={4}
                            value={card.cvv}
                            onChange={(e) => updateCreditCard(index, "cvv", e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add a prominent button at the bottom if there are already cards */}
              {creditCards.length > 0 && (
                <div className="flex justify-center mt-4">
                  <Button
                    type="button"
                    variant="default"
                    onClick={addCreditCard}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-2" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Another Card
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/customers/${customerId}`)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Customer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 