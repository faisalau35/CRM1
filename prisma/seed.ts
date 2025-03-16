import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const users = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
    },
    {
      name: 'John Smith',
      email: 'john.smith@example.com',
      password: 'password123',
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      password: 'password123',
    }
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: userData.email,
      },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
        },
      });
      
      console.log(`Created user with id: ${user.id} (${userData.email})`);
    } else {
      console.log(`User ${userData.email} already exists`);
    }
  }

  // Get the first user to associate customers with
  const firstUser = await prisma.user.findFirst({
    where: {
      email: users[0].email,
    },
  });

  if (!firstUser) {
    console.log('No user found to associate customers with');
    return;
  }

  // Create sample customers with realistic data
  const customers = [
    {
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'michael.johnson@gmail.com',
      secondaryEmail: 'mjohnson@work.com',
      phone: '(415) 555-1234',
      secondaryPhone: '(415) 555-5678',
      address: '123 Main Street, Apt 4B',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      dateOfBirth: new Date('1985-06-15'),
      ssn: '123-45-6789',
      driverLicense: 'CA12345678',
      notes: 'Preferred contact method is email. Works at Tech Solutions Inc.',
      creditCards: [
        {
          cardholderName: 'Michael Johnson',
          cardNumber: '4111111111111111',
          expiryMonth: 5,
          expiryYear: 2026,
          cvv: '123',
          isDefault: true,
          bankName: 'Chase',
          cardType: 'visa',
          scheme: 'visa',
          country: 'US',
          bin: '411111'
        }
      ]
    },
    {
      firstName: 'Jennifer',
      lastName: 'Williams',
      email: 'jennifer.williams@yahoo.com',
      secondaryEmail: 'jwilliams@company.org',
      phone: '(312) 555-9876',
      secondaryPhone: '(312) 555-4321',
      address: '456 Oak Avenue',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60611',
      dateOfBirth: new Date('1990-03-22'),
      ssn: '987-65-4321',
      driverLicense: 'IL98765432',
      notes: 'Prefers phone calls. Has a premium membership.',
      creditCards: [
        {
          cardholderName: 'Jennifer Williams',
          cardNumber: '5555555555554444',
          expiryMonth: 8,
          expiryYear: 2025,
          cvv: '456',
          isDefault: true,
          bankName: 'Bank of America',
          cardType: 'mastercard',
          scheme: 'mastercard',
          country: 'US',
          bin: '555555'
        },
        {
          cardholderName: 'Jennifer Williams',
          cardNumber: '378282246310005',
          expiryMonth: 12,
          expiryYear: 2024,
          cvv: '789',
          isDefault: false,
          bankName: 'American Express',
          cardType: 'amex',
          scheme: 'american express',
          country: 'US',
          bin: '378282'
        }
      ]
    },
    {
      firstName: 'Robert',
      lastName: 'Davis',
      email: 'robert.davis@hotmail.com',
      secondaryEmail: '',
      phone: '(214) 555-7890',
      secondaryPhone: '',
      address: '789 Pine Street',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      dateOfBirth: new Date('1978-11-08'),
      ssn: '456-78-9012',
      driverLicense: 'TX45678901',
      notes: 'Referred by Jennifer Williams. Interested in premium services.',
      creditCards: [
        {
          cardholderName: 'Robert Davis',
          cardNumber: '6011111111111117',
          expiryMonth: 3,
          expiryYear: 2027,
          cvv: '321',
          isDefault: true,
          bankName: 'Discover',
          cardType: 'discover',
          scheme: 'discover',
          country: 'US',
          bin: '601111'
        }
      ]
    }
  ];

  // Create customers and their credit cards
  for (const customerData of customers) {
    const { creditCards, ...customerInfo } = customerData;
    
    // Check if customer already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        userId: firstUser.id
      }
    });

    if (!existingCustomer) {
      // Create the customer
      const customer = await prisma.customer.create({
        data: {
          ...customerInfo,
          userId: firstUser.id,
        },
      });
      
      console.log(`Created customer: ${customer.firstName} ${customer.lastName}`);
      
      // Create credit cards for the customer
      if (creditCards && creditCards.length > 0) {
        for (const cardData of creditCards) {
          // Extract only the fields that are in the schema
          const { bankName, cardType, scheme, country, bin, ...cardSchemaData } = cardData;
          
          const card = await prisma.creditCard.create({
            data: {
              ...cardSchemaData,
              customerId: customer.id,
            },
          });
          
          console.log(`Created credit card for ${customer.firstName} ${customer.lastName}`);
          
          // Store BIN data in cache
          if (bin) {
            await prisma.binCache.upsert({
              where: { bin },
              update: {
                bankName,
                cardType,
                scheme,
                country,
                updatedAt: new Date(),
              },
              create: {
                bin,
                bankName,
                cardType,
                scheme,
                country,
              },
            });
          }
        }
      }
    } else {
      console.log(`Customer ${customerInfo.firstName} ${customerInfo.lastName} already exists`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 