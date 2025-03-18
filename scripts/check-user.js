const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const email = 'admin@example.com';
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      twoFactorEnabled: user.twoFactorEnabled
    });
    
    // Check if the password matches
    const password = 'admin123';
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('Password validation:', {
      passwordHash: user.password,
      testPassword: password,
      isPasswordValid
    });
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser(); 