
'use client';

import { useEffect, useState } from 'react';
import {
  Query,
  DocumentData,
  QuerySnapshot,
  CollectionReference,
  FirestoreError,
} from 'firebase/firestore';
import { makeLocalQuerySnapshot } from '@/firebase/local-db';
import { useCollection as useSQLCollection } from '@/lib/sql-database';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
  snapshot: QuerySnapshot<DocumentData> | null; // Added snapshot for pagination support
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

export type LocalCollectionReference = {
  type: 'collection';
  path: string;
  __memo?: boolean;
};

export type FirestoreOrLocalCollectionReference =
  | ((CollectionReference<DocumentData> | Query<DocumentData> | LocalCollectionReference) & { __memo?: boolean })
  | null
  | undefined;

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error, snapshot.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: FirestoreOrLocalCollectionReference,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  // Always using local database - no offline mode tracking needed
  const [data, setData] = useState<StateDataType>(null);
  const [snapshot, setSnapshot] = useState<QuerySnapshot<DocumentData> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  let collectionName = '';
  let queryOptions: any = {};

  if (memoizedTargetRefOrQuery?.type === 'collection') {
    collectionName = (memoizedTargetRefOrQuery as CollectionReference).path;
  } else if (memoizedTargetRefOrQuery) {
    const path = (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();
    const segments = path.split('/').filter(Boolean);
    collectionName = segments[segments.length - 1];
    // TODO: Parse query constraints from the query object.
  }

  const collectionMap: Record<string, string> = {
    'members': 'members',
    'journalEntries': 'journalEntries',
    'investmentInstruments': 'investmentInstruments',
    'chartOfAccounts': 'chartOfAccounts',
    'fundSummaries': 'fundSummaries',
  };

  const sqlCollectionName = memoizedTargetRefOrQuery ? collectionMap[collectionName] || collectionName : '';
  const sqlResult = useSQLCollection(sqlCollectionName, queryOptions);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setSnapshot(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setData(sqlResult.data as ResultItemType[]);
    setIsLoading(sqlResult.isLoading);
    setError(sqlResult.error);

    if (sqlResult.data) {
      setSnapshot(makeLocalQuerySnapshot(sqlResult.data, collectionName));
    }
  }, [memoizedTargetRefOrQuery, sqlResult.data, sqlResult.isLoading, sqlResult.error, collectionName]);

  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }

  return { data, isLoading, error, snapshot };
}

