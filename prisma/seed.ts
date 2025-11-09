import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.refreshToken.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  console.log('Creating demo users...');

  const demoPassword = await bcrypt.hash('Demo123456', 10);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      passwordHash: demoPassword,
      name: 'Demo',
      surname: 'User',
      emailVerified: true,
    },
  });

  const johnDoe = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      passwordHash: await bcrypt.hash('John123456', 10),
      name: 'John',
      surname: 'Doe',
      emailVerified: true,
    },
  });

  const janeDoe = await prisma.user.create({
    data: {
      email: 'jane.doe@example.com',
      passwordHash: await bcrypt.hash('Jane123456', 10),
      name: 'Jane',
      surname: 'Doe',
      emailVerified: false,
    },
  });

  const alexSmith = await prisma.user.create({
    data: {
      email: 'alex.smith@example.com',
      passwordHash: await bcrypt.hash('Alex123456', 10),
      name: 'Alex',
      surname: 'Smith',
      emailVerified: true,
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Created users:');
  console.log(`  • Demo User: demo@example.com / Demo123456 (verified)`);
  console.log(`  • John Doe: john.doe@example.com / John123456 (verified)`);
  console.log(`  • Jane Doe: jane.doe@example.com / Jane123456 (not verified)`);
  console.log(`  • Alex Smith: alex.smith@example.com / Alex123456 (verified)`);
  console.log('\n🎯 Use these credentials to test the application!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
