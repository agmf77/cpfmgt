'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  addLocalDocument,
  deleteLocalDocument,
  setLocalDocument,
  shouldUseLocalDatabase,
} from './local-db';
import { addDocument, updateDocument, deleteDocument } from '@/lib/sql-database';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: { merge?: boolean }) {
  // Extract collection and document ID from Firebase reference
  const pathSegments = docRef.path.split('/');
  const collectionName = pathSegments[pathSegments.length - 2];
  const documentId = pathSegments[pathSegments.length - 1];

  // Map Firebase collection names to SQL table names
  const collectionMap: Record<string, string> = {
    'settings': 'general', // Map settings/general to general table
    'members': 'members',
    'journalEntries': 'journalEntries',
    'investmentInstruments': 'investmentInstruments',
    'chartOfAccounts': 'chartOfAccounts',
    'fundSummaries': 'fundSummaries',
  };

  const sqlCollectionName = collectionMap[collectionName] || collectionName;

  // Use SQL database
  if (options?.merge) {
    updateDocument(sqlCollectionName, documentId, data)
      .catch((error) => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'write',
            requestResourceData: data,
          })
        );
      });
  } else {
    // For non-merge operations, we need to handle create vs update
    // For simplicity, try update first, then create if not exists
    updateDocument(sqlCollectionName, documentId, data)
      .catch(() => {
        // If update fails, try to create (this is a simplified approach)
        addDocument(sqlCollectionName, { ...data, id: documentId })
          .catch((error) => {
            errorEmitter.emit(
              'permission-error',
              new FirestorePermissionError({
                path: docRef.path,
                operation: 'write',
                requestResourceData: data,
              })
            );
          });
      });
  }
  return;
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  // Extract collection name from Firebase reference
  const collectionName = colRef.path;

  // Map Firebase collection names to SQL table names
  const collectionMap: Record<string, string> = {
    'members': 'members',
    'journalEntries': 'journalEntries',
    'investmentInstruments': 'investmentInstruments',
    'chartOfAccounts': 'chartOfAccounts',
    'fundSummaries': 'fundSummaries',
  };

  const sqlCollectionName = collectionMap[collectionName] || collectionName;

  // Use SQL database
  return addDocument(sqlCollectionName, data)
    .then((result) => ({ id: result.id }))
    .catch((error) => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      );
      throw error;
    });
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  // Extract collection and document ID from Firebase reference
  const pathSegments = docRef.path.split('/');
  const collectionName = pathSegments[pathSegments.length - 2];
  const documentId = pathSegments[pathSegments.length - 1];

  // Map Firebase collection names to SQL table names
  const collectionMap: Record<string, string> = {
    'settings': 'general', // Map settings/general to general table
    'members': 'members',
    'journalEntries': 'journalEntries',
    'investmentInstruments': 'investmentInstruments',
    'chartOfAccounts': 'chartOfAccounts',
    'fundSummaries': 'fundSummaries',
  };

  const sqlCollectionName = collectionMap[collectionName] || collectionName;

  // Use SQL database
  updateDocument(sqlCollectionName, documentId, data)
    .catch((error) => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      );
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  // Extract collection and document ID from Firebase reference
  const pathSegments = docRef.path.split('/');
  const collectionName = pathSegments[pathSegments.length - 2];
  const documentId = pathSegments[pathSegments.length - 1];

  // Map Firebase collection names to SQL table names
  const collectionMap: Record<string, string> = {
    'settings': 'general', // Map settings/general to general table
    'members': 'members',
    'journalEntries': 'journalEntries',
    'investmentInstruments': 'investmentInstruments',
    'chartOfAccounts': 'chartOfAccounts',
    'fundSummaries': 'fundSummaries',
  };

  const sqlCollectionName = collectionMap[collectionName] || collectionName;

  // Use SQL database
  deleteDocument(sqlCollectionName, documentId)
    .catch((error) => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      );
    });
}