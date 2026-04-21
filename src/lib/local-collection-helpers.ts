/**
 * Local Database Collection/Document Reference Helpers
 * These replace Firebase's collection() and doc() functions
 * They work with the local IndexedDB database only
 */

/**
 * Creates a reference to a local database collection
 * @param collectionName - Name of the collection (e.g., "members", "journalEntries")
 * @returns A collection reference object compatible with useCollection hooks
 * 
 * @example
 * const membersRef = localCollection("members");
 * const { data: members } = useCollection(membersRef);
 */
export function localCollection(collectionName: string) {
  return {
    type: 'collection' as const,
    path: collectionName,
  };
}

/**
 * Creates a reference to a sub-collection of a document
 * @param parentCollectionName - Parent collection name
 * @param parentDocId - Parent document ID
 * @param subCollectionName - Sub-collection name
 * @returns A reference compatible with useCollection hooks
 * 
 * @example
 * const fundSummariesRef = localSubCollection("members", "member123", "fundSummaries");
 * const { data: summaries } = useCollection(fundSummariesRef);
 */
export function localSubCollection(
  parentCollectionName: string,
  parentDocId: string,
  subCollectionName: string
) {
  return {
    type: 'collection' as const,
    path: `${parentCollectionName}/${parentDocId}/${subCollectionName}`,
  };
}

/**
 * Creates a reference to a local database document
 * @param collectionName - Collection name
 * @param docId - Document ID
 * @returns A document reference object compatible with useDoc hooks
 * 
 * @example
 * const memberRef = localDoc("members", "member123");
 * const { data: member } = useDoc(memberRef);
 */
export function localDoc(collectionName: string, docId: string) {
  return {
    type: 'doc' as const,
    path: `${collectionName}/${docId}`,
  };
}

/**
 * Creates a reference to a sub-document
 * @param parentCollectionName - Parent collection
 * @param parentDocId - Parent document ID  
 * @param subCollectionName - Sub-collection name
 * @param subDocId - Sub-document ID
 * @returns A document reference compatible with useDoc hooks
 * 
 * @example
 * const summaryRef = localSubDoc("members", "member123", "fundSummaries", "summary1");
 * const { data: summary } = useDoc(summaryRef);
 */
export function localSubDoc(
  parentCollectionName: string,
  parentDocId: string,
  subCollectionName: string,
  subDocId: string
) {
  return {
    type: 'doc' as const,
    path: `${parentCollectionName}/${parentDocId}/${subCollectionName}/${subDocId}`,
  };
}
