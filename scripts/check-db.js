const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check users
    const users = await prisma.user.findMany();
    console.log('Users:', JSON.stringify(users, null, 2));
    
    // Check customers
    const customers = await prisma.customer.findMany({ 
      take: 2,
      include: {
        createdBy: true
      }
    });
    console.log('Customers (first 2):', JSON.stringify(customers, null, 2));
    
    // Count customers
    const customerCount = await prisma.customer.count();
    console.log('Total customers:', customerCount);
    
    // Check if all customers are linked to the admin user
    const adminUser = users.find(user => user.isAdmin);
    if (adminUser) {
      const customersLinkedToAdmin = await prisma.customer.count({
        where: {
          userId: adminUser.id
        }
      });
      console.log(`Customers linked to admin (${adminUser.email}):`, customersLinkedToAdmin);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .finally(() => prisma.$disconnect()); 