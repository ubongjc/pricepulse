import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const stores = [
  // United States
  { name: 'Walmart', slug: 'walmart', country: 'US', website: 'https://www.walmart.com', apiEnabled: true, logo: '/logos/walmart.png' },
  { name: 'Target', slug: 'target', country: 'US', website: 'https://www.target.com', apiEnabled: true, logo: '/logos/target.png' },
  { name: 'Kroger', slug: 'kroger', country: 'US', website: 'https://www.kroger.com', apiEnabled: true, logo: '/logos/kroger.png' },
  { name: 'Safeway', slug: 'safeway', country: 'US', website: 'https://www.safeway.com', apiEnabled: true, logo: '/logos/safeway.png' },
  { name: 'Albertsons', slug: 'albertsons', country: 'US', website: 'https://www.albertsons.com', apiEnabled: true, logo: '/logos/albertsons.png' },
  { name: 'Costco', slug: 'costco', country: 'US', website: 'https://www.costco.com', apiEnabled: true, logo: '/logos/costco.png' },
  { name: "Sam's Club", slug: 'sams-club', country: 'US', website: 'https://www.samsclub.com', apiEnabled: true, logo: '/logos/samsclub.png' },
  { name: 'Whole Foods', slug: 'whole-foods', country: 'US', website: 'https://www.wholefoodsmarket.com', apiEnabled: true, logo: '/logos/wholefoods.png' },
  { name: 'Trader Joe\'s', slug: 'trader-joes', country: 'US', website: 'https://www.traderjoes.com', scrapingEnabled: true, logo: '/logos/traderjoes.png' },
  { name: 'Aldi', slug: 'aldi-us', country: 'US', website: 'https://www.aldi.us', scrapingEnabled: true, logo: '/logos/aldi.png' },
  { name: 'Publix', slug: 'publix', country: 'US', website: 'https://www.publix.com', scrapingEnabled: true, logo: '/logos/publix.png' },
  { name: 'H-E-B', slug: 'heb', country: 'US', website: 'https://www.heb.com', scrapingEnabled: true, logo: '/logos/heb.png' },
  { name: 'Wegmans', slug: 'wegmans', country: 'US', website: 'https://www.wegmans.com', scrapingEnabled: true, logo: '/logos/wegmans.png' },
  { name: 'Food Lion', slug: 'food-lion', country: 'US', website: 'https://www.foodlion.com', scrapingEnabled: true, logo: '/logos/foodlion.png' },
  { name: 'Stop & Shop', slug: 'stop-shop', country: 'US', website: 'https://stopandshop.com', scrapingEnabled: true, logo: '/logos/stopandshop.png' },
  { name: 'Giant Food', slug: 'giant-food', country: 'US', website: 'https://giantfood.com', scrapingEnabled: true, logo: '/logos/giantfood.png' },
  { name: 'ShopRite', slug: 'shoprite', country: 'US', website: 'https://www.shoprite.com', scrapingEnabled: true, logo: '/logos/shoprite.png' },
  { name: 'Meijer', slug: 'meijer', country: 'US', website: 'https://www.meijer.com', scrapingEnabled: true, logo: '/logos/meijer.png' },
  { name: 'Amazon Fresh', slug: 'amazon-fresh-us', country: 'US', website: 'https://www.amazon.com/fresh', apiEnabled: true, logo: '/logos/amazonfresh.png' },
  { name: 'Instacart', slug: 'instacart-us', country: 'US', website: 'https://www.instacart.com', apiEnabled: true, logo: '/logos/instacart.png' },

  // Canada
  { name: 'Loblaws', slug: 'loblaws', country: 'CA', website: 'https://www.loblaws.ca', scrapingEnabled: true, logo: '/logos/loblaws.png' },
  { name: 'Sobeys', slug: 'sobeys', country: 'CA', website: 'https://www.sobeys.com', scrapingEnabled: true, logo: '/logos/sobeys.png' },
  { name: 'Metro', slug: 'metro-ca', country: 'CA', website: 'https://www.metro.ca', scrapingEnabled: true, logo: '/logos/metro.png' },
  { name: 'Walmart Canada', slug: 'walmart-ca', country: 'CA', website: 'https://www.walmart.ca', apiEnabled: true, logo: '/logos/walmart.png' },
  { name: 'Costco Canada', slug: 'costco-ca', country: 'CA', website: 'https://www.costco.ca', apiEnabled: true, logo: '/logos/costco.png' },
  { name: 'No Frills', slug: 'no-frills', country: 'CA', website: 'https://www.nofrills.ca', scrapingEnabled: true, logo: '/logos/nofrills.png' },
  { name: 'Food Basics', slug: 'food-basics', country: 'CA', website: 'https://www.foodbasics.ca', scrapingEnabled: true, logo: '/logos/foodbasics.png' },
  { name: 'FreshCo', slug: 'freshco', country: 'CA', website: 'https://www.freshco.com', scrapingEnabled: true, logo: '/logos/freshco.png' },
  { name: 'Independent Grocer', slug: 'independent', country: 'CA', website: 'https://www.yourindependentgrocer.ca', scrapingEnabled: true, logo: '/logos/independent.png' },
  { name: 'Save-On-Foods', slug: 'save-on-foods', country: 'CA', website: 'https://www.saveonfoods.com', scrapingEnabled: true, logo: '/logos/saveonfoods.png' },
  { name: 'Safeway Canada', slug: 'safeway-ca', country: 'CA', website: 'https://www.safeway.ca', scrapingEnabled: true, logo: '/logos/safeway.png' },
  { name: 'IGA', slug: 'iga-ca', country: 'CA', website: 'https://www.iga.net', scrapingEnabled: true, logo: '/logos/iga.png' },

  // United Kingdom
  { name: 'Tesco', slug: 'tesco', country: 'UK', website: 'https://www.tesco.com', apiEnabled: true, logo: '/logos/tesco.png' },
  { name: 'Sainsbury\'s', slug: 'sainsburys', country: 'UK', website: 'https://www.sainsburys.co.uk', apiEnabled: true, logo: '/logos/sainsburys.png' },
  { name: 'Asda', slug: 'asda', country: 'UK', website: 'https://www.asda.com', scrapingEnabled: true, logo: '/logos/asda.png' },
  { name: 'Morrisons', slug: 'morrisons', country: 'UK', website: 'https://www.morrisons.com', scrapingEnabled: true, logo: '/logos/morrisons.png' },
  { name: 'Aldi UK', slug: 'aldi-uk', country: 'UK', website: 'https://www.aldi.co.uk', scrapingEnabled: true, logo: '/logos/aldi.png' },
  { name: 'Lidl UK', slug: 'lidl-uk', country: 'UK', website: 'https://www.lidl.co.uk', scrapingEnabled: true, logo: '/logos/lidl.png' },
  { name: 'Waitrose', slug: 'waitrose', country: 'UK', website: 'https://www.waitrose.com', scrapingEnabled: true, logo: '/logos/waitrose.png' },
  { name: 'Iceland', slug: 'iceland-uk', country: 'UK', website: 'https://www.iceland.co.uk', scrapingEnabled: true, logo: '/logos/iceland.png' },
  { name: 'Co-op UK', slug: 'coop-uk', country: 'UK', website: 'https://www.coop.co.uk', scrapingEnabled: true, logo: '/logos/coop.png' },
  { name: 'Marks & Spencer', slug: 'marks-spencer', country: 'UK', website: 'https://www.marksandspencer.com', scrapingEnabled: true, logo: '/logos/marksandspencer.png' },

  // Australia
  { name: 'Woolworths', slug: 'woolworths-au', country: 'AU', website: 'https://www.woolworths.com.au', apiEnabled: true, logo: '/logos/woolworths.png' },
  { name: 'Coles', slug: 'coles', country: 'AU', website: 'https://www.coles.com.au', apiEnabled: true, logo: '/logos/coles.png' },
  { name: 'IGA Australia', slug: 'iga-au', country: 'AU', website: 'https://www.iga.com.au', scrapingEnabled: true, logo: '/logos/iga.png' },
  { name: 'Aldi Australia', slug: 'aldi-au', country: 'AU', website: 'https://www.aldi.com.au', scrapingEnabled: true, logo: '/logos/aldi.png' },
  { name: 'Costco Australia', slug: 'costco-au', country: 'AU', website: 'https://www.costco.com.au', scrapingEnabled: true, logo: '/logos/costco.png' },

  // Germany
  { name: 'Edeka', slug: 'edeka', country: 'DE', website: 'https://www.edeka.de', scrapingEnabled: true, logo: '/logos/edeka.png' },
  { name: 'Rewe', slug: 'rewe', country: 'DE', website: 'https://www.rewe.de', scrapingEnabled: true, logo: '/logos/rewe.png' },
  { name: 'Aldi Süd', slug: 'aldi-de-sud', country: 'DE', website: 'https://www.aldi-sued.de', scrapingEnabled: true, logo: '/logos/aldi.png' },
  { name: 'Lidl', slug: 'lidl-de', country: 'DE', website: 'https://www.lidl.de', scrapingEnabled: true, logo: '/logos/lidl.png' },
  { name: 'Kaufland', slug: 'kaufland', country: 'DE', website: 'https://www.kaufland.de', scrapingEnabled: true, logo: '/logos/kaufland.png' },

  // France
  { name: 'Carrefour', slug: 'carrefour', country: 'FR', website: 'https://www.carrefour.fr', apiEnabled: true, logo: '/logos/carrefour.png' },
  { name: 'Auchan', slug: 'auchan', country: 'FR', website: 'https://www.auchan.fr', scrapingEnabled: true, logo: '/logos/auchan.png' },
  { name: 'Leclerc', slug: 'leclerc', country: 'FR', website: 'https://www.e-leclerc.com', scrapingEnabled: true, logo: '/logos/leclerc.png' },
  { name: 'Intermarché', slug: 'intermarche', country: 'FR', website: 'https://www.intermarche.com', scrapingEnabled: true, logo: '/logos/intermarche.png' },
  { name: 'Casino', slug: 'casino-fr', country: 'FR', website: 'https://www.casino.fr', scrapingEnabled: true, logo: '/logos/casino.png' },
];

export async function seedStores() {
  console.log('Seeding stores...');

  for (const store of stores) {
    await prisma.store.upsert({
      where: { slug: store.slug },
      update: store,
      create: store,
    });
  }

  console.log(`✅ Seeded ${stores.length} stores`);
}

export default seedStores;
