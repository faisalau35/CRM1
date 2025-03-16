"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { lookupCardDetails, validateCardNumber } from "@/lib/binLookup";
import { LOCAL_BINS } from "@/lib/binDatabase";

interface CreditCard {
  cardholderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  bankName?: string;
  cardType?: string;
  scheme?: string;
  country?: string;
  isValid?: boolean;
  bin?: string;
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

// Format credit card number with spaces
const formatCreditCardNumber = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format with spaces
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  
  return parts.join(' ');
};

// Detect bank name from card number
const detectBankName = (cardNumber: string) => {
  const digits = cardNumber.replace(/\D/g, '');
  
  // Check for matches from longest to shortest BIN
  for (let length = 6; length >= 1; length--) {
    const prefix = digits.slice(0, length);
    if (LOCAL_BINS[prefix]) {
      return LOCAL_BINS[prefix];
    }
  }
  
  return undefined;
};

// Add card type detection function
const getCardType = (cardNumber: string): string => {
  const cleanNumber = cardNumber.replace(/\s+/g, '');
  
  if (/^4/.test(cleanNumber)) return "visa";
  if (/^5[1-5]/.test(cleanNumber)) return "mastercard";
  if (/^3[47]/.test(cleanNumber)) return "amex";
  if (/^6(?:011|5)/.test(cleanNumber)) return "discover";
  if (/^(?:2131|1800|35)/.test(cleanNumber)) return "jcb";
  if (/^3(?:0[0-5]|[68])/.test(cleanNumber)) return "diners";
  
  return "";
};

export default function NewCustomerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [ssn, setSsn] = useState("");
  const [creditCards, setCreditCards] = useState<CreditCard[]>([{
    cardholderName: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    bankName: undefined,
    cardType: undefined,
    scheme: undefined,
    country: undefined,
    isValid: undefined,
  }]);
  const [refreshingBin, setRefreshingBin] = useState(false);
  const [secondaryEmail, setSecondaryEmail] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Clear any saved credit card data when component mounts
  useEffect(() => {
    localStorage.removeItem("creditCards");
  }, []);

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
      bankName: undefined,
      cardType: undefined,
      scheme: undefined,
      country: undefined,
      isValid: undefined,
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
    } else {
      // For other fields, just update the value
      updatedCards[index] = { 
        ...updatedCards[index], 
        [field]: value 
      };
      setCreditCards(updatedCards);
    }
  };

  // Refresh BIN info for all cards
  const refreshBinInfo = async () => {
    if (!creditCards.length) return;
    
    setRefreshingBin(true);
    
    try {
      // Process each card
      const updatedCards = [...creditCards];
      
      for (let i = 0; i < updatedCards.length; i++) {
        const card = updatedCards[i];
        const cleanNumber = card.cardNumber.replace(/\D/g, '');
        
        if (cleanNumber.length >= 6) {
          try {
            // Show loading state
            updatedCards[i] = { 
              ...updatedCards[i],
              bankName: "Loading..." 
            };
            setCreditCards([...updatedCards]);
            
            // Extract BIN (first 6 digits)
            const bin = cleanNumber.slice(0, 6);
            
            // Use the API route
            const response = await fetch(`/api/bin-lookup?bin=${bin}`);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch BIN info for ${bin}`);
            }
            
            const data = await response.json();
            
            // Update card with details
            updatedCards[i] = {
              ...updatedCards[i],
              bankName: data.bank,
              cardType: data.type?.toLowerCase(),
              scheme: data.scheme?.toLowerCase(),
              country: data.country,
              isValid: true,
              bin: bin
            };
          } catch (error) {
            console.error("Error refreshing BIN info:", error);
            updatedCards[i] = {
              ...updatedCards[i],
              bankName: "Error loading card details"
            };
          }
        }
      }
      
      // Update state with all refreshed cards
      setCreditCards([...updatedCards]);
    } catch (error) {
      console.error("Error in refresh operation:", error);
      toast.error("Failed to refresh card information");
    } finally {
      setRefreshingBin(false);
    }
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      
      // Create a simple customer object without credit cards
      const customerData = {
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
        ssn: formData.get("ssn"),
        dateOfBirth: formData.get("dateOfBirth"),
        driverLicense: formData.get("driverLicense"),
        notes: formData.get("notes"),
        // Include credit cards
        creditCards: creditCards.filter(card => 
          card.cardholderName.trim() !== "" && 
          card.cardNumber.replace(/\s/g, "").length > 0
        ).map(card => ({
          cardholderName: card.cardholderName,
          cardNumber: card.cardNumber.replace(/\s/g, ""), // Remove spaces
          expiryMonth: parseInt(card.expiryMonth) || 0,
          expiryYear: parseInt(card.expiryYear) || 0,
          cvv: card.cvv,
          bankName: card.bankName,
          cardType: card.cardType,
          scheme: card.scheme,
          country: card.country,
          bin: card.bin
        }))
      };
      
      console.log("Sending customer data:", JSON.stringify(customerData));
      
      const response = await fetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(customerData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.message || "Failed to create customer");
      }

      const data = await response.json();

      // Clear credit card data from localStorage after successful submission
      localStorage.removeItem("creditCards");
      
      // Show enhanced success notification
      toast.success(`Customer ${data.firstName} ${data.lastName} created successfully`, {
        description: "You will be redirected to the customers list in a moment.",
        duration: 3000,
        position: "top-center",
        icon: "✅",
      });
      
      // Automatically redirect to customers list after a short delay
      setTimeout(() => {
        router.push("/dashboard/customers");
      }, 2000);
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Failed to create customer", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 5000,
        position: "top-center",
        icon: "❌",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Add New Customer</CardTitle>
            <CardDescription>
              Enter the customer's information below
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/customers")}
            className="h-8 w-8 p-0 rounded-full"
            aria-label="Close"
          >
            ✕
          </Button>
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
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
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
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryEmail">Secondary Email (Optional)</Label>
                <Input
                  id="secondaryEmail"
                  name="secondaryEmail"
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
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryPhone">Secondary Phone (Optional)</Label>
                <Input
                  id="secondaryPhone"
                  name="secondaryPhone"
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
                <Label htmlFor="driverLicense">Driver's License</Label>
                <Input
                  id="driverLicense"
                  name="driverLicense"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Customer Notes (Optional)</Label>
                <textarea
                  id="notes"
                  name="notes"
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
                  disabled={isLoading}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Credit Card Information</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={refreshBinInfo}
                    disabled={isLoading || refreshingBin || creditCards.length === 0}
                  >
                    {refreshingBin ? (
                      <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>Refresh BIN Info</>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCreditCard}
                    disabled={isLoading}
                  >
                    Add Credit Card
                  </Button>
                </div>
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
                            inputMode="numeric"
                            value={card.cardNumber}
                            onChange={(e) => {
                              // Direct update for immediate feedback
                              const value = e.target.value;
                              // Format the card number with spaces
                              const digits = value.replace(/\D/g, '');
                              const parts = [];
                              for (let i = 0; i < digits.length; i += 4) {
                                parts.push(digits.slice(i, i + 4));
                              }
                              const formattedValue = parts.join(' ');
                              
                              // Update the card immediately for responsive typing
                              const updatedCards = [...creditCards];
                              updatedCards[index] = { 
                                ...updatedCards[index], 
                                cardNumber: formattedValue,
                              };
                              setCreditCards(updatedCards);
                              
                              // Then trigger the BIN lookup if needed
                              if (digits.length >= 6 && !updatedCards[index].bankName) {
                                updateCreditCard(index, "cardNumber", formattedValue);
                              }
                            }}
                            disabled={isLoading}
                            maxLength={19} // 16 digits + 3 spaces
                            placeholder="XXXX XXXX XXXX XXXX"
                            className={`${card.isValid === false ? "border-red-500" : ""} z-50`}
                            style={{ position: 'relative', zIndex: 50 }}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none">
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
                onClick={() => router.push("/dashboard/customers")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="mr-2 animate-spin">⟳</span>
                    Creating...
                  </>
                ) : (
                  "Create Customer"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 