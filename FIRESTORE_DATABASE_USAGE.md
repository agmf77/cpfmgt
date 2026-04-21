# Comprehensive Firestore Database Usage Documentation

## Project Structure
- **Primary Database**: Firebase Firestore (Cloud)
- **Fallback Database**: IndexedDB (Dexie) for offline mode
- **Auto-switching**: Via `shouldUseLocalDatabase()` function
- **Firebase Config**: [src/firebase/config.ts](src/firebase/config.ts)
- **Project ID**: studio-4068989818-2107e

---

## 1. Firebase Initialization & Core Configuration

### [src/firebase/config.ts](src/firebase/config.ts)
- **Purpose**: Firebase configuration
- **Project**: studio-4068989818-2107e
- **Contains**: API keys, auth domain, messaging sender ID

### [src/firebase/index.ts](src/firebase/index.ts)
- **initializeFirebase()**: Initializes Firestore with environment variables or config fallback
- **enableClientPersistence()**: Enables IndexedDB offline persistence
- **enableIndexedDbPersistence()**: Firestore offline persistence
- **ensureLocalDatabaseSeed()**: Initializes local database with default data
- **Exports all Firebase hooks and utilities**

---

## 2. Firebase Collections & Data Structure

### Collections Used:
1. **settings** (document references)
   - `settings/general` - PBS name, general configuration
   - `settings/ledger` - Ledger mapping, debit accounts configuration
   - `settings/interest` - Interest tier rates and TDS rate

2. **members**
   - Member records with ID number, name, etc.
   - Sub-collection: `members/{memberId}/fundSummaries` - Per-member fund movement tracking

3. **journalEntries**
   - Journal entry records with lines array
   - Each entry contains multiple account lines

4. **chartOfAccounts**
   - Chart of accounts with code, name, type, normal balance
   - Seeded from local data on initialization

5. **investmentInstruments**
   - Investment records (principal amount, issue date, etc.)
   - Sub-collection: `investmentInstruments/{instrumentId}/auditHistory` - Change audit trail

6. **fundSummaries** (collection group)
   - Accessed via `collectionGroup()` queries
   - Members' fund summaries across all members

---

## 3. Firebase/Firestore Usage by Component Type

### 3.1 Firebase Provider & Context
**[src/firebase/provider.tsx](src/firebase/provider.tsx)**
- `FirebaseContextState`: Provides firebaseApp, firestore, auth instances
- `useFirebase()`: Hook to access Firebase services and user
- `useUser()`: Hook to access auth state
- `useFirestore()`: Hook to get Firestore instance
- `useMemoFirebase()`: Memoizes Firestore references to prevent unnecessary re-renders

**[src/firebase/client-provider.tsx](src/firebase/client-provider.tsx)**
- Client-side Firebase initialization wrapper

---

## 4. Firestore Query & Hooks Implementation

### [src/firebase/firestore/use-collection.tsx](src/firebase/firestore/use-collection.tsx)
- **Hook**: `useCollection<T>(memoizedTargetRefOrQuery)`
- **Purpose**: Real-time subscription to Firestore collections or queries
- **Returns**: `{ data, isLoading, error, snapshot }`
- **Database Switching**: Uses `shouldUseLocalDatabase()` to fallback to local DB
- **Local Implementation**: Applies filters, ordering, and limits to local data

**Key Features:**
- Handles nullable references/queries
- Memoization required for input references
- Real-time updates via `onSnapshot` or local polling interval
- Automatic connectivity detection (online/offline events)

### [src/firebase/firestore/use-doc.tsx](src/firebase/firestore/use-doc.tsx)
- **Hook**: `useDoc<T>(memoizedDocRef)`
- **Purpose**: Real-time subscription to single Firestore document
- **Returns**: `{ data, isLoading, error }`
- **Database Switching**: Falls back to local DB for offline access
- **Local Implementation**: Reads from IndexedDB with polling for updates

---

## 5. Write Operations (Non-Blocking)

### [src/firebase/non-blocking-updates.tsx](src/firebase/non-blocking-updates.tsx)

#### `addDocumentNonBlocking(colRef, data)`
- **Purpose**: Add new document to collection (non-blocking)
- **Fallback**: `addLocalDocument()` when offline
- **Error Handling**: Emits 'permission-error' events
- **Usage Pages**: Members, Transactions, Investments, Settings, Interest, CoA

#### `updateDocumentNonBlocking(docRef, data)`
- **Purpose**: Update existing document (non-blocking, merged)
- **Fallback**: `setLocalDocument()` with merge option
- **Error Handling**: Emits 'permission-error' events
- **Usage Pages**: Members, Transactions, Investments, Settings, CoA

#### `deleteDocumentNonBlocking(docRef)`
- **Purpose**: Delete document (non-blocking)
- **Fallback**: `deleteLocalDocument()` when offline
- **Error Handling**: Emits 'permission-error' events
- **Usage Pages**: Transactions, Members, CoA, Settings, Reports

#### `setDocumentNonBlocking(docRef, data, options)`
- **Purpose**: Set document with options (non-blocking)
- **Fallback**: `setLocalDocument()` when offline
- **Options**: merge flag for partial updates

---

## 6. Firestore Query APIs

### [src/firebase/local-db.ts](src/firebase/local-db.ts)

#### `getDocsWithFallback(query)`
- **Purpose**: Execute Firestore query with local fallback
- **Used In**: Transactions, Interest calculations, Investment interest
- **Query Support**: where, orderBy, limit clauses

#### `readLocalCollection(path, query?)`
- **Purpose**: Read collection from local IndexedDB
- **Applies**: Filters, ordering, and limits

#### `readLocalDocument(path)`
- **Purpose**: Read single document from local IndexedDB

#### `shouldUseLocalDatabase()`
- **Returns**: Always true (full offline mode)
- **Location**: Checked in all hooks and write operations

---

## 7. Page-by-Page Firestore Usage

### Main Dashboard
**[src/app/page.tsx](src/app/page.tsx)**
- `collection(firestore, "members")` - useCollection
- `collection(firestore, "journalEntries")` - useCollection
- `collection(firestore, "investmentInstruments")` - useCollection
- **Operations**: READ members, entries, investments for statistics

### Chart of Accounts
**[src/app/coa/page.tsx](src/app/coa/page.tsx)**
- `collection(firestore, "chartOfAccounts")` - useCollection
- `doc(firestore, "chartOfAccounts", accountId)` - addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking
- **Operations**: CRUD operations on chart of accounts

### Members Management
**[src/app/members/page.tsx](src/app/members/page.tsx)**
- `collection(firestore, "members")` - useCollection with dynamic queries
- **Queries**: 
  - WHERE memberIdNumber == search value
  - WHERE name >= search (range query)
  - orderBy("memberIdNumber", "asc")
  - limit() pagination support
- `doc(firestore, "members", memberId)` - updateDocumentNonBlocking, deleteDocumentNonBlocking
- `addDocumentNonBlocking(collection(firestore, "members"), memberData)`
- **Operations**: Search, paginate, CRUD members

### Member Detail Page
**[src/app/members/[id]/page.tsx](src/app/members/[id]/page.tsx)**
- `doc(firestore, "members", memberId)` - useDoc
- `collection(firestore, "members", memberId, "fundSummaries")` - useCollection
- `addDocumentNonBlocking(summariesRef, entryData)` - Add fund summary
- `updateDocumentNonBlocking(doc(firestore, "members", memberId, "fundSummaries", id), data)` - Update summary
- `deleteDocumentNonBlocking(doc(firestore, "members", memberId, "fundSummaries", id))` - Delete summary
- **Operations**: View member, manage fund summaries (READ, CREATE, UPDATE, DELETE)

### Journal Transactions
**[src/app/transactions/page.tsx](src/app/transactions/page.tsx)**
- `collection(firestore, "journalEntries")` - useCollection
- `doc(firestore, "journalEntries", entryId)` - deleteDocumentNonBlocking
- **Operations**: List, delete journal entries

### Create/Edit Transaction
**[src/app/transactions/new/page.tsx](src/app/transactions/new/page.tsx)**
- `collection(firestore, "chartOfAccounts")` - useCollection (READ)
- `collection(firestore, "members")` - useCollection (READ)
- `doc(firestore, "settings", "ledger")` - useDoc (READ)
- `collection(firestore, "journalEntries")` - addDocumentNonBlocking (CREATE)
- `doc(firestore, "journalEntries", editId)` - useDoc, updateDocumentNonBlocking (READ, UPDATE)
- `doc(firestore, "journalEntries", editId)` - deleteDocumentNonBlocking (for reversal)
- **Queries**:
  - `query(memberSummariesRef, where("journalEntryId", "==", id), where("accountCode", "==", code))`
  - Uses `getDocsWithFallback()` with local fallback
- **Operations**: 
  - Create journal entry with automatic subsidiary ledger creation
  - Edit existing entry
  - Delete entry with subsidiary cleanup
  - Local query with `readLocalCollection` fallback

### Settings Page
**[src/app/settings/page.tsx](src/app/settings/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc (READ)
- `doc(firestore, "settings", "ledger")` - useDoc (READ/UPDATE)
- `doc(firestore, "settings", "interest")` - useDoc (READ/UPDATE)
- `collection(firestore, "chartOfAccounts")` - useCollection (READ)
- `updateDocumentNonBlocking(docRef, data)` - Update settings
- `addDocumentNonBlocking(coaRef, data)` - Add COA account
- `updateDocumentNonBlocking(doc(..., accountId), data)` - Update COA account
- `deleteDocumentNonBlocking(doc(..., accountId))` - Delete COA account
- **Operations**: Manage general settings, interest tiers, ledger mapping, COA

### Investments Page
**[src/app/investments/page.tsx](src/app/investments/page.tsx)**
- `collection(firestore, "investmentInstruments")` - useCollection (READ)
- `collection(firestore, "investmentInstruments", investmentId, "auditHistory")` - useCollection (READ history)
- `query(..., orderBy(...))` - Query audit history
- `addDocumentNonBlocking(investmentsRef, data)` - Create investment
- `updateDocumentNonBlocking(doc(..., investmentId), data)` - Update investment
- `deleteDocumentNonBlocking(doc(..., investmentId))` - Delete investment
- **Operations**: CRUD investments, view audit history

### Special Interest Page
**[src/app/investments/special-interest/page.tsx](src/app/investments/special-interest/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc
- `doc(firestore, "settings", "interest")` - useDoc
- `collection(firestore, "members")` - useCollection
- `collection(firestore, "members", memberId, "fundSummaries")` - Dynamic collection reference
- `getDocsWithFallback(query(..., orderBy("summaryDate", "asc")))` - Query fund summaries
- `addDocumentNonBlocking(collection(..., "fundSummaries"), entry)` - Create special interest fund summary
- **Operations**: Calculate and record special interest allocations

### Member Interest Page
**[src/app/investments/member-interest/page.tsx](src/app/investments/member-interest/page.tsx)**
- Similar to special interest with member-level queries
- Uses `getDocsWithFallback()` for interest summary queries

### Interest Page (Distribution)
**[src/app/interest/page.tsx](src/app/interest/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc (READ)
- `doc(firestore, "settings", "interest")` - useDoc (READ)
- `collection(firestore, "members")` - useCollection (READ)
- `collection(firestore, "members", memberId, "fundSummaries")` - Dynamic
- `query(..., orderBy("summaryDate", "asc"))` - Query fund summaries
- `getDocsWithFallback(q)` - Query with local fallback
- `addDocumentNonBlocking(summariesRef, entryData)` - Create interest fund summary
- **Operations**: Calculate and distribute interest to members

### Special Interest Distribution
**[src/app/interest/special/page.tsx](src/app/interest/special/page.tsx)**
- Similar to interest page
- `query(summariesRef, orderBy("summaryDate", "asc"))`
- `getDocsWithFallback(q)`
- `addDocumentNonBlocking(..., entry)` - Create special interest entry

### Reports - All Ledgers
**[src/app/reports/all-ledgers/page.tsx](src/app/reports/all-ledgers/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc
- `collection(firestore, "members")` - useCollection
- `collectionGroup(firestore, "fundSummaries")` - useCollection (all members' fund summaries)
- **Operations**: READ for reporting

### Reports - Ledger Summary
**[src/app/reports/ledger-summary/page.tsx](src/app/reports/ledger-summary/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc
- `collection(firestore, "members")` - useCollection
- `collectionGroup(firestore, "fundSummaries")` - useCollection
- **Operations**: READ for summary reports

### Reports - Subsidiary Control
**[src/app/reports/subsidiary-control/page.tsx](src/app/reports/subsidiary-control/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc
- `collection(firestore, "members")` - useCollection
- `collectionGroup(firestore, "fundSummaries")` - useCollection
- **Operations**: READ for subsidiary ledger control

### Reports - Movements
**[src/app/reports/movements/page.tsx](src/app/reports/movements/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc
- `collection(firestore, "members")` - useCollection
- `collectionGroup(firestore, "fundSummaries")` - useCollection
- **Operations**: READ movement reports

### Reports - Net Fund
**[src/app/reports/netfund/page.tsx](src/app/reports/netfund/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc
- `collection(firestore, "members")` - useCollection
- `collectionGroup(firestore, "fundSummaries")` - useCollection
- **Operations**: READ for net fund calculations

### Reports - Control Ledger
**[src/app/reports/control-ledger/page.tsx](src/app/reports/control-ledger/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc
- `collection(firestore, "chartOfAccounts")` - useCollection
- `collection(firestore, "journalEntries")` - useCollection
- **Operations**: READ for control ledger calculations

### Reports - Contributions
**[src/app/reports/contributions/page.tsx](src/app/reports/contributions/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc
- `collectionGroup(firestore, "fundSummaries")` - useCollection
- `deleteDocumentNonBlocking(...)` - Delete contribution records
- **Operations**: READ, DELETE for contribution audit

### Reports - Loans
**[src/app/reports/loans/page.tsx](src/app/reports/loans/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc
- `collection(firestore, "members")` - useCollection
- `collectionGroup(firestore, "fundSummaries")` - useCollection (loan summaries)
- **Operations**: READ for loan reports

### Reports - Settlements
**[src/app/reports/settlements/page.tsx](src/app/reports/settlements/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc
- `collection(firestore, "members")` - useCollection
- **Operations**: READ for settlement reports

### Reports - Maturity Summary
**[src/app/reports/maturity-summary/page.tsx](src/app/reports/maturity-summary/page.tsx)**
- Similar structure (not detailed in search results)

### Reports Main Page
**[src/app/reports/page.tsx](src/app/reports/page.tsx)**
- `doc(firestore, "settings", "general")` - useDoc
- `collection(firestore, "chartOfAccounts")` - useCollection
- `collection(firestore, "journalEntries")` - useCollection
- **Operations**: READ for reports landing page

---

## 8. Authentication & User Management

### [src/firebase/offline-auth.ts](src/firebase/offline-auth.ts)
- `getOfflineAuthUser()`: Get offline auth user
- `createOfflineAuthUser(name)`: Create offline user for local mode
- Used in `ensureLocalDatabaseSeed()` to support offline mode

### [src/firebase/non-blocking-login.tsx](src/firebase/non-blocking-login.tsx)
- Email/password sign-up (non-blocking)
- Email/password sign-in (non-blocking)

---

## 9. Error Handling & Monitoring

### [src/firebase/errors.ts](src/firebase/errors.ts)
- `FirestorePermissionError`: Custom error for Firestore permission issues
- Captures path, operation type, and request data

### [src/firebase/error-emitter.ts](src/firebase/error-emitter.ts)
- Event emitter for 'permission-error' events
- Used in write operations to notify UI of errors

### [src/components/FirebaseErrorListener.tsx](src/components/FirebaseErrorListener.tsx)
- Component that listens to Firebase error events
- Displays error notifications to users

---

## 10. Local Database Implementation

### [src/firebase/local-db.ts](src/firebase/local-db.ts)

**Database Schema (Dexie):**
```
LocalDatabase {
  members: Table<Record, string> - indexed by id, memberIdNumber, memberName
  journalEntries: Table<Record, string> - indexed by id, entryDate
  investmentInstruments: Table<Record, string> - indexed by id, instrumentType, principalAmount
  fundSummaries: Table<Record, string> - indexed by id, memberId, createdAt
  chartOfAccounts: Table<COAEntry, string> - indexed by id, code, type
  settings: Table<Record, string> - indexed by id
}
```

**Default Settings Seeded:**
- `settings/general`: pbsName, updatedAt
- `settings/ledger`: mapping object, debitAccounts array
- `settings/interest`: interest tiers (3 default tiers), TDS rate
- `chartOfAccounts`: Initial COA from lib/coa-data

**Key Functions:**
- `shouldUseLocalDatabase()`: Always true (full offline mode)
- `ensureLocalDatabaseSeed()`: Initializes default data
- `readLocalCollection()`: Read with filters and ordering
- `readLocalDocument()`: Single document read
- `addLocalDocument()`: Create new document
- `setLocalDocument()`: Set/update document
- `deleteLocalDocument()`: Delete document
- `getDocsWithFallback()`: Query with fallback logic
- `addDocWithFallback()`: Add with fallback logic

**Query Support:**
- Filters: ==, !=, <, <=, >, >=, array-contains
- Ordering: by field with asc/desc
- Limits: Result set limiting
- Sub-collections: Via path parsing and filtering

---

## 11. Firestore Rules & Security

**File**: [firestore.rules](firestore.rules) (location not shown but referenced)
- Security rules for database access control
- Ensures authenticated access

---

## 12. Database Selection Logic

**Decision Flow:**
1. Check `shouldUseLocalDatabase()` in every operation
2. If true → use Dexie/IndexedDB operations
3. If false → use Firestore operations
4. All writes are non-blocking
5. All reads are real-time subscriptions (where possible)
6. Connectivity detection via window online/offline events

**Always-On Features:**
- IndexedDB persistence is always attempted
- Local database is always seeded
- Offline mode is fully functional

---

## 13. Summary of Operations by Type

### CREATE Operations (Write)
- Members: `addDocumentNonBlocking()`
- Journal Entries: `addDocumentNonBlocking()`
- Fund Summaries: `addDocumentNonBlocking()`
- Investments: `addDocumentNonBlocking()`
- Chart of Accounts: `addDocumentNonBlocking()`
- Settings: `updateDocumentNonBlocking()`

### READ Operations (Query)
- Collections: `useCollection()` hook
- Single Docs: `useDoc()` hook
- Batch Queries: `getDocsWithFallback()`
- Collection Groups: `collectionGroup()` with `useCollection()`
- Search/Filter: `where()` clauses
- Sorting: `orderBy()` clauses
- Pagination: `limit()` and `startAfter()`

### UPDATE Operations (Write)
- All via: `updateDocumentNonBlocking()`
- Members, Investments, Settings, Transactions, Summaries

### DELETE Operations (Write)
- All via: `deleteDocumentNonBlocking()`
- Used in multiple pages for cleanup

---

## 14. Key Development Patterns

### Memoization Pattern
```typescript
const membersRef = useMemoFirebase(() => collection(firestore, "members"), [firestore]);
const { data: members } = useCollection(membersRef);
```

### Dynamic Query Pattern
```typescript
const query = useMemoFirebase(() => {
  const constraints = [];
  if (search) constraints.push(where("field", "==", value));
  constraints.push(orderBy("field", "asc"));
  return query(collection(...), ...constraints);
}, [firestore, search]);
```

### Non-Blocking Write Pattern
```typescript
addDocumentNonBlocking(collection, data); // Returns immediately
// No await needed, errors emitted via error-emitter
```

### Fallback Query Pattern
```typescript
const snapshot = await getDocsWithFallback(queryObj);
// Automatically uses local DB if offline
```

---

## 15. Configuration & Environment

**Firestore Project:**
- Project ID: studio-4068989818-2107e
- App ID: 1:353707540879:web:c1932e72a8be4ad6540bfa
- Auth Domain: studio-4068989818-2107e.firebaseapp.com

**API Key Security:**
- API Keys embedded in config (intended for public client apps)
- Firestore security rules provide actual protection

---

## Summary Statistics

- **Total Pages Using Firestore**: 27+ pages
- **Total Collections**: 6 main collections + 2 sub-collections
- **Query Types**: WHERE, ORDER BY, GROUP, LIMIT, RANGE
- **Write Operations**: ADD, UPDATE, DELETE
- **Read Operations**: Real-time subscriptions and batch queries
- **Local Database**: Full offline support with Dexie
- **Error Handling**: Permission error events with UI notifications
