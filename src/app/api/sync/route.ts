import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/sync
 * Syncs offline IndexedDB data to PostgreSQL
 * Called automatically when app detects internet connection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collections } = body;

    if (!collections || typeof collections !== 'object') {
      return NextResponse.json({ error: 'Invalid sync data' }, { status: 400 });
    }

    const syncResults: Record<string, { total: number; synced: number; failed: number }> = {};

    // Sync each collection
    for (const [collectionName, items] of Object.entries(collections)) {
      if (!Array.isArray(items)) continue;

      syncResults[collectionName] = { total: items.length, synced: 0, failed: 0 };

      for (const item of items) {
        try {
          await syncCollectionItem(collectionName, item);
          syncResults[collectionName].synced++;
        } catch (err) {
          console.error(`Failed to sync ${collectionName}:`, err);
          syncResults[collectionName].failed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      results: syncResults,
    });
  } catch (error) {
    console.error('Sync API Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

/**
 * Sync individual collection items to PostgreSQL
 */
async function syncCollectionItem(collectionName: string, item: any) {
  const id = item.id || item._id;

  switch (collectionName) {
    case 'members':
      return await prisma.member.upsert({
        where: { id },
        create: item,
        update: item,
      });

    case 'journalEntries':
      return await prisma.journalEntry.upsert({
        where: { id },
        create: {
          ...item,
          entryDate: new Date(item.entryDate),
        },
        update: {
          ...item,
          entryDate: new Date(item.entryDate),
        },
      });

    case 'investmentInstruments':
      return await prisma.investmentInstrument.upsert({
        where: { id },
        create: item,
        update: item,
      });

    case 'chartOfAccounts':
      return await prisma.chartOfAccount.upsert({
        where: { code: item.code },
        create: item,
        update: item,
      });

    case 'fundSummaries':
      return await prisma.fundSummary.upsert({
        where: { id },
        create: {
          ...item,
          summaryDate: new Date(item.summaryDate),
        },
        update: {
          ...item,
          summaryDate: new Date(item.summaryDate),
        },
      });

    case 'settings':
      if (item.id === 'general') {
        return await prisma.generalSettings.upsert({
          where: { id: 'general' },
          create: item,
          update: item,
        });
      } else if (item.id === 'ledger') {
        return await prisma.ledgerSettings.upsert({
          where: { id: 'ledger' },
          create: {
            ...item,
            mapping: typeof item.mapping === 'string' ? item.mapping : JSON.stringify(item.mapping),
            debitAccounts: typeof item.debitAccounts === 'string' ? item.debitAccounts : JSON.stringify(item.debitAccounts),
          },
          update: {
            ...item,
            mapping: typeof item.mapping === 'string' ? item.mapping : JSON.stringify(item.mapping),
            debitAccounts: typeof item.debitAccounts === 'string' ? item.debitAccounts : JSON.stringify(item.debitAccounts),
          },
        });
      } else if (item.id === 'interest') {
        return await prisma.interestSettings.upsert({
          where: { id: 'interest' },
          create: {
            ...item,
            tiers: typeof item.tiers === 'string' ? item.tiers : JSON.stringify(item.tiers),
          },
          update: {
            ...item,
            tiers: typeof item.tiers === 'string' ? item.tiers : JSON.stringify(item.tiers),
          },
        });
      }
      break;

    default:
      console.warn(`Unknown collection: ${collectionName}`);
  }
}
