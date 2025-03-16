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

interface CreditCard {
  id?: string;
  cardholderName: string;
  cardNumber: string;
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
  firstName: string;
  lastName: string;
  email: string | null;
  secondaryEmail?: string | null;
  phone: string | null;
  secondaryPhone?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  dateOfBirth: string | null;
  ssn: string | null;
  driverLicense: string | null;
  notes?: string | null;
  ipAddress?: string | null;
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

  // Fetch customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch customer");
        }
        const data = await response.json();
        setCustomer(data);
        setSsn(data.ssn || "");
        
        // Initialize credit cards from customer data
        if (data.creditCards && data.creditCards.length > 0) {
          const formattedCards = await Promise.all(data.creditCards.map(async (card: any) => {
            // Format card number with spaces
            const formattedCardNumber = formatCreditCardNumber(card.cardNumber);
            
            // Initialize with empty card details
            let cardDetails: CardDetails = {};
            
            try {
              cardDetails = await lookupCardDetails(card.cardNumber);
            } catch (error) {
              console.error("Error looking up card details:", error);
            }
            
            return {
              id: card.id,
              cardholderName: card.cardholderName,
              cardNumber: formattedCardNumber,
              expiryMonth: card.expiryMonth.toString(),
              expiryYear: card.expiryYear.toString(),
              cvv: card.cvv, // Use actual CVV value
              isDefault: card.isDefault,
              bankName: cardDetails.bankName,
              cardType: cardDetails.cardType,
              scheme: cardDetails.scheme,
              country: cardDetails.country,
              isValid: cardDetails.isValid
            };
          }));
          
          setCreditCards(formattedCards);
        } else {
          setCreditCards([{
            cardholderName: "",
            cardNumber: "",
            expiryMonth: "",
            expiryYear: "",
            cvv: "",
            isDefault: true,
            bankName: undefined,
            cardType: undefined,
            scheme: undefined,
            country: undefined,
            isValid: undefined
          }]);
        }
        
        if (data.secondaryEmail) setSecondaryEmail(data.secondaryEmail);
        if (data.secondaryPhone) setSecondaryPhone(data.secondaryPhone);
        if (data.notes) setNotes(data.notes);
        
        setIsLoading(false);
      } catch (error) {
        toast.error("Failed to fetch customer data");
        router.push("/dashboard/customers");
      }
    };

    fetchCustomer();
  }, [customerId, router]);

  const handleSsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatSSN(e.target.value);
    setSsn(formattedValue);
  };

  const addCreditCard = () => {
    setCreditCards([...creditCards, {
      cardholderName: "",
      cardNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      isDefault: false,
      bankName: undefined,
      cardType: undefined,
      scheme: undefined,
      country: undefined,
      isValid: undefined
    }]);
  };

  const removeCreditCard = (index: number) => {
    setCreditCards(creditCards.filter((_, i) => i !== index));
  };

  const updateCreditCard = async (index: number, field: keyof CreditCard, value: string) => {
    const updatedCards = [...creditCards];
    
    if (field === 'cardNumber') {
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
          
          // Use the API route directly for consistency with other pages
          const response = await fetch(`/api/bin-lookup?bin=${bin}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch BIN info for ${bin}`);
          }
          
          const data = await response.json();
          
          // Update with the card details using functional state update
          setCreditCards(prevCards => {
            const newCards = [...prevCards];
            newCards[index] = {
              ...newCards[index],
              cardNumber: formattedValue, // Ensure the formatted number is preserved
              bankName: data.bank,
              cardType: data.type?.toLowerCase(),
              scheme: data.scheme?.toLowerCase(),
              country: data.country,
              isValid: true,
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
      } else {
        // Clear details if not enough digits
        updatedCards[index] = {
          ...updatedCards[index],
          cardNumber: formattedValue,
          bankName: undefined,
          cardType: undefined,
          scheme: undefined,
          country: undefined,
          isValid: undefined,
          bin: undefined,
        };
        setCreditCards(updatedCards);
      }
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
      const formData = new FormData(event.currentTarget);
      const data = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        secondaryEmail: formData.get("secondaryEmail"),
        phone: formData.get("phone"),
        secondaryPhone: formData.get("secondaryPhone"),
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        zipCode: formData.get("zipCode"),
        dateOfBirth: formData.get("dateOfBirth"),
        ssn: ssn,
        driverLicense: formData.get("driverLicense"),
        notes: formData.get("notes"),
        ipAddress: formData.get("ipAddress"),
        creditCards: creditCards.map((card, index) => ({
          ...card,
          isDefault: index === 0,
          expiryMonth: parseInt(card.expiryMonth) || 0,
          expiryYear: parseInt(card.expiryYear) || 0,
          // Remove spaces from card number before sending to API
          cardNumber: card.cardNumber.replace(/\s/g, ''),
          cvv: card.cvv,
          // Include BIN data for storage
          bin: card.bin,
          bankName: card.bankName,
          cardType: card.cardType,
          scheme: card.scheme,
          country: card.country,
        })),
      };

      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={customer.firstName}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={customer.lastName}
                    required
                    disabled={isLoading}
                  />
                </div>
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
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Credit Card Information</h3>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCreditCard}
                  disabled={isLoading}
                >
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
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Expiry Month</Label>
                          <Input
                            type="number"
                            min="1"
                            max="12"
                            value={card.expiryMonth}
                            onChange={(e) => updateCreditCard(index, "expiryMonth", e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Expiry Year</Label>
                          <Input
                            type="number"
                            min={new Date().getFullYear()}
                            max={new Date().getFullYear() + 20}
                            value={card.expiryYear}
                            onChange={(e) => updateCreditCard(index, "expiryYear", e.target.value)}
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