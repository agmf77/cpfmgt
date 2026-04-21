'use client';
    
import {
  DocumentReference,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { useDoc as useSQLDoc } from '@/lib/sql-database';

export type LocalDocumentReference = {
  type: 'doc';
  path: string;
};

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | LocalDocumentReference | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const pathSegments = memoizedDocRef?.path.split('/') ?? [];
  const collectionName = pathSegments.length >= 2 ? pathSegments[pathSegments.length - 2] : '';
  const documentId = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : '';

  // Map Firebase collection names to SQL table names
  const collectionMap: Record<string, string> = {
    'settings': 'general',
    'members': 'members',
    'journalEntries': 'journalEntries',
    'investmentInstruments': 'investmentInstruments',
    'chartOfAccounts': 'chartOfAccounts',
    'fundSummaries': 'fundSummaries',
  };

  const sqlCollectionName = collectionMap[collectionName] || collectionName;
  const sqlResult = useSQLDoc(sqlCollectionName, documentId);

  if (!memoizedDocRef) {
    return { data: null, isLoading: false, error: null };
  }

  return {
    data: sqlResult.data as StateDataType,
    isLoading: sqlResult.isLoading,
    error: sqlResult.error,
  };
}
