import { PrismaClient } from '@prisma/client';
import { seedStores } from './seed/stores';
import { seedPlatforms } from './seed/platforms';
import { seedRestaurants } from './seed/restaurants';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed stores
  await seedStores();

  // Seed delivery platforms
  await seedPlatforms();

  // Seed restaurants
  await seedRestaurants();

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
