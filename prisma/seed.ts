import { PrismaClient } from '../src/generated/prisma/client';
import { CHART_OF_ACCOUNTS } from '../src/lib/coa-data';

const prisma = new PrismaClient({} as any);

async function main() {
  console.log('Seeding database...');

  // Seed chart of accounts
  console.log('Seeding chart of accounts...');
  for (const account of CHART_OF_ACCOUNTS) {
    await prisma.chartOfAccount.upsert({
      where: { code: account.code },
      update: account,
      create: account,
    });
  }

  // Seed general settings
  console.log('Seeding general settings...');
  await prisma.generalSettings.upsert({
    where: { id: 'default' },
    update: {
      pbsName: 'Gazipur Palli Bidyut Samity-2',
    },
    create: {
      id: 'default',
      pbsName: 'Gazipur Palli Bidyut Samity-2',
    },
  });

  // Seed ledger settings
  console.log('Seeding ledger settings...');
  await prisma.ledgerSettings.upsert({
    where: { id: 'default' },
    update: {
      mapping: JSON.stringify({}),
      debitAccounts: JSON.stringify([]),
    },
    create: {
      id: 'default',
      mapping: JSON.stringify({}),
      debitAccounts: JSON.stringify([]),
    },
  });

  // Seed interest settings
  console.log('Seeding interest settings...');
  await prisma.interestSettings.upsert({
    where: { id: 'default' },
    update: {
      tiers: JSON.stringify([
        { limit: 1500000, rate: 0.13 },
        { limit: 3000000, rate: 0.12 },
        { limit: null, rate: 0.11 },
      ]),
      tdsRate: 0.2,
    },
    create: {
      id: 'default',
      tiers: JSON.stringify([
        { limit: 1500000, rate: 0.13 },
        { limit: 3000000, rate: 0.12 },
        { limit: null, rate: 0.11 },
      ]),
      tdsRate: 0.2,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });