import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Create Admin User ───────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ecosparkhub.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'EcoSpark Admin';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`  ✅ Admin created: ${admin.email}`);
  } else {
    console.log(`  ⏭️  Admin already exists: ${existingAdmin.email}`);
  }

  // ── Create Default Categories ────────────────────────────
  const categories = [
    {
      name: 'Energy',
      slug: 'energy',
      description: 'Solar, wind, and renewable energy projects',
      icon: '⚡',
    },
    {
      name: 'Waste',
      slug: 'waste',
      description: 'Waste reduction, recycling, and upcycling initiatives',
      icon: '♻️',
    },
    {
      name: 'Transportation',
      slug: 'transportation',
      description: 'Eco-friendly transportation and mobility solutions',
      icon: '🚲',
    },
    {
      name: 'Water',
      slug: 'water',
      description: 'Water conservation and purification projects',
      icon: '💧',
    },
    {
      name: 'Agriculture',
      slug: 'agriculture',
      description: 'Sustainable farming and food production',
      icon: '🌾',
    },
    {
      name: 'Biodiversity',
      slug: 'biodiversity',
      description: 'Wildlife conservation and ecosystem protection',
      icon: '🌿',
    },
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });

    if (!existing) {
      await prisma.category.create({ data: cat });
      console.log(`  ✅ Category created: ${cat.name}`);
    } else {
      console.log(`  ⏭️  Category exists: ${cat.name}`);
    }
  }

  console.log('\n🌱 Seeding complete!\n');
  console.log('  Admin credentials:');
  console.log(`    Email: ${adminEmail}`);
  console.log(`    Password: ${adminPassword}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
