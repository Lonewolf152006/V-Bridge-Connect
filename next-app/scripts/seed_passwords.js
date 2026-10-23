const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedPasswords() {
  try {
    const defaultHash = await bcrypt.hash('Test1234!', 10);
    const adminHash = await bcrypt.hash('admin123', 10);

    const updatedAdmin = await prisma.user.updateMany({
      where: { email: { in: ['admin@vbridge.com', 'superadmin@vbridge.com'] } },
      data: { passwordHash: adminHash },
    });
    console.log(`Updated admin passwords: ${updatedAdmin.count}`);

    const updatedUsers = await prisma.user.updateMany({
      where: { passwordHash: null },
      data: { passwordHash: defaultHash },
    });
    console.log(`Updated missing user passwords with default hash: ${updatedUsers.count}`);
  } catch (err) {
    console.error('Error seeding passwords:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedPasswords();
