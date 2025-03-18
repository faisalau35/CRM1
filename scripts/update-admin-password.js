const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateAdminPassword() {
  try {
    const email = 'admin@example.com';
    const newPassword = 'admin123';
    
    // Hash the password properly
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user
    const user = await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('Admin password updated successfully for user:', user.email);
    
    // Verify the new password works
    const isPasswordValid = await bcrypt.compare(newPassword, user.password);
    console.log('Password validation:', {
      isPasswordValid
    });
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword(); 