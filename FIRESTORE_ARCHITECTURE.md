# Firestore Database Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js 13+ App                             │
│                   (React Components)                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    Firestore Hooks Layer
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌────▼────┐         ┌────▼────┐
   │useCollection      │useDoc   │    │getDocsWithFallback
   │  READS            │ READS   │         │ READS
   └────┬────┘         └────┬────┘         └────┬────┘
        │                   │                    │
        │        Non-Blocking Writes             │
   ┌────▼───────────────────────────────────────▼────┐
   │  ADD │ UPDATE │ DELETE │ SET                    │
   └────┬─────────────────────────────────────────┬──┘
        │                                         │
        │          Database Selection Logic       │
        │     shouldUseLocalDatabase() → true     │
        │                                         │
   ┌────┴──────────────┬───────────────────┬─────┴───┐
   │                   │                   │         │
   │                   │                   │         │
   v                   v                   v         v
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Firebase    │  │  IndexedDB   │  │  Auth State  │
│ Firestore    │  │   (Dexie)    │  │ Management   │
│              │  │              │  │              │
│ Collections: │  │ Local Tables:│  │ Offline User │
│  members     │  │  members     │  │ Creation     │
│  journals    │  │  journals    │  │              │
│  investments │  │  investments │  │              │
│  settings    │  │  settings    │  │              │
│  chartOfAcc  │  │  chartOfAcc  │  │              │
│              │  │              │  │              │
│ Real-time:   │  │ Persistence: │  │ Fallback:    │
│  onSnapshot  │  │  IndexedDB   │  │  Online/     │
│  listeners   │  │  API         │  │  Offline     │
└──────────────┘  └──────────────┘  └──────────────┘
     Cloud              Browser                 Logic
   (Production)        (Local Storage)        (Decision)
```

---

## Data Flow: CREATE Operation

```
User clicks "Add Member"
       │
       v
Component calls:
addDocumentNonBlocking(collection(firestore, "members"), memberData)
       │
       v ┌─────────────────────────────────────────────┐
         │ Check: shouldUseLocalDatabase()? → TRUE    │
         └────────┬────────────────────────────────────┘
                  │
         ┌────────▼────────┐
         │                 │
     YES │                 │ NO
        v                 v
   ┌─────────────┐   ┌──────────────┐
   │ Local Flow: │   │ Firebase:    │
   │             │   │              │
   │ 1. Generate │   │ 1. Call      │
   │    UUID     │   │    addDoc()  │
   │ 2. Validate │   │ 2. Send to   │
   │    path     │   │    Cloud     │
   │ 3. Add to   │   │ 3. Return    │
   │    IndexedDB│   │    doc ref   │
   │ 4. Return   │   │ 4. Set ID    │
   │    ID       │   │              │
   │ 5. Emit on  │   │ 5. Error on  │
   │    error    │   │    failure   │
   └─────┬───────┘   └──────┬───────┘
         │                  │
         └──────────┬───────┘
                    │
              Component receives:
              { id: "generated-id" } or error event
```

---

## Data Flow: READ Operation (useCollection)

```
Component mounts / Query changes:
  useCollection(memoizedQueryRef)
       │
       v ┌──────────────────────────────┐
         │ Check: shouldUseLocalDatabase()
         └────────┬────────────────────┘
                  │
         ┌────────▼────────┐
         │                 │
     YES │                 │ NO
        v                 v
   ┌─────────────────┐  ┌──────────────────┐
   │ Local Flow:     │  │ Firebase Flow:   │
   │                 │  │                  │
   │ 1. Read all     │  │ 1. Subscribe     │
   │    docs from    │  │    with          │
   │    IndexedDB    │  │    onSnapshot()  │
   │ 2. Apply filters│  │ 2. Real-time:    │
   │    (WHERE)      │  │    listen for    │
   │ 3. Apply order  │  │    changes       │
   │    (ORDER BY)   │  │ 3. Cache locally │
   │ 4. Apply limit  │  │ 4. Unsubscribe   │
   │    (LIMIT)      │  │    on unmount    │
   │ 5. Set polling  │  │ 5. Apply offline │
   │    interval     │  │    persistence   │
   │ 6. Return data  │  │ 6. Return data   │
   │ + loading state │  │ + loading state  │
   └─────┬───────────┘  └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
         Return in React state:
         { data: [], isLoading: false, error: null, snapshot }
         │
         └─► Component re-renders with data
```

---

## Offline Persistence Architecture

```
┌─────────────────────────────────────────────┐
│         Application Startup Sequence         │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────▼────────────┐
    │ initializeFirebase()    │
    │ called from provider    │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────────┐
    │ 1. Initialize Firebase App  │
    │ 2. Get Firestore instance   │
    │ 3. Enable IndexedDB         │
    │    persistence              │
    └────────────┬────────────────┘
                 │
    ┌────────────▼──────────────────┐
    │ ensureLocalDatabaseSeed()     │
    │ (Dexie for offline access)    │
    └────────────┬──────────────────┘
                 │
    ┌────────────▼───────────────┐
    │ Check existing data:       │
    │ • Chart of Accounts        │
    │ • Settings (general,       │
    │   ledger, interest)        │
    │ • Offline user             │
    └────────────┬───────────────┘
                 │
    ┌────────────▼──────────────┐
    │ If missing → Seed with    │
    │ default values:           │
    │ • COA from lib/coa-data   │
    │ • Settings with defaults  │
    │ • Offline user created    │
    └──────────────────────────┘
                 ↓
    ┌────────────────────────────┐
    │  App Ready For:            │
    │  • Online: Real Firestore  │
    │  • Offline: Local IndexedDB│
    └────────────────────────────┘
```

---

## Database Switching Decision Tree

```
Every Database Operation:
         │
         v
    shouldUseLocalDatabase()?
         │
    ┌────┴────┐
    │          │
   YES        NO (Not used - function always returns true)
    │
    v
USE LOCAL INDEXEDDB (Dexie)
    │
    ├─► Read: readLocalCollection / readLocalDocument
    │
    ├─► Query: applyLocalFilters, applyLocalOrderingAndLimits
    │
    ├─► Write: addLocalDocument, setLocalDocument, deleteLocalDocument
    │
    ├─► Fallback: Get local snapshot or error
    │
    └─► No network dependency - always works offline
```

---

## Firestore Collection Structure

```
firestore.google.com
└─ studio-4068989818-2107e (Project)
   │
   ├─ settings (Collection)
   │  ├─ general (Document)
   │  │  ├─ pbsName: "Gazipur Palli Bidyut Samity-2"
   │  │  └─ updatedAt: ISO timestamp
   │  │
   │  ├─ ledger (Document)
   │  │  ├─ mapping: { ...account mappings }
   │  │  ├─ debitAccounts: [ ...codes ]
   │  │  └─ updatedAt: ISO timestamp
   │  │
   │  └─ interest (Document)
   │     ├─ tiers: [
   │     │    { limit: 1500000, rate: 0.13 },
   │     │    { limit: 3000000, rate: 0.12 },
   │     │    { limit: null, rate: 0.11 }
   │     │  ]
   │     ├─ tdsRate: 0.2
   │     └─ updatedAt: ISO timestamp
   │
   ├─ members (Collection)
   │  ├─ memberId1 (Document)
   │  │  ├─ id: "memberId1"
   │  │  ├─ memberIdNumber: "PBS001"
   │  │  ├─ name: "Member Name"
   │  │  ├─ ... (other member fields)
   │  │  │
   │  │  └─ fundSummaries (Sub-collection)
   │  │     ├─ summaryId1 (Document)
   │  │     │  ├─ id: "summaryId1"
   │  │     │  ├─ memberId: "memberId1"
   │  │     │  ├─ journalEntryId: "entryId1"
   │  │     │  ├─ lines: [ ...line items ]
   │  │     │  └─ ... (fund summary fields)
   │  │     └─ summaryId2, summaryId3, ...
   │  │
   │  └─ memberId2, memberId3, ...
   │
   ├─ journalEntries (Collection)
   │  ├─ entryId1 (Document)
   │  │  ├─ id: "entryId1"
   │  │  ├─ entryDate: "2024-01-15"
   │  │  ├─ lines: [
   │  │  │    { memberId, accountCode, amount, ... },
   │  │  │    { memberId, accountCode, amount, ... }
   │  │  │  ]
   │  │  └─ ... (entry fields)
   │  │
   │  └─ entryId2, entryId3, ...
   │
   ├─ chartOfAccounts (Collection)
   │  ├─ accCode1 (Document)
   │  │  ├─ id: "accCode1"
   │  │  ├─ code: "1000"
   │  │  ├─ accountName: "Cash at Bank"
   │  │  ├─ accountType: "ASSET"
   │  │  ├─ normalBalance: "DEBIT"
   │  │  └─ isHeader: false
   │  │
   │  └─ accCode2, accCode3, ...
   │
   └─ investmentInstruments (Collection)
      ├─ investId1 (Document)
      │  ├─ id: "investId1"
      │  ├─ bankName: "ABC Bank"
      │  ├─ principalAmount: 500000
      │  ├─ issueDate: "2024-01-01"
      │  │
      │  └─ auditHistory (Sub-collection)
      │     ├─ historyId1 (Document)
      │     │  ├─ id: "historyId1"
      │     │  ├─ action: "create|update|delete"
      │     │  ├─ timestamp: ISO timestamp
      │     │  └─ ... (change details)
      │     │
      │     └─ historyId2, historyId3, ...
      │
      └─ investId2, investId3, ...

Note: All Documents have an 'id' field matching the doc ID
```

---

## Local IndexedDB Structure (Dexie)

```
Browser IndexedDB
└─ PBSCPF_LocalDB (Database)
   │
   ├─ members (Object Store)
   │  ├─ Primary Key: id
   │  ├─ Indexes: memberIdNumber, memberName
   │  └─ Documents: Same structure as Firestore members
   │
   ├─ journalEntries (Object Store)
   │  ├─ Primary Key: id
   │  ├─ Indexes: entryDate
   │  └─ Documents: Same structure as Firestore
   │
   ├─ investmentInstruments (Object Store)
   │  ├─ Primary Key: id
   │  ├─ Indexes: instrumentType, principalAmount
   │  └─ Documents: Same structure as Firestore
   │
   ├─ fundSummaries (Object Store)
   │  ├─ Primary Key: id
   │  ├─ Indexes: memberId, createdAt
   │  ├─ Note: Filtered by memberId path segment
   │  └─ Documents: Same structure as Firestore
   │
   ├─ chartOfAccounts (Object Store)
   │  ├─ Primary Key: id
   │  ├─ Indexes: code, type
   │  └─ Documents: Seeded from lib/coa-data.ts
   │
   └─ settings (Object Store)
      ├─ Primary Key: id
      ├─ Indexes: none
      ├─ Documents:
      │  ├─ general: Default PBS name + settings
      │  ├─ ledger: Empty mapping + debitAccounts array
      │  └─ interest: Interest tiers + TDS rate
      │
      └─ Note: Preserved and updated from Firestore


Capacity: Typically 50MB+ (depends on browser)
Persistence: Survives browser restart
Clearing: Happens when user clears browser data
```

---

## Error Handling Flow

```
Write Operation Error:
         │
         v
    Operation fails
         │
    ┌────▼──────────────────────────┐
    │ Catch error block in function │
    └────┬──────────────────────────┘
         │
         v
    ┌────────────────────────────────────┐
    │ errorEmitter.emit(                 │
    │   'permission-error',              │
    │   new FirestorePermissionError({    │
    │     path: docRef.path,              │
    │     operation: 'create|update|...'  │
    │     requestResourceData: data       │
    │   })                                │
    │ )                                  │
    └────┬───────────────────────────────┘
         │
         v
    ┌────────────────────────────────────┐
    │ FirebaseErrorListener component    │
    │ (listens to error emitter)         │
    └────┬───────────────────────────────┘
         │
         v
    ┌────────────────────────────────────┐
    │ Displays SweetAlert to user        │
    │ with error message                 │
    └────────────────────────────────────┘
```

---

## Query Performance Characteristics

### Firestore Queries
```
Complexity | Firestore         | Local IndexedDB
-----------|-------------------|-------------------
Simple     | 1-10ms (cached)   | <1ms (in-memory)
WHERE      | 10-50ms (indexed) | 1-5ms (filtered)
ORDER BY   | 10-50ms           | 1-10ms (in-memory)
LIMIT      | 10-50ms           | <1ms (limited)
Complex    | 100+ ms           | 5-50ms (filtered)
GROUP      | 100+ ms           | 10-100ms (filtered)
Network    | 100-500ms+        | 0ms (local)
```

---

## Supported Query Operators

| Operator | Firestore | Local DB | Example |
|----------|-----------|----------|---------|
| == | ✅ | ✅ | `where("status", "==", "active")` |
| != | ✅ | ✅ | `where("status", "!=", "deleted")` |
| < | ✅ | ✅ | `where("amount", "<", 1000)` |
| <= | ✅ | ✅ | `where("amount", "<=", 1000)` |
| > | ✅ | ✅ | `where("amount", ">", 1000)` |
| >= | ✅ | ✅ | `where("amount", ">=", 1000)` |
| array-contains | ✅ | ✅ | `where("tags", "array-contains", "featured")` |
| in | ✅ | ❌ | Not implemented locally |
| array-contains-any | ✅ | ❌ | Not implemented locally |

---

## Real-time Synchronization

```
Online Mode:
┌─────────────────────────────┐
│  Firestore Real-time        │
│  onSnapshot listener        │
└────────────┬────────────────┘
             │
             v
      ┌──────────────┐
      │ Data changes │
      └────────┬─────┘
               │
        ┌──────▼──────┐
        │ IndexedDB   │
        │ also synced │
        │ (persistence)
        └─────────────┘
             │
             v
      ┌──────────────┐
      │ Component    │
      │ re-renders   │
      └──────────────┘

Offline Mode:
┌──────────────────────┐
│ IndexedDB polling    │
│ (no Firestore)       │
└────────────┬─────────┘
             │
        ┌────▼────┐
        │ Changes │
        │ in UI   │
        └────┬────┘
             │
      ┌──────▼──────┐
      │ IndexedDB   │
      │ written     │
      └──────┬──────┘
             │
             v
      ┌──────────────┐
      │ Component    │
      │ re-renders   │
      └──────────────┘
             │
             └─► Queued for sync when online
```

---

## Transaction Flow for Journal Entry Creation

```
User fills form → Clicks "Save"
                       │
                       v
        Parse and validate entry data
                       │
         ┌─────────────▼─────────────┐
         │ For each account line:    │
         │                           │
         │ 1. Validate accounts      │
         │ 2. Check member exists    │
         │ 3. Calculate amounts      │
         └─────────────┬─────────────┘
                       │
                       v
        Create journal entry document with lines array
                       │
        ┌──────────────▼──────────────┐
        │ addDocumentNonBlocking(     │
        │   journalEntries,           │
        │   { entryData with lines }  │
        │ )                           │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │ For each entry line:        │
        │ Create/Update fundSummary   │
        │                             │
        │ Key:{memberId,accountCode}  │
        │                             │
        │ updateDocumentNonBlocking(  │
        │   members/{}​/fundSummaries/{}│
        │   foundSummaryData          │
        │ ) or                        │
        │ addDocumentNonBlocking(...) │
        │ if new                      │
        └──────────────┬──────────────┘
                       │
                       v
        ┌──────────────────────┐
        │ All operations       │
        │ queued to IndexedDB  │
        │ or Firestore        │
        └──────────┬───────────┘
                   │
                   v
        ┌──────────────────────────────┐
        │ Show success message         │
        │ Redirect or refresh          │
        └──────────────────────────────┘
```

---

## Summary View

| Aspect | Details |
|--------|---------|
| **Primary DB** | Firebase Firestore (Cloud) |
| **Fallback DB** | Dexie/IndexedDB (Browser) |
| **Switching Logic** | `shouldUseLocalDatabase()` always true |
| **Collections** | 6 (settings, members, journals, investments, chartOfAcc, fundSummaries) |
| **Sub-collections** | 2 (fundSummaries in members, auditHistory in investments) |
| **Query Types** | WHERE, ORDER BY, LIMIT, COLLECTION GROUP |
| **Write Types** | ADD, UPDATE, DELETE, SET |
| **Real-time** | Yes (via onSnapshot) |
| **Offline Support** | Full (all reads/writes work offline) |
| **Error Handling** | Permission error events + UI notifications |
| **Performance** | <100ms for local, varies for cloud |
| **Persistence** | IndexedDB for offline access |
| **Security Model** | Firestore security rules (not shown here) |
