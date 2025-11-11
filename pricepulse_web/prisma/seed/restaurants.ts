import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRestaurants() {
  console.log('🍔 Seeding restaurants...');

  const restaurants = [
    {
      name: "McDonald's",
      slug: 'mcdonalds',
      category: 'fast_food',
      cuisine: 'american',
      logo: '/restaurants/mcdonalds.png',
      website: 'https://www.mcdonalds.com',
      priceRange: '$',
      active: true,
      menuItems: [
        { name: 'Big Mac', category: 'burgers', calories: 550, basePrice: 5.69 },
        { name: 'Quarter Pounder with Cheese', category: 'burgers', calories: 520, basePrice: 6.49 },
        { name: 'McChicken', category: 'chicken', calories: 400, basePrice: 3.49 },
        { name: '10 Piece Chicken McNuggets', category: 'chicken', calories: 420, basePrice: 5.99 },
        { name: 'Medium French Fries', category: 'sides', calories: 340, basePrice: 2.99 },
        { name: 'Large Coca-Cola', category: 'drinks', calories: 290, basePrice: 2.49 },
        { name: 'McFlurry with Oreo', category: 'desserts', calories: 510, basePrice: 3.99 },
        { name: 'Egg McMuffin', category: 'breakfast', calories: 310, basePrice: 4.49 },
        { name: 'Sausage Biscuit', category: 'breakfast', calories: 460, basePrice: 2.99 },
      ],
    },
    {
      name: 'Chick-fil-A',
      slug: 'chick-fil-a',
      category: 'fast_food',
      cuisine: 'american',
      logo: '/restaurants/chickfila.png',
      website: 'https://www.chick-fil-a.com',
      priceRange: '$$',
      active: true,
      menuItems: [
        { name: 'Chick-fil-A Chicken Sandwich', category: 'chicken', calories: 440, basePrice: 5.39 },
        { name: 'Spicy Chicken Sandwich', category: 'chicken', calories: 460, basePrice: 5.79 },
        { name: '12 Count Nuggets', category: 'chicken', calories: 380, basePrice: 7.19 },
        { name: 'Waffle Potato Fries (Large)', category: 'sides', calories: 460, basePrice: 2.95 },
        { name: 'Chick-fil-A Lemonade (Large)', category: 'drinks', calories: 390, basePrice: 3.19 },
        { name: 'Chicken Biscuit', category: 'breakfast', calories: 460, basePrice: 4.09 },
        { name: 'Hash Browns', category: 'breakfast', calories: 270, basePrice: 1.79 },
      ],
    },
    {
      name: 'Burger King',
      slug: 'burger-king',
      category: 'fast_food',
      cuisine: 'american',
      logo: '/restaurants/burgerking.png',
      website: 'https://www.bk.com',
      priceRange: '$',
      active: true,
      menuItems: [
        { name: 'Whopper', category: 'burgers', calories: 657, basePrice: 6.49 },
        { name: 'Bacon King', category: 'burgers', calories: 1040, basePrice: 7.99 },
        { name: 'Original Chicken Sandwich', category: 'chicken', calories: 660, basePrice: 5.79 },
        { name: '10 Piece Chicken Nuggets', category: 'chicken', calories: 430, basePrice: 4.99 },
        { name: 'Large French Fries', category: 'sides', calories: 430, basePrice: 3.19 },
        { name: 'Large Coca-Cola', category: 'drinks', calories: 310, basePrice: 2.69 },
      ],
    },
    {
      name: "Wendy's",
      slug: 'wendys',
      category: 'fast_food',
      cuisine: 'american',
      logo: '/restaurants/wendys.png',
      website: 'https://www.wendys.com',
      priceRange: '$',
      active: true,
      menuItems: [
        { name: "Dave's Single", category: 'burgers', calories: 570, basePrice: 5.99 },
        { name: 'Spicy Chicken Sandwich', category: 'chicken', calories: 510, basePrice: 5.49 },
        { name: '10 Piece Chicken Nuggets', category: 'chicken', calories: 450, basePrice: 5.79 },
        { name: 'Large Natural Cut Fries', category: 'sides', calories: 480, basePrice: 2.99 },
        { name: 'Large Frosty', category: 'desserts', calories: 590, basePrice: 3.49 },
      ],
    },
    {
      name: 'Taco Bell',
      slug: 'taco-bell',
      category: 'fast_food',
      cuisine: 'mexican',
      logo: '/restaurants/tacobell.png',
      website: 'https://www.tacobell.com',
      priceRange: '$',
      active: true,
      menuItems: [
        { name: 'Crunchy Taco', category: 'tacos', calories: 170, basePrice: 1.69 },
        { name: 'Soft Taco Supreme', category: 'tacos', calories: 210, basePrice: 2.49 },
        { name: 'Bean Burrito', category: 'burritos', calories: 350, basePrice: 1.99 },
        { name: 'Chicken Quesadilla', category: 'specialties', calories: 510, basePrice: 5.49 },
        { name: 'Crunchwrap Supreme', category: 'specialties', calories: 530, basePrice: 4.99 },
        { name: 'Nachos BellGrande', category: 'sides', calories: 740, basePrice: 5.29 },
        { name: 'Large Mountain Dew Baja Blast', category: 'drinks', calories: 410, basePrice: 2.69 },
      ],
    },
    {
      name: 'Chipotle',
      slug: 'chipotle',
      category: 'fast_casual',
      cuisine: 'mexican',
      logo: '/restaurants/chipotle.png',
      website: 'https://www.chipotle.com',
      priceRange: '$$',
      active: true,
      menuItems: [
        { name: 'Chicken Burrito', category: 'burritos', calories: 840, basePrice: 9.95 },
        { name: 'Steak Bowl', category: 'bowls', calories: 650, basePrice: 11.50 },
        { name: 'Carnitas Tacos (3)', category: 'tacos', calories: 630, basePrice: 9.95 },
        { name: 'Guacamole', category: 'sides', calories: 230, basePrice: 3.25 },
        { name: 'Chips & Queso', category: 'sides', calories: 770, basePrice: 5.25 },
      ],
    },
    {
      name: 'Subway',
      slug: 'subway',
      category: 'fast_food',
      cuisine: 'american',
      logo: '/restaurants/subway.png',
      website: 'https://www.subway.com',
      priceRange: '$',
      active: true,
      menuItems: [
        { name: 'Italian B.M.T. (6-inch)', category: 'sandwiches', calories: 390, basePrice: 6.49 },
        { name: 'Turkey Breast (6-inch)', category: 'sandwiches', calories: 280, basePrice: 6.99 },
        { name: 'Spicy Italian (Footlong)', category: 'sandwiches', calories: 960, basePrice: 10.99 },
        { name: 'Veggie Delite (6-inch)', category: 'sandwiches', calories: 230, basePrice: 4.99 },
        { name: 'Chips', category: 'sides', calories: 230, basePrice: 1.99 },
        { name: 'Cookie', category: 'desserts', calories: 220, basePrice: 1.49 },
      ],
    },
    {
      name: 'Starbucks',
      slug: 'starbucks',
      category: 'cafe',
      cuisine: 'american',
      logo: '/restaurants/starbucks.png',
      website: 'https://www.starbucks.com',
      priceRange: '$$',
      active: true,
      menuItems: [
        { name: 'Caffe Latte (Grande)', category: 'hot_coffee', calories: 190, basePrice: 4.95 },
        { name: 'Iced Caramel Macchiato (Grande)', category: 'cold_coffee', calories: 250, basePrice: 5.65 },
        { name: 'Pike Place Roast (Grande)', category: 'hot_coffee', calories: 5, basePrice: 3.15 },
        { name: 'Pumpkin Spice Latte (Grande)', category: 'hot_coffee', calories: 380, basePrice: 6.25 },
        { name: 'Egg & Cheese Protein Box', category: 'food', calories: 470, basePrice: 7.45 },
        { name: 'Blueberry Muffin', category: 'food', calories: 390, basePrice: 3.95 },
      ],
    },
    {
      name: 'Pizza Hut',
      slug: 'pizza-hut',
      category: 'fast_casual',
      cuisine: 'italian',
      logo: '/restaurants/pizzahut.png',
      website: 'https://www.pizzahut.com',
      priceRange: '$$',
      active: true,
      menuItems: [
        { name: 'Large Pepperoni Pizza', category: 'pizza', calories: 2240, basePrice: 14.99 },
        { name: 'Medium Supreme Pizza', category: 'pizza', calories: 1960, basePrice: 13.99 },
        { name: 'Personal Pan Pizza', category: 'pizza', calories: 560, basePrice: 5.99 },
        { name: '8 Piece Bone-In Wings', category: 'wings', calories: 720, basePrice: 10.99 },
        { name: 'Breadsticks (5 pieces)', category: 'sides', calories: 600, basePrice: 6.99 },
      ],
    },
    {
      name: "Domino's",
      slug: 'dominos',
      category: 'fast_casual',
      cuisine: 'italian',
      logo: '/restaurants/dominos.png',
      website: 'https://www.dominos.com',
      priceRange: '$$',
      active: true,
      menuItems: [
        { name: 'Large Pepperoni Pizza', category: 'pizza', calories: 2080, basePrice: 12.99 },
        { name: 'Medium Hand Tossed Pizza', category: 'pizza', calories: 1600, basePrice: 9.99 },
        { name: 'Chicken Wings (10 pieces)', category: 'wings', calories: 800, basePrice: 9.99 },
        { name: 'Cheesy Bread (8 pieces)', category: 'sides', calories: 1120, basePrice: 6.99 },
        { name: 'Cinnamon Bread Twists', category: 'desserts', calories: 220, basePrice: 5.99 },
      ],
    },
    {
      name: 'KFC',
      slug: 'kfc',
      category: 'fast_food',
      cuisine: 'american',
      logo: '/restaurants/kfc.png',
      website: 'https://www.kfc.com',
      priceRange: '$',
      active: true,
      menuItems: [
        { name: '3 Piece Chicken Tenders', category: 'chicken', calories: 340, basePrice: 5.99 },
        { name: '8 Piece Original Recipe Bucket', category: 'chicken', calories: 1760, basePrice: 21.99 },
        { name: 'Famous Bowl', category: 'bowls', calories: 710, basePrice: 5.99 },
        { name: 'Large Mashed Potatoes & Gravy', category: 'sides', calories: 230, basePrice: 3.99 },
        { name: 'Biscuit', category: 'sides', calories: 180, basePrice: 1.29 },
      ],
    },
    {
      name: 'Popeyes',
      slug: 'popeyes',
      category: 'fast_food',
      cuisine: 'american',
      logo: '/restaurants/popeyes.png',
      website: 'https://www.popeyes.com',
      priceRange: '$',
      active: true,
      menuItems: [
        { name: 'Chicken Sandwich', category: 'chicken', calories: 699, basePrice: 4.99 },
        { name: '5 Piece Chicken Tenders', category: 'chicken', calories: 570, basePrice: 7.99 },
        { name: '8 Piece Family Meal', category: 'chicken', calories: 1920, basePrice: 23.99 },
        { name: 'Large Cajun Fries', category: 'sides', calories: 770, basePrice: 3.79 },
        { name: 'Biscuit', category: 'sides', calories: 260, basePrice: 1.29 },
      ],
    },
  ];

  for (const restaurantData of restaurants) {
    const { menuItems, ...restaurant } = restaurantData;

    // Create restaurant
    const createdRestaurant = await prisma.restaurant.upsert({
      where: { slug: restaurant.slug },
      update: restaurant,
      create: restaurant,
    });

    // Create menu items
    for (const item of menuItems) {
      await prisma.menuItem.upsert({
        where: {
          restaurantId_name: {
            restaurantId: createdRestaurant.id,
            name: item.name,
          },
        },
        update: {
          category: item.category,
          calories: item.calories,
          basePrice: item.basePrice,
        },
        create: {
          restaurantId: createdRestaurant.id,
          name: item.name,
          category: item.category,
          calories: item.calories,
          basePrice: item.basePrice,
          available: true,
        },
      });
    }
  }

  console.log(`✅ Seeded ${restaurants.length} restaurants with menu items`);
}
