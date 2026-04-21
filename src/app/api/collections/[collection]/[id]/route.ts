import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/collections/[collection]/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const { collection, id } = await params;

    // Handle settings
    if (collection === 'general') {
      const result = await prisma.generalSettings.findUnique({ where: { id } });
      return NextResponse.json(result);
    } else if (collection === 'ledger') {
      const result = await prisma.ledgerSettings.findUnique({ where: { id } });
      if (result) {
        return NextResponse.json({
          ...result,
          mapping: typeof result.mapping === 'string' ? JSON.parse(result.mapping) : result.mapping,
          debitAccounts: Array.isArray(result.debitAccounts) ? result.debitAccounts : result.debitAccounts ? JSON.parse(result.debitAccounts) : []
        });
      }
      return NextResponse.json(null);
    } else if (collection === 'interest') {
      const result = await prisma.interestSettings.findUnique({ where: { id } });
      if (result) {
        return NextResponse.json({
          ...result,
          tiers: typeof result.tiers === 'string' ? JSON.parse(result.tiers) : result.tiers
        });
      }
      return NextResponse.json(null);
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

    const result = await model.findUnique({ where: { id } });
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/collections/[collection]/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const { collection, id } = await params;
    const data = await request.json();

    // Handle settings
    if (collection === 'general') {
      await prisma.generalSettings.update({ where: { id }, data });
      return NextResponse.json({ success: true });
    } else if (collection === 'ledger') {
      await prisma.ledgerSettings.update({
        where: { id },
        data: {
          ...data,
          mapping: JSON.stringify(data.mapping),
          debitAccounts: JSON.stringify(data.debitAccounts)
        }
      });
      return NextResponse.json({ success: true });
    } else if (collection === 'interest') {
      await prisma.interestSettings.update({
        where: { id },
        data: {
          ...data,
          tiers: JSON.stringify(data.tiers)
        }
      });
      return NextResponse.json({ success: true });
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

    await model.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/collections/[collection]/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  try {
    const { collection, id } = await params;

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

    await model.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}