import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Define the CustomerStatus enum to match the schema
enum CustomerStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  ENGAGED = 'ENGAGED',
  DEAD = 'DEAD'
}

async function main() {
  console.log('Starting seed operation...');
  
  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.creditCard.deleteMany({});
  await prisma.binCache.deleteMany({});
  await prisma.customer.deleteMany({});
  
  // Create a default user if needed
  let userId: string;
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@example.com' }
  });
  
  if (adminUser) {
    userId = adminUser.id;
    console.log('Using existing admin user');
  } else {
    // Create a new admin user
    const newAdmin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: '$2a$10$GmQzTXcl5Ojh5zVoNgVxHOaZyf0gqQBYYY5D3YH0qWyKA6Ag/Kdh6', // hashed 'admin123'
        isAdmin: true
      }
    });
    userId = newAdmin.id;
    console.log('Created new admin user');
  }
  
  console.log('Generating 50 customers with credit cards...');
  
  // Generate 50 customers
  for (let i = 0; i < 50; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });
    
    // Create customer
    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email,
        secondaryEmail: Math.random() > 0.7 ? faker.internet.email() : null,
        phone: faker.phone.number(),
        secondaryPhone: Math.random() > 0.8 ? faker.phone.number() : null,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        ssn: faker.finance.accountNumber(9),
        driverLicense: faker.string.alphanumeric(10).toUpperCase(),
        notes: Math.random() > 0.7 ? faker.lorem.paragraph() : null,
        status: faker.helpers.arrayElement([
          CustomerStatus.IN_PROGRESS,
          CustomerStatus.ENGAGED,
          CustomerStatus.DEAD
        ]),
        userId: userId, // Link to the admin user
      },
    });
    
    // Generate 1-3 credit cards per customer
    const cardCount = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < cardCount; j++) {
      const cardholderName = `${firstName} ${lastName}`;
      const expiryMonth = Math.floor(Math.random() * 12) + 1;
      const currentYear = new Date().getFullYear();
      const expiryYear = currentYear + Math.floor(Math.random() * 5) + 1;
      
      // Generate a valid-looking card number
      const cardType = faker.helpers.arrayElement(['Visa', 'Mastercard', 'Amex', 'Discover']);
      let cardNumber;
      
      switch (cardType) {
        case 'Visa':
          cardNumber = '4' + faker.string.numeric(15);
          break;
        case 'Mastercard':
          cardNumber = '5' + faker.string.numeric(15);
          break;
        case 'Amex':
          cardNumber = '3' + faker.helpers.arrayElement(['4', '7']) + faker.string.numeric(13);
          break;
        case 'Discover':
          cardNumber = '6011' + faker.string.numeric(12);
          break;
        default:
          cardNumber = faker.finance.creditCardNumber();
      }
      
      // Create credit card
      await prisma.creditCard.create({
        data: {
          customerId: customer.id,
          cardholderName,
          cardNumber,
          expiryMonth,
          expiryYear,
          cvv: faker.string.numeric(3),
          isDefault: j === 0, // First card is default
        },
      });
      
      // Optionally store BIN data in cache
      if (Math.random() > 0.5) {
        const bin = cardNumber.substring(0, 6);
        await prisma.binCache.upsert({
          where: { bin },
          update: {},
          create: {
            bin,
            bankName: faker.company.name() + ' Bank',
            cardType: cardType.toLowerCase(),
            scheme: cardType.toLowerCase(),
            country: 'US',
            isValid: true,
          },
        });
      }
    }
    
    if (i % 10 === 0) {
      console.log(`Created ${i + 1} customers...`);
    }
  }
  
  // Count the results
  const customerCount = await prisma.customer.count();
  const creditCardCount = await prisma.creditCard.count();
  const binCacheCount = await prisma.binCache.count();
  
  console.log(`Seed completed successfully!`);
  console.log(`Created ${customerCount} customers with ${creditCardCount} credit cards.`);
  console.log(`Added ${binCacheCount} BIN cache entries.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 