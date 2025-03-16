import { PrismaClient, CustomerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  console.log('Cleaning up existing data...');
  await prisma.creditCard.deleteMany();
  await prisma.binCache.deleteMany();
  await prisma.project.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('All existing data deleted');

  // Create admin user
  const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
  };

  const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    
  const admin = await prisma.user.create({
    data: {
      name: adminUser.name,
      email: adminUser.email,
      password: hashedPassword,
      isAdmin: true,
    },
  });
    
  console.log(`Created admin user with id: ${admin.id} (${adminUser.email})`);
  console.log('Admin credentials: Email: admin@example.com, Password: admin123');

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
      status: CustomerStatus.IN_PROGRESS,
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
      status: CustomerStatus.ENGAGED,
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
      dateOfBirth: new Date('1978-11-05'),
      ssn: '456-78-9012',
      driverLicense: 'TX45678901',
      notes: 'Interested in premium services. Follow up in two weeks.',
      status: CustomerStatus.DEAD,
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
    },
    {
      firstName: 'Sarah',
      lastName: 'Thompson',
      email: 'sarah.thompson@gmail.com',
      secondaryEmail: 'sthompson@company.com',
      phone: '(617) 555-3456',
      secondaryPhone: '',
      address: '42 Maple Avenue',
      city: 'Boston',
      state: 'MA',
      zipCode: '02108',
      dateOfBirth: new Date('1992-08-12'),
      ssn: '234-56-7890',
      driverLicense: 'MA23456789',
      notes: 'High-value customer. Interested in premium services.',
      status: CustomerStatus.ENGAGED,
      creditCards: [
        {
          cardholderName: 'Sarah Thompson',
          cardNumber: '4111111111111111',
          expiryMonth: 9,
          expiryYear: 2025,
          cvv: '456',
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
      firstName: 'David',
      lastName: 'Martinez',
      email: 'david.martinez@outlook.com',
      secondaryEmail: '',
      phone: '(305) 555-7890',
      secondaryPhone: '',
      address: '123 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      zipCode: '33139',
      dateOfBirth: new Date('1988-04-23'),
      ssn: '345-67-8901',
      driverLicense: 'FL34567890',
      notes: 'Recently moved from New York. Looking for investment opportunities.',
      status: CustomerStatus.IN_PROGRESS,
      creditCards: [
        {
          cardholderName: 'David Martinez',
          cardNumber: '5555555555554444',
          expiryMonth: 11,
          expiryYear: 2026,
          cvv: '789',
          isDefault: true,
          bankName: 'Bank of America',
          cardType: 'mastercard',
          scheme: 'mastercard',
          country: 'US',
          bin: '555555'
        }
      ]
    },
    {
      firstName: 'Emily',
      lastName: 'Chen',
      email: 'emily.chen@gmail.com',
      secondaryEmail: 'echen@techfirm.com',
      phone: '(206) 555-9012',
      secondaryPhone: '(206) 555-3456',
      address: '567 Pine Street',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      dateOfBirth: new Date('1991-12-05'),
      ssn: '456-78-9012',
      driverLicense: 'WA45678901',
      notes: 'Works in tech. Prefers email communication.',
      status: CustomerStatus.DEAD,
      creditCards: [
        {
          cardholderName: 'Emily Chen',
          cardNumber: '378282246310005',
          expiryMonth: 4,
          expiryYear: 2025,
          cvv: '123',
          isDefault: true,
          bankName: 'American Express',
          cardType: 'amex',
          scheme: 'american express',
          country: 'US',
          bin: '378282'
        }
      ]
    }
  ];

  // Create customers and their credit cards
  for (const customerData of customers) {
    const { creditCards, ...customerInfo } = customerData;
    
    // Create the customer
    const customer = await prisma.customer.create({
      data: {
        ...customerInfo,
        userId: admin.id,
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