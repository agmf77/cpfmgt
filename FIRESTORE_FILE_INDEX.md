import { collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';

export function MyComponent() {
  const { firestore } = useFirebase();
  const membersRef = useMemoFirebase(
    () => collection(firestore, "members"),
    [firestore]
  );
  const { data } = useCollection(membersRef);
}# Firestore Operations - Complete File Location Index

## Quick Navigation Index

### Documentation Files Created
- [FIRESTORE_DATABASE_USAGE.md](FIRESTORE_DATABASE_USAGE.md) - Detailed operations breakdown
- [FIRESTORE_QUICK_REFERENCE.md](FIRESTORE_QUICK_REFERENCE.md) - Quick lookup tables
- [FIRESTORE_ARCHITECTURE.md](FIRESTORE_ARCHITECTURE.md) - System architecture diagrams

---

## Firebase Core Files

### Initialization & Configuration
- **[src/firebase/index.ts](src/firebase/index.ts#L1)** - Main Firebase module
  - Line 11-47: `initializeFirebase()` function
  - Line 54-61: `enableClientPersistence()` function
  - Line 63-68: `getSdks()` function
  - Line 70-76: Module exports

- **[src/firebase/config.ts](src/firebase/config.ts)** - Firebase config object
  - Contains: projectId, appId, apiKey, authDomain, messagingSenderId

- **[src/firebase/provider.tsx](src/firebase/provider.tsx)** - React context provider
  - `FirebaseContextState` interface
  - `FirebaseProviderProps` interface
  - Context creation and hooks (useFirebase, useUser, useFirestore, useMemoFirebase)

- **[src/firebase/client-provider.tsx](src/firebase/client-provider.tsx)** - Client-side provider wrapper

---

## Firestore Hooks (READ Operations)

### Collection Subscriptions
- **[src/firebase/firestore/use-collection.tsx](src/firebase/firestore/use-collection.tsx)**
  - Line 16-27: `WithId<T>` type utility
  - Line 30-35: `UseCollectionResult<T>` interface
  - Line 38-42: `InternalQuery` interface
  - Line 50-135: `useCollection()` hook implementation
  - Line 104-121: Local database fallback logic
  - Line 133-150: Real-time Firestore subscription

### Document Subscriptions
- **[src/firebase/firestore/use-doc.tsx](src/firebase/firestore/use-doc.tsx)**
  - Line 20: `WithId<T>` type utility
  - Line 27-32: `UseDocResult<T>` interface
  - Line 40-125: `useDoc()` hook implementation
  - Line 72-95: Local document read with polling
  - Line 97-125: Firestore real-time subscription

---

## Write Operations (Non-Blocking)

### [src/firebase/non-blocking-updates.tsx](src/firebase/non-blocking-updates.tsx)

- Line 20-42: `setDocumentNonBlocking()` function
  - Local fallback: setLocalDocument()
  - Firestore: setDoc()
  - Error emission: permission-error event

- Line 48-82: `addDocumentNonBlocking()` function
  - Local fallback: addLocalDocument()
  - Firestore: addDoc()
  - Returns: Promise<{ id }>

- Line 88-120: `updateDocumentNonBlocking()` function
  - Local fallback: setLocalDocument() with merge
  - Firestore: updateDoc()
  - Error emission: permission-error event

- Line 126-145: `deleteDocumentNonBlocking()` function
  - Local fallback: deleteLocalDocument()
  - Firestore: deleteDoc()
  - Error emission: permission-error event

---

## Local Database Implementation

### [src/firebase/local-db.ts](src/firebase/local-db.ts)

- Line 1-14: Type definitions
  - `LocalCollectionName` type
  - `LocalDocument` interface

- Line 16-47: Default settings constants
  - DEFAULT_GENERAL_SETTINGS
  - DEFAULT_LEDGER_SETTINGS
  - DEFAULT_INTEREST_SETTINGS

- Line 49-61: `LocalDatabase` class (Dexie)
  - Table definitions with indexes
  - Database version and schema

- Line 63: `localDb` singleton instance

- Line 65-73: `createLocalDocumentId()` - UUID generation

- Line 75-102: `getCollectionNameFromPath()` - Path parsing

- Line 104-110: `getDocumentIdFromPath()` - ID extraction

- Line 112-118: `getParentIdFromPath()` - Parent ID extraction

- Line 161-218: `applyLocalFilters()` - WHERE clause implementation
  - Operators: ==, !=, <, <=, >, >=, array-contains

- Line 220-235: `sortCollection()` - ORDER BY implementation

- Line 237-250: `applyLocalOrderingAndLimits()` - ORDER BY & LIMIT

- Line 252-278: `makeLocalSnapshot()` - Snapshot conversion

- Line 280-283: `shouldUseLocalDatabase()` - Always returns true

- Line 285-314: `ensureLocalDatabaseSeed()` - Initial data seeding

- Line 302-324: `readLocalCollection()` - Query with filters

- Line 326-337: `readLocalDocument()` - Single doc read

- Line 339-356: `addLocalDocument()` - Create new doc

- Line 358-373: `getLocalDocuments()` - Convert to snapshot

- Line 375-385: `getLocalDocument()` - Single doc snapshot

- Line 387-391: `getDocsWithFallback()` - Query with fallback

- Line 393-400: `addDocWithFallback()` - Add with fallback

- Line 402+: `setLocalDocument()`, `deleteLocalDocument()` - Write operations

---

## Authentication & Offline Support

### [src/firebase/offline-auth.ts](src/firebase/offline-auth.ts)
- Offline user creation and retrieval
- Used in ensureLocalDatabaseSeed()

### [src/firebase/non-blocking-login.tsx](src/firebase/non-blocking-login.tsx)
- Email/password sign-up handler
- Email/password sign-in handler

---

## Error Handling

### [src/firebase/errors.ts](src/firebase/errors.ts)
- `FirestorePermissionError` class definition
- Error context with path, operation, data

### [src/firebase/error-emitter.ts](src/firebase/error-emitter.ts)
- `errorEmitter` singleton (EventEmitter)
- Emits 'permission-error' events

### [src/components/FirebaseErrorListener.tsx](src/components/FirebaseErrorListener.tsx)
- Listens to Firebase error events
- Displays SweetAlert notifications

---

## Component Usage by Page

### Dashboard
**[src/app/page.tsx](src/app/page.tsx)**
- Line 8: `useCollection`, `useFirestore`, `useMemoFirebase` imports
- Line 12-13: `collection` import from firebase/firestore
- Line 18: `const firestore = useFirestore()`
- Line 20: `const membersRef = useMemoFirebase(() => collection(firestore, "members"), [firestore])`
- Line 21: `const { data: members, isLoading: isMembersLoading } = useCollection(membersRef)`
- Line 23: `const entriesRef = useMemoFirebase(...)`
- Line 24: `const { data: entries, isLoading: isEntriesLoading } = useCollection(entriesRef)`
- Line 26: `const investmentsRef = useMemoFirebase(...)`
- Line 27: `const { data: investments, isLoading: isInvestmentsLoading } = useCollection(investmentsRef)`

### Chart of Accounts
**[src/app/coa/page.tsx](src/app/coa/page.tsx)**
- Line 10: Import `useCollection`, `useFirestore`, `useMemoFirebase`, write functions
- Line 11: Import `collection`, `doc` from firebase/firestore
- Line 19: `const firestore = useFirestore()`
- Line 21: `const coaRef = useMemoFirebase(() => collection(firestore, "chartOfAccounts"), [firestore])`
- Line 22: `const { data: coaData, isLoading } = useCollection(coaRef)`
- Line 58: `updateDocumentNonBlocking(docRef, accountData)` - Update COA
- Line 66: `addDocumentNonBlocking(coaRef, accountData)` - Add COA
- Line 87: `deleteDocumentNonBlocking(docRef)` - Delete COA

### Members
**[src/app/members/page.tsx](src/app/members/page.tsx)**
- Line 9: Imports for useCollection, useFirestore, useMemoFirebase, write functions
- Line 10: Imports for collection, doc, query, orderBy, limit, startAfter, where, QueryConstraint
- Line 19: `const firestore = useFirestore()`
- Line 52-76: Dynamic query construction with WHERE, ORDER BY, LIMIT
  - Line 58: WHERE memberIdNumber
  - Line 61-62: Range query (name >= x and name < y)
  - Line 65: orderBy memberIdNumber
  - Line 70: limit with pagination
- Line 79: `const { data: rawMembers, isLoading, snapshot } = useCollection(membersQuery)`
- Line 122: `updateDocumentNonBlocking(docRef, memberData)` - Update member
- Line 130: `addDocumentNonBlocking(collection(..., "members"), {...})` - Add member
- Line 131: `deleteDocumentNonBlocking(docRef)` - Delete member

### Member Detail
**[src/app/members/[id]/page.tsx](src/app/members/[id]/page.tsx)**
- Line 24: Imports for useDoc, useCollection, useFirestore, write functions
- Line 25: Imports for doc, collection from firebase/firestore
- Uses: doc for member, useCollection for fundSummaries
- Uses: addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking

### Transactions List
**[src/app/transactions/page.tsx](src/app/transactions/page.tsx)**
- Line 16: Imports for useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking
- Line 20: `const firestore = useFirestore()`
- Line 28: `const entriesRef = useMemoFirebase(() => collection(firestore, "journalEntries"), [firestore])`
- Line 29: `const { data: entries, isLoading } = useCollection(entriesRef)`
- Line 50: `deleteDocumentNonBlocking(docRef)` - Delete entry

### Create/Edit Transaction
**[src/app/transactions/new/page.tsx](src/app/transactions/new/page.tsx)**
- Line 16: Imports with getDocsWithFallback, shouldUseLocalDatabase, readLocalCollection
- Line 17: Imports for collection, doc, query, where
- Line 34: `const firestore = useFirestore()`
- Line 57: `const coaRef = useMemoFirebase(() => collection(firestore, "chartOfAccounts"), [firestore])`
- Line 61: `const membersRef = useMemoFirebase(() => collection(firestore, "members"), [firestore])`
- Line 64: `const transactionRef = useMemoFirebase(...journalEntries...)`
- Line 67: `const settingsRef = useMemoFirebase(...settings/ledger...)`
- Line 185-187: Local database fallback: `if (shouldUseLocalDatabase())` then `readLocalCollection()`
- Line 194: `query(memberSummariesRef, where("journalEntryId", "==", editId), where("accountCodeAtSource", "==", code))`
- Line 195: `const snapshot = await getDocsWithFallback(q)`
- Line 202: `updateDocumentNonBlocking(doc(firestore, "members", ..., "fundSummaries", ...), {...})`
- Line 210: `addDocumentNonBlocking(memberSummariesRef, {...})`
- Line 248: `updateDocumentNonBlocking(docRef, entryData)` - Update journal entry
- Line 253: `const newDoc = await addDocumentNonBlocking(journalEntriesRef, entryData)` - Create entry
- Line 281: `deleteDocumentNonBlocking(d.ref)` - Delete subsidiary entries

### Settings
**[src/app/settings/page.tsx](src/app/settings/page.tsx)**
- Line 17-24: Imports for useFirestore, useDoc, useCollection, write functions
- Line 53: `const firestore = useFirestore()`
- Line 64: `const generalSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "general"), [firestore])`
- Line 65: `const savedGeneralSettings = useDoc(generalSettingsRef)`
- Line 69: `const ledgerSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "ledger"), [firestore])`
- Line 70: `const savedLedgerSettings = useDoc(ledgerSettingsRef)`
- Line 72: `const interestSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "interest"), [firestore])`
- Line 73: `const savedInterestSettings = useDoc(interestSettingsRef)`
- Line 94: `const coaRef = useMemoFirebase(() => collection(firestore, "chartOfAccounts"), [firestore])`
- Line 95: `const coaData = useCollection(coaRef)`
- Line 236: `updateDocumentNonBlocking(docRef, accountData)` - Update COA or settings
- Line 239: `addDocumentNonBlocking(coaRef, accountData)` - Add COA or settings
- Line 255: `deleteDocumentNonBlocking(docRef)` - Delete COA or settings

### Investments
**[src/app/investments/page.tsx](src/app/investments/page.tsx)**
- Line 32: Imports for useCollection, useFirestore, useMemoFirebase, write functions
- Line 33: Imports for collection, doc, query, orderBy
- Line 46: `const firestore = useFirestore()`
- Line 75: `const investmentsRef = useMemoFirebase(() => collection(firestore, "investmentInstruments"), [firestore])`
- Line 76: `const { data: investments, isLoading } = useCollection(investmentsRef)`
- Line 104: `const historyQuery = useMemoFirebase(...auditHistory...orderBy...)`
- Line 105: `const { data: auditHistory, isLoading: isHistoryLoading } = useCollection(historyQuery)`
- Line 107: `const { data: coaData } = useCollection(coaRef)`
- Uses: addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking

### Interest Distribution
**[src/app/interest/page.tsx](src/app/interest/page.tsx)**
- Line 32-37: Imports including getDocsWithFallback and collection/query functions
- Line 66: `const generalSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "general"), [firestore])`
- Line 71: `const interestSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "interest"), [firestore])`
- Line 128: `const membersRef = useMemoFirebase(() => collection(firestore, "members"), [firestore])`
- Line 179: Dynamic collection: `const summariesRef = collection(firestore, "members", member.id, "fundSummaries")`
- Line 180: `const q = query(summariesRef, orderBy("summaryDate", "asc"))`
- Line 181: `const snapshot = await getDocsWithFallback(q)` - Query with fallback
- Line 330: `addDocumentNonBlocking(summariesRef, entryData)` - Add interest summary

### Special Interest
**[src/app/investments/special-interest/page.tsx](src/app/investments/special-interest/page.tsx)**
- Similar to interest/page.tsx
- Line 35: `getDocsWithFallback` import
- Line 131: `const snapshot = await getDocsWithFallback(query(summariesRef, orderBy("summaryDate", "asc")))`
- Line 164: `await addDocumentNonBlocking(collection(..., "fundSummaries"), entry)`

### Reports - All Ledgers
**[src/app/reports/all-ledgers/page.tsx](src/app/reports/all-ledgers/page.tsx)**
- Line 9-10: Imports for useCollection, useFirestore, useMemoFirebase, useDoc and collection/collectionGroup
- Line 16: `const firestore = useFirestore()`
- Line 19: `const generalSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "general"), [firestore])`
- Line 20: `const { data: generalSettings } = useDoc(generalSettingsRef)`
- Line 23: `const membersRef = useMemoFirebase(() => collection(firestore, "members"), [firestore])`
- Line 24: `const { data: members, isLoading: isMembersLoading } = useCollection(membersRef)`
- Line 26: `const summariesRef = useMemoFirebase(() => collectionGroup(firestore, "fundSummaries"), [firestore])`
- Line 27: `const { data: allSummaries, isLoading: isSummariesLoading } = useCollection(summariesRef)`

### Reports - Ledger Summary
**[src/app/reports/ledger-summary/page.tsx](src/app/reports/ledger-summary/page.tsx)**
- Line 22-23: Imports for collection and collectionGroup
- Line 33: `const firestore = useFirestore()`
- Line 36: `const generalSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "general"), [firestore])`
- Line 50: `const membersRef = useMemoFirebase(() => collection(firestore, "members"), [firestore])`
- Line 52: `const summariesRef = useMemoFirebase(() => collectionGroup(firestore, "fundSummaries"), [firestore])`

### Reports - Subsidiary Control
**[src/app/reports/subsidiary-control/page.tsx](src/app/reports/subsidiary-control/page.tsx)**
- Line 30: Imports for collection, collectionGroup, doc
- Line 58: `const firestore = useFirestore()`
- Line 61: `const generalSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "general"), [firestore])`
- Line 78: `const membersRef = useMemoFirebase(() => collection(firestore, "members"), [firestore])`
- Line 89: `const summariesRef = useMemoFirebase(() => collectionGroup(firestore, "fundSummaries"), [firestore])`

### Reports - Movements
**[src/app/reports/movements/page.tsx](src/app/reports/movements/page.tsx)**
- Line 24: Imports for collection, collectionGroup, doc
- Line 35: `const firestore = useFirestore()`
- Line 38: `const generalSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "general"), [firestore])`
- Line 54: `const membersRef = useMemoFirebase(() => collection(firestore, "members"), [firestore])`
- Line 57: `const summariesRef = useMemoFirebase(() => collectionGroup(firestore, "fundSummaries"), [firestore])`

### Reports - Net Fund
**[src/app/reports/netfund/page.tsx](src/app/reports/netfund/page.tsx)**
- Line 22-23: Imports for collection, collectionGroup, doc
- Line 33: `const firestore = useFirestore()`
- Line 36: `const generalSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "general"), [firestore])`
- Line 48: Similar pattern to other reports

### Reports - Control Ledger
**[src/app/reports/control-ledger/page.tsx](src/app/reports/control-ledger/page.tsx)**
- Line 23-24: Imports for collection, doc
- Line 34: `const firestore = useFirestore()`
- Line 38: `const generalSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "general"), [firestore])`
- Line 54: `const coaRef = useMemoFirebase(() => collection(firestore, "chartOfAccounts"), [firestore])`
- Line 58: `const entriesRef = useMemoFirebase(() => collection(firestore, "journalEntries"), [firestore])`

### Reports - Contributions
**[src/app/reports/contributions/page.tsx](src/app/reports/contributions/page.tsx)**
- Line 28: Imports for collectionGroup, query, where, doc
- Line 48: `const firestore = useFirestore()`
- Line 52: `const generalSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "general"), [firestore])`
- Line 70: `const summariesRef = useMemoFirebase(() => collectionGroup(firestore, "fundSummaries"), [firestore])`
- Uses: deleteDocumentNonBlocking for cleanup

### Reports - Loans
**[src/app/reports/loans/page.tsx](src/app/reports/loans/page.tsx)**
- Line 24-25: Imports for collection, collectionGroup, doc
- Line 35: `const firestore = useFirestore()`
- Line 55: `const membersRef = useMemoFirebase(() => collection(firestore, "members"), [firestore])`
- Line 57: `const summariesRef = useMemoFirebase(() => collectionGroup(firestore, "fundSummaries"), [firestore])`

### Reports - Settlements
**[src/app/reports/settlements/page.tsx](src/app/reports/settlements/page.tsx)**
- Line 23-24: Imports for collection, doc
- Line 34: `const firestore = useFirestore()`
- Line 39: `const generalSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "general"), [firestore])`
- Line 43: `const membersRef = useMemoFirebase(() => collection(firestore, "members"), [firestore])`

### Reports Main
**[src/app/reports/page.tsx](src/app/reports/page.tsx)**
- Line 7-8: Imports for useCollection, useFirestore, useMemoFirebase, useDoc
- Line 8: Import for collection, doc
- Line 17: `const firestore = useFirestore()`
- Line 20: `const generalSettingsRef = useMemoFirebase(() => doc(firestore, "settings", "general"), [firestore])`
- Line 24: `const coaRef = useMemoFirebase(() => collection(firestore, "chartOfAccounts"), [firestore])`
- Line 28: `const entriesRef = useMemoFirebase(() => collection(firestore, "journalEntries"), [firestore])`

---

## Supporting Files

### Libraries
- **[src/lib/coa-data.ts](src/lib/coa-data.ts)** - Chart of accounts seed data for local database

### UI Components
- **[src/components/FirebaseErrorListener.tsx](src/components/FirebaseErrorListener.tsx)** - Error notification component

---

## Summary Statistics by Category

### Firebase Core Modules
- **Files**: 7 (index, config, provider, client-provider, hooks x2, auth, login)
- **Lines of Code**: ~1,200

### Page Components Using Firestore
- **Dashboard**: 3 collections, 0 writes
- **Members**: 1 collection + sub-collection, full CRUD
- **CoA**: 1 collection, full CRUD
- **Settings**: 3 documents + 1 collection, CRUD
- **Transactions**: 2 collections + sub-collections, full CRUD
- **Investments**: 1 collection + auditHistory, CRUD
- **Interest pages**: Multiple collections, CREATE operations
- **Reports**: 12+ pages, mostly READ operations

### Total Operations
- **READ hooks**: 2 (useCollection, useDoc)
- **READ queries**: getDocsWithFallback, readLocalCollection, readLocalDocument
- **WRITE functions**: 4 (add, update, delete, set)
- **Query operators**: 7+ (==, !=, <, <=, >, >=, array-contains, WHERE, ORDER BY, LIMIT)
- **Collection groups**: 1 (fundSummaries accessed across all members)

### Error Handling
- **Error type**: 1 (FirestorePermissionError)
- **Event emitter**: 1 (errorEmitter singleton)
- **Error listener**: 1 UI component

---

## File Dependency Graph

```
index.ts
├── config.ts (Firebase config)
├── provider.tsx (React context)
│   └── getAuth, getFirestore
├── firestore/use-collection.tsx (Query hook)
│   └── local-db.ts (fallback)
├── firestore/use-doc.tsx (Doc hook)
│   └── local-db.ts (fallback)
├── non-blocking-updates.tsx (Writes)
│   ├── local-db.ts (addLocal, setLocal, etc.)
│   └── error-emitter.ts (error events)
├── local-db.ts (Dexie database)
│   └── offline-auth.ts (offline user)
├── error-emitter.ts
├── errors.ts
├── offline-auth.ts
└── non-blocking-login.tsx

Components (all pages)
├── useCollection ← use-collection.tsx ← local-db.ts
├── useDoc ← use-doc.tsx ← local-db.ts
├── useFirestore ← provider.tsx
├── useMemoFirebase ← provider.tsx
├── addDocumentNonBlocking ← non-blocking-updates.tsx ← local-db.ts
├── updateDocumentNonBlocking ← non-blocking-updates.tsx ← local-db.ts
├── deleteDocumentNonBlocking ← non-blocking-updates.tsx ← local-db.ts
└── getDocsWithFallback ← local-db.ts
```

---

## Quick Navigation by Task

### I want to understand how reads work
→ See [src/firebase/firestore/use-collection.tsx](src/firebase/firestore/use-collection.tsx) (lines 50-135)

### I want to understand how writes work
→ See [src/firebase/non-blocking-updates.tsx](src/firebase/non-blocking-updates.tsx) (all functions)

### I want to see offline/local database logic
→ See [src/firebase/local-db.ts](src/firebase/local-db.ts) (entire file)

### I want to understand architecture
→ See [FIRESTORE_ARCHITECTURE.md](FIRESTORE_ARCHITECTURE.md)

### I want a quick reference
→ See [FIRESTORE_QUICK_REFERENCE.md](FIRESTORE_QUICK_REFERENCE.md)

### I want comprehensive details
→ See [FIRESTORE_DATABASE_USAGE.md](FIRESTORE_DATABASE_USAGE.md)

### I want to add a new Firestore operation
→ Pattern: `const ref = useMemoFirebase(() => collection/doc(...), [deps])`
→ Then: `useCollection(ref)` or `useDoc(ref)` for reads
→ Then: `addDocumentNonBlocking/updateDocumentNonBlocking/deleteDocumentNonBlocking` for writes

### I want to trace an error
→ Look for error event in [src/firebase/error-emitter.ts](src/firebase/error-emitter.ts)
→ Then in [src/components/FirebaseErrorListener.tsx](src/components/FirebaseErrorListener.tsx)

### I want to understand query patterns
→ See Members page: [src/app/members/page.tsx](src/app/members/page.tsx#L52-76)
→ Or Transactions: [src/app/transactions/new/page.tsx](src/app/transactions/new/page.tsx#L194-195)
