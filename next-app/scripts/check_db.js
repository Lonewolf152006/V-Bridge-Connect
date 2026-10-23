const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, passwordHash: true },
    });
    console.log(`Found ${users.length} users in DB:`);
    for (const u of users) {
      console.log(`- ${u.email} (${u.role}): hasPassword=${!!u.passwordHash}`);
    }
  } catch (err) {
    console.error('Error querying users:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
