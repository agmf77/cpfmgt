'use client';

import { useEffect, useState } from 'react';

// Types
export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

export interface UseDocResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

// Collection hooks
export function useCollection<T = any>(collectionName: string, options?: {
  where?: any;
  orderBy?: any;
  limit?: number;
}): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!collectionName) {
          setData(null);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/collections/${collectionName}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result = await response.json();
        setData(result as WithId<T>[]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up polling for real-time updates (simplified)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [collectionName]);

  return { data, isLoading, error };
}

// Document hook
export function useDoc<T = any>(collectionName: string, id: string): UseDocResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/collections/${collectionName}/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setData(null);
            return;
          }
          throw new Error('Failed to fetch document');
        }

        const result = await response.json();
        setData(result as T);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch document'));
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchData();
    }

    // Set up polling for real-time updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [collectionName, id]);

  return { data, isLoading, error };
}

// Write operations
export async function addDocument(collectionName: string, data: any): Promise<{ id: string }> {
  const response = await fetch(`/api/collections/${collectionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to add document');
  }

  return await response.json();
}

export async function updateDocument(collectionName: string, id: string, data: any): Promise<void> {
  const response = await fetch(`/api/collections/${collectionName}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update document');
  }
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  const response = await fetch(`/api/collections/${collectionName}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete document');
  }
}

// Special queries
export async function getFundSummariesByMember(memberId: string) {
  const response = await fetch(`/api/fund-summaries?memberId=${memberId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch fund summaries');
  }
  return await response.json();
}

export async function getAllFundSummaries() {
  const response = await fetch('/api/fund-summaries');
  if (!response.ok) {
    throw new Error('Failed to fetch fund summaries');
  }
  return await response.json();
}