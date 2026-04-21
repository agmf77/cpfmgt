# Quick Reference: Firestore Operations Index

## Collection Locations Map

| Collection | Document | Sub-Collection | Operations | Pages |
|-----------|----------|-----------------|-----------|-------|
| `settings` | `general` | — | READ | All pages |
| `settings` | `ledger` | — | READ, UPDATE | Settings, Transactions |
| `settings` | `interest` | — | READ, UPDATE | Settings, Interest pages |
| `members` | Various | — | CRUD (READ most) | Members, Dashboard |
| `members/{id}` | — | `fundSummaries` | CRUD | Member detail, Interest, Transactions |
| `journalEntries` | Various | — | CRUD | Transactions, Reports |
| `chartOfAccounts` | Various | — | CRUD | CoA, Settings, Reports |
| `investmentInstruments` | Various | `auditHistory` | CRUD | Investments |
| `fundSummaries` (Group) | — | — | READ | All reports |

---

## Operation Quick Lookup

### **CREATE (Insert)**
- `addDocumentNonBlocking(colRef, data)` - Non-blocking, returns promise
- Locations: Members, Transactions, Investments, Settings, Interest, CoA
- Local fallback: ✅ Yes (IndexedDB)

### **READ (Query)**
- `useCollection(queryRef)` - Real-time subscription
- `useDoc(docRef)` - Real-time single doc
- `getDocsWithFallback(query)` - Batch query with local fallback
- Local fallback: ✅ Yes (IndexedDB)

### **UPDATE (Modify)**
- `updateDocumentNonBlocking(docRef, data)` - Merged update, non-blocking
- Locations: Members, Investments, Settings, Transactions, Summaries
- Local fallback: ✅ Yes (IndexedDB)

### **DELETE (Remove)**
- `deleteDocumentNonBlocking(docRef)` - Non-blocking
- Locations: Transactions, Members, CoA, Settings, Reports
- Local fallback: ✅ Yes (IndexedDB)

---

## Query Patterns Used

### Simple Collection Read
```typescript
const ref = collection(firestore, "members");
const { data: members } = useCollection(useRef(() => ref, [firestore]));
```

### Document Reference
```typescript
const docRef = doc(firestore, "settings", "general");
const { data: settings } = useDoc(docRef);
```

### Sub-Collection Access
```typescript
const subRef = collection(firestore, "members", memberId, "fundSummaries");
```

### Collection Group Query (All sub-collections)
```typescript
const groupRef = collectionGroup(firestore, "fundSummaries");
const { data: summaries } = useCollection(groupRef);
```

### With WHERE Clause
```typescript
const q = query(ref, where("memberIdNumber", "==", searchValue));
const snapshot = await getDocsWithFallback(q);
```

### With RANGE Query
```typescript
const q = query(ref, 
  where("name", ">=", searchStart),
  where("name", "<", searchEnd)
);
```

### With ORDER BY
```typescript
const q = query(ref, orderBy("summaryDate", "asc"));
```

### With LIMIT
```typescript
const q = query(ref, 
  orderBy("memberIdNumber", "asc"),
  limit(pageSize + 1)
);
```

### Complex Query (Members Search)
```typescript
const constraints = [];
if (search) {
  if (/^\d+$/.test(search)) {
    constraints.push(where("memberIdNumber", "==", search));
  } else {
    const end = search.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));
    constraints.push(where("name", ">=", search));
    constraints.push(where("name", "<", end));
  }
}
constraints.push(orderBy("memberIdNumber", "asc"));
constraints.push(limit(pageSize + 1));
const q = query(collection(firestore, "members"), ...constraints);
```

---

## Database Files Location

### Core Firebase
- [src/firebase/index.ts](src/firebase/index.ts) - Main export with initialization
- [src/firebase/config.ts](src/firebase/config.ts) - Firebase configuration
- [src/firebase/provider.tsx](src/firebase/provider.tsx) - React context provider

### Hooks (Real-time subscriptions)
- [src/firebase/firestore/use-collection.tsx](src/firebase/firestore/use-collection.tsx) - Collection subscription
- [src/firebase/firestore/use-doc.tsx](src/firebase/firestore/use-doc.tsx) - Document subscription

### Write Operations
- [src/firebase/non-blocking-updates.tsx](src/firebase/non-blocking-updates.tsx) - ADD, UPDATE, DELETE, SET

### Offline Storage
- [src/firebase/local-db.ts](src/firebase/local-db.ts) - Dexie database, fallback logic
- [src/firebase/offline-auth.ts](src/firebase/offline-auth.ts) - Offline user handling

### Error Handling
- [src/firebase/errors.ts](src/firebase/errors.ts) - Error types
- [src/firebase/error-emitter.ts](src/firebase/error-emitter.ts) - Error event emission

---

## Pages by Database Operations Count

| Page | Query | CREATE | UPDATE | DELETE | Notes |
|------|-------|--------|--------|--------|-------|
| Dashboard | 3 | 0 | 0 | 0 | Statistics display |
| Members | 1 | 1 | 1 | 1 | Full CRUD |
| Member [id] | 2 | 1 | 1 | 1 | Fund summaries management |
| Transactions | 1 | 1 | 1 | 1 | Journal entries with reversal |
| CoA | 1 | 1 | 1 | 1 | Chart of accounts |
| Settings | 4 | 1 | 3 | 1 | Settings & COA |
| Investments | 3 | 1 | 1 | 1 | With audit history |
| Interest | 3 | 1 | 0 | 0 | Interest distribution |
| All Reports | 3-4 | 0 | 0 | 0 | READ-only |
| Contributions | 2 | 0 | 0 | 1 | Can delete contributions |

---

## Collections with Sub-Collections

### members/{memberId}/fundSummaries
- Tracks member fund movements
- Each entry has lines with account codes
- Used by: Transactions, Interest pages, Reports, Member detail

### investmentInstruments/{instrumentId}/auditHistory
- Tracks changes to investments
- Used by: Investments page
- Queryable with `orderBy("summaryDate", "asc")`

---

## Default Settings (Seeded on First Load)

### settings/general
```json
{
  "id": "general",
  "pbsName": "Gazipur Palli Bidyut Samity-2",
  "updatedAt": "ISO-8601 timestamp"
}
```

### settings/ledger
```json
{
  "id": "ledger",
  "mapping": {},
  "debitAccounts": [],
  "updatedAt": "ISO-8601 timestamp"
}
```

### settings/interest
```json
{
  "id": "interest",
  "tiers": [
    { "limit": 1500000, "rate": 0.13 },
    { "limit": 3000000, "rate": 0.12 },
    { "limit": null, "rate": 0.11 }
  ],
  "tdsRate": 0.2,
  "updatedAt": "ISO-8601 timestamp"
}
```

---

## Local Database Tables

| Table | Key | Indexes | Purpose |
|-------|-----|---------|---------|
| members | id | memberIdNumber, memberName | Member records |
| journalEntries | id | entryDate | Journal entries |
| investmentInstruments | id | instrumentType, principalAmount | Investment records |
| fundSummaries | id | memberId, createdAt | Fund movements |
| chartOfAccounts | id | code, type | Chart of accounts |
| settings | id | — | Configuration |

---

## Error Handling

### All Write Operations
- Emit `'permission-error'` event if operation fails
- Non-blocking: error doesn't interrupt execution
- Listen via: Firebase error emitter singleton

### Error Event Payload
```typescript
{
  path: string,          // Document/collection path
  operation: 'create' | 'update' | 'delete' | 'write',
  requestResourceData?: any  // Data that was being written
}
```

---

## Offline Mode Details

**Current Status**: Always offline-ready
- `shouldUseLocalDatabase()` returns true
- All reads fall back to IndexedDB
- All writes go to IndexedDB first
- Dexie handles all local persistence

**Local Database Path**:
- Database Name: `PBSCPF_LocalDB`
- Storage: Browser IndexedDB
- Persistence: Until user clears browser data

---

## Performance Considerations

### Memoization Required
- Always wrap Firestore references in `useMemoFirebase()`
- Prevents unnecessary re-renders and hook re-executions
- Required by `useCollection()` and `useDoc()`

### Query Optimization
- Use WHERE clauses to filter early
- Firestore limits documents by default
- Local DB applies filters in memory
- ORDER BY with LIMIT recommended

### Sub-Collection Queries
- Use specific paths: `members/{id}/fundSummaries`
- Use collection groups: `collectionGroup("fundSummaries")`
- Avoid deep nesting (only 2 levels used)

---

## Common Patterns

### Loading State
```typescript
const { data, isLoading, error } = useCollection(ref);
if (isLoading) return <Loader />;
if (error) return <Error />;
```

### Filtering Data
```typescript
const filtered = useMemo(() => {
  if (!data) return [];
  return data.filter(item => /* condition */);
}, [data, /* deps */]);
```

### Searching (Index Search)
```typescript
const constraints = [];
if (search && /^\d+$/.test(search)) {
  constraints.push(where("memberIdNumber", "==", search));
}
const q = query(ref, ...constraints);
```

### CRUD Pattern
```typescript
// Create
addDocumentNonBlocking(ref, { ...data });

// Read (subscribed)
const { data } = useCollection(ref);

// Update
updateDocumentNonBlocking(doc(...), { fieldToUpdate: value });

// Delete
deleteDocumentNonBlocking(doc(...));
```

---

## Debugging Tips

1. **Check Offline Mode**: `shouldUseLocalDatabase()` shows current mode
2. **Local Data**: Open DevTools → Application → IndexedDB → PBSCPF_LocalDB
3. **Error tracking**: Listen to Firebase error emitter events
4. **Query debugging**: Check `useCollection` snapshot in component
5. **Firestore Console**: firebase.google.com → studio-4068989818-2107e

---

## Related Files

- Configuration: [firestore.rules](firestore.rules)
- Local data seed: [src/lib/coa-data.ts](src/lib/coa-data.ts)
- Components using Firebase:
  - [src/components/FirebaseErrorListener.tsx](src/components/FirebaseErrorListener.tsx)
  - [src/components/auth-wrapper.tsx](src/components/auth-wrapper.tsx)
  - [src/components/non-blocking-login.tsx](src/components/non-blocking-login.tsx)
  - [src/components/non-blocking-updates.tsx](src/components/non-blocking-updates.tsx)
