import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/collections/[collection]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const { collection } = await params;

    // Map collection names to Prisma models
    const modelMap: Record<string, any> = {
      members: prisma.member,
      journalEntries: prisma.journalEntry,
      investmentInstruments: prisma.investmentInstrument,
      chartOfAccounts: prisma.chartOfAccount,
      fundSummaries: prisma.fundSummary,
    };

    // Handle settings
    if (collection === 'settings') {
      const allSettings = await Promise.all([
        prisma.generalSettings.findMany(),
        prisma.ledgerSettings.findMany(),
        prisma.interestSettings.findMany(),
      ]);

      const formattedData = [
        ...allSettings[0].map((s: any) => ({ ...s, id: 'general' })),
        ...allSettings[1].map((s: any) => ({ ...s, id: 'ledger', mapping: JSON.parse(s.mapping), debitAccounts: JSON.parse(s.debitAccounts) })),
        ...allSettings[2].map((s: any) => ({ ...s, id: 'interest', tiers: JSON.parse(s.tiers) })),
      ];

      return NextResponse.json(formattedData);
    }

    const model = modelMap[collection];
    if (!model) {
      return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });
    }

    const result = await model.findMany();
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/collections/[collection]
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  try {
    const { collection } = await params;
    const data = await request.json();

    // Handle settings
    if (collection === 'settings') {
      if (data.id === 'general') {
        const result = await prisma.generalSettings.create({ data: { ...data, id: undefined } });
        return NextResponse.json({ id: result.id });
      } else if (data.id === 'ledger') {
        const result = await prisma.ledgerSettings.create({
          data: {
            ...data,
            id: undefined,
            mapping: JSON.stringify(data.mapping),
            debitAccounts: JSON.stringify(data.debitAccounts)
          }
        });
        return NextResponse.json({ id: result.id });
      } else if (data.id === 'interest') {
        const result = await prisma.interestSettings.create({
          data: {
            ...data,
            id: undefined,
            tiers: JSON.stringify(data.tiers)
          }
        });
        return NextResponse.json({ id: result.id });
      }
    }

    const modelMap: Record<string, any> = {
      members: prisma.member,
      journalEntries: prisma.journalEntry,
      investmentInstruments: prisma.investmentInstrument,
      chartOfAccounts: prisma.chartOfAccount,
      fundSummaries: prisma.fundSummary,
    };

    const model = modelMap[collection];
    if (!model) {
      return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });
    }

    const result = await model.create({ data });
    return NextResponse.json({ id: result.id });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}