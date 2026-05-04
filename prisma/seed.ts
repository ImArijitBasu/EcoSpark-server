import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
        accounts: {
          create: {
            accountId: adminEmail,
            providerId: 'credential',
            password: hashedPassword,
          }
        }
      },
    });
    console.log(`  ✅ Admin created: ${admin.email}`);
  } else {
    console.log(`  ⏭️  Admin already exists: ${existingAdmin.email}`);
    // Ensure Better Auth credential account exists
    const existingAccount = await prisma.account.findFirst({
      where: { userId: existingAdmin.id, providerId: 'credential' }
    });
    if (!existingAccount) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await prisma.account.create({
        data: {
          userId: existingAdmin.id,
          accountId: adminEmail,
          providerId: 'credential',
          password: hashedPassword,
        }
      });
      console.log(`  ✅ Admin Account injected for Better Auth.`);
    }
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

  // ── Create 4 Sample Users ─────────────────────────────────
  const sampleUsers = [
    { name: 'Alex Rivers', email: 'alex@ecosparkhub.com', password: 'User@123' },
    { name: 'Sam Green', email: 'sam@ecosparkhub.com', password: 'User@123' },
    { name: 'Taylor Reed', email: 'taylor@ecosparkhub.com', password: 'User@123' },
    { name: 'Casey Lake', email: 'casey@ecosparkhub.com', password: 'User@123' },
  ];

  const createdUsers = [];
  for (const u of sampleUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(u.password, 12);
      const user = await prisma.user.create({
        data: { 
          ...u, 
          password: hashedPassword, 
          role: 'MEMBER',
          accounts: {
            create: {
              accountId: u.email,
              providerId: 'credential',
              password: hashedPassword,
            }
          }
        },
      });
      createdUsers.push(user);
      console.log(`  ✅ User created: ${user.email}`);
    } else {
      createdUsers.push(existing);
      console.log(`  ⏭️  User already exists: ${existing.email}`);
      // Ensure Better Auth credential account exists
      const existingAccount = await prisma.account.findFirst({
        where: { userId: existing.id, providerId: 'credential' }
      });
      if (!existingAccount) {
        const hashedPassword = await bcrypt.hash(u.password, 12);
        await prisma.account.create({
          data: {
            userId: existing.id,
            accountId: u.email,
            providerId: 'credential',
            password: hashedPassword,
          }
        });
      }
    }
  }

  // ── Create 15 Sample Ideas (min 2 per user) ─────────────────────────
  const allCategories = await prisma.category.findMany();
  
  const sampleIdeas = [
    // User 0 (Alex)
    {
      title: 'Solar Powered Street Lights',
      problemStatement: 'High energy consumption for street lighting.',
      proposedSolution: 'Install solar panels and batteries on each light pole.',
      description: 'A project to replace traditional bulbs with LED solar units across the city.',
      slug: 'energy',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1509391366360-fe5bb65858cf'],
      userIndex: 0,
    },
    {
      title: 'Community Composting Hub',
      problemStatement: 'Organic waste filling up landfills.',
      proposedSolution: 'Centralized neighborhood composting centers.',
      description: 'Transform organic waste into nutrient-rich soil for local parks and gardens.',
      slug: 'waste',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1591193512858-aa2d34e3397c'],
      userIndex: 0,
    },
    {
      title: 'Shared Electric Cargo Bikes',
      problemStatement: 'Last-mile delivery emissions in cities.',
      proposedSolution: 'Fleet of electric cargo bikes for local businesses.',
      description: 'Reducing traffic congestion and carbon footprint of local deliveries.',
      slug: 'transportation',
      status: 'UNDER_REVIEW' as const,
      images: ['https://images.unsplash.com/photo-1558981403-c5f91dbbe9ad'],
      userIndex: 0,
    },
    {
      title: 'Ocean Plastic Interceptor',
      problemStatement: 'Rivers carrying plastic into the oceans.',
      proposedSolution: 'Autonomous floating barriers to catch waste.',
      description: 'Cleaning up rivers before they reach the marine ecosystem.',
      slug: 'biodiversity',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1621451537084-482c73073a0f'],
      userIndex: 0,
    },
    
    // User 1 (Sam)
    {
      title: 'Rainwater Harvesting System',
      problemStatement: 'Water scarcity in urban areas.',
      proposedSolution: 'Smart collection tanks for residential buildings.',
      description: 'Collecting and filtering rainwater for non-potable household use.',
      slug: 'water',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1582531388048-f6a5b78ec947'],
      userIndex: 1,
    },
    {
      title: 'Vertical Hydroponic Farm',
      problemStatement: 'Food miles and limited urban space for farming.',
      proposedSolution: 'Indoor vertical farming using nutrient-rich water.',
      description: 'Fresh produce grown in the heart of the city year-round.',
      slug: 'agriculture',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1558449028-s549c1d27996'],
      userIndex: 1,
    },
    {
      title: 'SMART Water Meters',
      problemStatement: 'Unnoticed water leaks in households.',
      proposedSolution: 'IoT meters that detect anamolous water usage.',
      description: 'Alerting homeowners of leaks immediately to save water volumes.',
      slug: 'water',
      status: 'UNDER_REVIEW' as const,
      images: ['https://images.unsplash.com/photo-1541544741938-0af808871cc0'],
      userIndex: 1,
    },
    {
      title: 'Neighborhood Tree Planting',
      problemStatement: 'Urban heat island effect and low air quality.',
      proposedSolution: 'Community-led native tree planting events.',
      description: 'Increasing urban canopy cover to cool neighborhoods naturally.',
      slug: 'biodiversity',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1542601906990-b4d3fb773b09'],
      userIndex: 1,
    },

    // User 2 (Taylor)
    {
      title: 'Pollinator Corridor Project',
      problemStatement: 'Declining bee and butterfly populations.',
      proposedSolution: 'Network of native flower patches across the city.',
      description: 'Creating safe pathways and habitats for essential pollinators.',
      slug: 'biodiversity',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1586771107445-d3ca888129ff'],
      userIndex: 2,
    },
    {
      title: 'Greywater Recycling Unit',
      problemStatement: 'Wasted water from sinks and showers.',
      proposedSolution: 'Affordable home filtration systems.',
      description: 'Reusing sink and shower water for flush toilets and patio gardening.',
      slug: 'water',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1541544741938-0af808871cc0'],
      userIndex: 2,
    },
    {
      title: 'Electric Bus Charging Hub',
      problemStatement: 'Lack of infrastructure for green public transit.',
      proposedSolution: 'Ultra-fast charging stations at bus depots.',
      description: 'Enabling cities to transition to fully electric bus fleets.',
      slug: 'transportation',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1570125909232-eb263c188f7e'],
      userIndex: 2,
    },
    {
      title: 'Wind Energy Storage Solution',
      problemStatement: 'Intermittency of wind power generation.',
      proposedSolution: 'Gravity-based energy storage systems.',
      description: 'Storing excess wind energy for use during low-wind periods.',
      slug: 'energy',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1508514177221-188b1cf16e9d'],
      userIndex: 2,
    },

    // User 3 (Casey)
    {
      title: 'Precision Drip Irrigation',
      problemStatement: 'Inefficient water use in traditional farming.',
      proposedSolution: 'Sensor-based watering systems.',
      description: 'Delivering water directly to plant roots based on soil moisture.',
      slug: 'agriculture',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea'],
      userIndex: 3,
    },
    {
      title: 'Textile Upcycling Workshop',
      problemStatement: 'Fast fashion waste and landfill clutter.',
      proposedSolution: 'Local centers for repairing and redesigning clothes.',
      description: 'Extending the life of textiles through creative reuse.',
      slug: 'waste',
      status: 'APPROVED' as const,
      images: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b'],
      userIndex: 3,
    },
    {
      title: 'Hydrogen Fueled Ferries',
      problemStatement: 'Marine diesel emissions in coastal cities.',
      proposedSolution: 'Zero-emission ferries powered by green hydrogen.',
      description: 'Sustainable water transport for daily commuters.',
      slug: 'transportation',
      status: 'UNDER_REVIEW' as const,
      images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957'],
      userIndex: 3,
    },
  ];

  for (const ideaData of sampleIdeas) {
    const existing = await prisma.idea.findFirst({
      where: { title: ideaData.title },
    });

    if (!existing) {
      const category = allCategories.find((c) => c.slug === ideaData.slug);
      const author = createdUsers[ideaData.userIndex];

      if (category && author) {
        await prisma.idea.create({
          data: {
            title: ideaData.title,
            problemStatement: ideaData.problemStatement,
            proposedSolution: ideaData.proposedSolution,
            description: ideaData.description,
            status: ideaData.status,
            categoryId: category.id,
            authorId: author.id,
            images: ideaData.images,
          },
        });
        console.log(`  ✅ Idea created: ${ideaData.title} by ${author.name}`);
      } else {
        console.log(`  ⚠️  Idea skipped (category or author missing): ${ideaData.title}`);
      }
    } else {
      console.log(`  ⏭️  Idea exists: ${ideaData.title}`);
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
    await pool.end();
    await prisma.$disconnect();
  });
