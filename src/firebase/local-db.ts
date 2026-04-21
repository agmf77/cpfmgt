'use client';

import Dexie, { Table } from 'dexie';
import { CHART_OF_ACCOUNTS, COAEntry } from '@/lib/coa-data';
import { getOfflineAuthUser, createOfflineAuthUser } from './offline-auth';
import { addDoc, getDocs } from 'firebase/firestore';

export type LocalCollectionName =
  | 'members'
  | 'journalEntries'
  | 'investmentInstruments'
  | 'fundSummaries'
  | 'chartOfAccounts'
  | 'settings';

export interface LocalDocument {
  id: string;
  [key: string]: any;
}

const DEFAULT_GENERAL_SETTINGS = {
  id: 'general',
  pbsName: 'Gazipur Palli Bidyut Samity-2',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_LEDGER_SETTINGS = {
  id: 'ledger',
  mapping: {},
  debitAccounts: [],
  updatedAt: new Date().toISOString(),
};

const DEFAULT_INTEREST_SETTINGS = {
  id: 'interest',
  tiers: [
    { limit: 1500000, rate: 0.13 },
    { limit: 3000000, rate: 0.12 },
    { limit: null, rate: 0.11 },
  ],
  tdsRate: 0.2,
  updatedAt: new Date().toISOString(),
};

class LocalDatabase extends Dexie {
  members!: Table<Record<string, any>, string>;
  journalEntries!: Table<Record<string, any>, string>;
  investmentInstruments!: Table<Record<string, any>, string>;
  fundSummaries!: Table<Record<string, any>, string>;
  chartOfAccounts!: Table<COAEntry & { id: string }, string>;
  settings!: Table<Record<string, any>, string>;

  constructor() {
    super('PBSCPF_LocalDB');
    this.version(1).stores({
      members: 'id,memberIdNumber,memberName',
      journalEntries: 'id,entryDate',
      investmentInstruments: 'id,instrumentType,principalAmount',
      fundSummaries: 'id,memberId,createdAt',
      chartOfAccounts: 'id,code,type',
      settings: 'id',
    });
  }
}

export const localDb = new LocalDatabase();

function createLocalDocumentId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

function getCollectionNameFromPath(path: string): LocalCollectionName | null {
  const segments = path.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  const secondLast = segments[segments.length - 2];

  if (last === 'fundSummaries') {
    return 'fundSummaries';
  }

  if (
    last === 'members' ||
    last === 'journalEntries' ||
    last === 'investmentInstruments' ||
    last === 'chartOfAccounts' ||
    last === 'settings'
  ) {
    return last;
  }

  if (
    secondLast === 'members' ||
    secondLast === 'journalEntries' ||
    secondLast === 'investmentInstruments' ||
    secondLast === 'chartOfAccounts' ||
    secondLast === 'settings' ||
    secondLast === 'fundSummaries'
  ) {
    return secondLast as LocalCollectionName;
  }

  return null;
}

function getDocumentIdFromPath(path: string) {
  const segments = path.split('/').filter(Boolean);
  return segments[segments.length - 1] || null;
}

function getParentIdFromPath(path: string) {
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 3) {
    return segments[segments.length - 2] ?? null;
  }
  return null;
}

function mapFilterValue(filter: any) {
  if (filter === undefined || filter === null) {
    return filter;
  }
  if (typeof filter === 'object') {
    return filter.value ?? filter.internalValue ?? filter;
  }
  return filter;
}

function getFieldName(field: any): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field.canonicalString === 'function') return field.canonicalString();
  if (field.path && typeof field.path.canonicalString === 'function') return field.path.canonicalString();
  if (field.fieldPath && typeof field.fieldPath.canonicalString === 'function') return field.fieldPath.canonicalString();
  return String(field);
}

function sortCollection(items: LocalDocument[], orderBy: any): LocalDocument[] {
  if (!Array.isArray(orderBy)) return items;

  return [...items].sort((left, right) => {
    for (const order of orderBy) {
      const field = getFieldName(order.field);
      const direction = order.direction || order.dir || 'asc';
      const leftValue = left[field];
      const rightValue = right[field];

      if (leftValue === rightValue) {
        continue;
      }

      const orderDelta = leftValue > rightValue ? 1 : -1;
      return direction.toLowerCase() === 'desc' ? -orderDelta : orderDelta;
    }
    return 0;
  });
}

function applyLocalFilters(items: LocalDocument[], query: any) {
  // Try different ways to access filters from Firestore query
  let filters = [];

  if (query._query) {
    filters = query._query.filters || query._query.filter || [];
  } else if (query.filters) {
    filters = query.filters;
  } else if (query._filters) {
    filters = query._filters;
  }

  if (!Array.isArray(filters) || filters.length === 0) {
    return items;
  }

  return items.filter((item) => {
    for (const filter of filters) {
      const fieldName = getFieldName(filter.field);
      const value = mapFilterValue(filter.value);
      const op = filter.op || filter.operator || filter.opString;
      const itemValue = item[fieldName];

      switch (op) {
        case '==':
        case '===':
          if (itemValue !== value) return false;
          break;
        case '!=':
        case '!==':
          if (itemValue === value) return false;
          break;
        case '<':
          if (!(itemValue < value)) return false;
          break;
        case '<=':
          if (!(itemValue <= value)) return false;
          break;
        case '>':
          if (!(itemValue > value)) return false;
          break;
        case '>=':
          if (!(itemValue >= value)) return false;
          break;
        case 'array-contains':
          if (!Array.isArray(itemValue) || !itemValue.includes(value)) return false;
          break;
        default:
          break;
      }
    }
    return true;
  });
}

function applyLocalOrderingAndLimits(items: LocalDocument[], query: any) {
  const internal = query._query as any;
  const orderBy = internal?.explicitOrderBy ?? internal?.orderBy ?? [];
  const limit = internal?.limit?.toInt?.() ?? internal?.limit ?? internal?.limit?.value;

  let result = items;
  if (Array.isArray(orderBy) && orderBy.length > 0) {
    result = sortCollection(result, orderBy);
  }

  if (typeof limit === 'number' && limit >= 0) {
    result = result.slice(0, limit);
  }

  return result;
}

function makeLocalSnapshot(items: LocalDocument[], path: string) {
  const docs = items.map((item) => ({
    id: item.id,
    data: () => ({ ...item }),
    ref: { path: `${path}/${item.id}` } as any,
  }));

  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    metadata: { fromCache: true, hasPendingWrites: false },
    query: {} as any,
    forEach(callback: (doc: any) => void) {
      docs.forEach(callback);
    },
    docChanges() {
      return docs.map((doc) => ({ doc, type: 'added', oldIndex: -1, newIndex: 0 }));
    },
  } as any;
}

export function shouldUseLocalDatabase() {
  if (typeof window === 'undefined') return false;

  // Always use local database for full offline mode
  return true;
}

export async function ensureLocalDatabaseSeed() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    await localDb.transaction('rw', localDb.chartOfAccounts, localDb.settings, async () => {
      if ((await localDb.chartOfAccounts.count()) === 0) {
        const initialCoa = CHART_OF_ACCOUNTS.map((entry) => ({
          ...entry,
          id: entry.code,
        }));
        await localDb.chartOfAccounts.bulkPut(initialCoa);
      }

      const existingGeneral = await localDb.settings.get(DEFAULT_GENERAL_SETTINGS.id);
      if (!existingGeneral) {
        await localDb.settings.put(DEFAULT_GENERAL_SETTINGS);
      }

      const existingLedger = await localDb.settings.get(DEFAULT_LEDGER_SETTINGS.id);
      if (!existingLedger) {
        await localDb.settings.put(DEFAULT_LEDGER_SETTINGS);
      }

      const existingInterest = await localDb.settings.get(DEFAULT_INTEREST_SETTINGS.id);
      if (!existingInterest) {
        await localDb.settings.put(DEFAULT_INTEREST_SETTINGS);
      }
    });

    // Ensure offline user exists for local mode
    if (!getOfflineAuthUser()) {
      createOfflineAuthUser('Local PBS CPF User');
    }
  } catch (error) {
    console.warn('Unable to initialize local database:', error);
  }
}

export async function readLocalCollection(path: string, query?: any) {
  const collectionName = getCollectionNameFromPath(path);
  if (!collectionName) {
    return [];
  }

  let items = (await localDb.table(collectionName).toArray()) as LocalDocument[];
  const segments = path.split('/').filter(Boolean);

  if (collectionName === 'fundSummaries' && segments.length === 3) {
    const memberId = segments[1];
    items = items.filter((item) => item.memberId === memberId);
  }

  if (query) {
    items = applyLocalFilters(items, query);
    items = applyLocalOrderingAndLimits(items, query);
  }

  return items;
}

export async function readLocalDocument(path: string) {
  const collectionName = getCollectionNameFromPath(path);
  const id = getDocumentIdFromPath(path);
  if (!collectionName || !id) {
    return null;
  }

  const doc = (await localDb.table(collectionName).get(id)) as LocalDocument | undefined;
  return doc ?? null;
}

export async function addLocalDocument(path: string, data: any) {
  const collectionName = getCollectionNameFromPath(path);
  if (!collectionName) {
    throw new Error(`Unsupported local collection path: ${path}`);
  }

  const id = data?.id || createLocalDocumentId();
  const normalizedData = { ...data, id };

  if (collectionName === 'fundSummaries') {
    const memberId = getParentIdFromPath(path);
    if (memberId) {
      normalizedData.memberId = normalizedData.memberId || memberId;
    }
  }

  await localDb.table(collectionName).put(normalizedData);
  return id;
}

export async function getLocalDocuments(target: any) {
  const path =
    target?.path ||
    target?._query?.path?.canonicalString?.() ||
    target?._query?.path?.toString?.();

  if (!path) {
    throw new Error('Unable to resolve path for local query');
  }

  const items = await readLocalCollection(path, target);
  return makeLocalQuerySnapshot(items, path);
}

export async function getLocalDocument(target: any) {
  const path =
    target?.path ||
    target?._query?.path?.canonicalString?.() ||
    target?._query?.path?.toString?.();

  if (!path) {
    throw new Error('Unable to resolve path for local document');
  }

  const doc = await readLocalDocument(path);
  return doc ? { id: doc.id, data: () => ({ ...doc }), ref: { path } } : null;
}

export async function getDocsWithFallback(target: any) {
  if (shouldUseLocalDatabase()) {
    return getLocalDocuments(target);
  }

  return getDocs(target);
}

export async function addDocWithFallback(colRef: any, data: any) {
  if (shouldUseLocalDatabase()) {
    const id = await addLocalDocument(colRef.path, data);
    return { id } as any;
  }

  return addDoc(colRef, data);
}

export async function setLocalDocument(path: string, data: any, options?: { merge?: boolean }) {
  const collectionName = getCollectionNameFromPath(path);
  const id = getDocumentIdFromPath(path);
  if (!collectionName || !id) {
    throw new Error(`Unsupported local document path: ${path}`);
  }

  const record = options?.merge
    ? { ...(await localDb.table(collectionName).get(id)), ...data, id }
    : { ...data, id };

  await localDb.table(collectionName).put(record);
}

export async function deleteLocalDocument(path: string) {
  const collectionName = getCollectionNameFromPath(path);
  const id = getDocumentIdFromPath(path);
  if (!collectionName || !id) {
    throw new Error(`Unsupported local document path: ${path}`);
  }

  await localDb.table(collectionName).delete(id);
}

export function makeLocalQuerySnapshot(items: LocalDocument[], path: string) {
  return makeLocalSnapshot(items, path);
}

// Export all database data for backup
export async function exportDatabaseData(): Promise<string> {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {
      members: await localDb.members.toArray(),
      journalEntries: await localDb.journalEntries.toArray(),
      investmentInstruments: await localDb.investmentInstruments.toArray(),
      fundSummaries: await localDb.fundSummaries.toArray(),
      chartOfAccounts: await localDb.chartOfAccounts.toArray(),
      settings: await localDb.settings.toArray(),
    }
  };
  return JSON.stringify(data, null, 2);
}

// Import database data from backup
export async function importDatabaseData(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData);

  if (!data.version || !data.tables) {
    throw new Error('Invalid backup file format');
  }

  // Clear existing data
  await localDb.transaction('rw', [
    localDb.members,
    localDb.journalEntries,
    localDb.investmentInstruments,
    localDb.fundSummaries,
    localDb.chartOfAccounts,
    localDb.settings,
  ], async () => {
    await localDb.members.clear();
    await localDb.journalEntries.clear();
    await localDb.investmentInstruments.clear();
    await localDb.fundSummaries.clear();
    await localDb.chartOfAccounts.clear();
    await localDb.settings.clear();

    // Import new data
    if (data.tables.members) {
      await localDb.members.bulkPut(data.tables.members);
    }
    if (data.tables.journalEntries) {
      await localDb.journalEntries.bulkPut(data.tables.journalEntries);
    }
    if (data.tables.investmentInstruments) {
      await localDb.investmentInstruments.bulkPut(data.tables.investmentInstruments);
    }
    if (data.tables.fundSummaries) {
      await localDb.fundSummaries.bulkPut(data.tables.fundSummaries);
    }
    if (data.tables.chartOfAccounts) {
      await localDb.chartOfAccounts.bulkPut(data.tables.chartOfAccounts);
    }
    if (data.tables.settings) {
      await localDb.settings.bulkPut(data.tables.settings);
    }
  });

  // Re-seed default data if needed
  await ensureLocalDatabaseSeed();
}
