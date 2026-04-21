'use client';

export interface OfflineAuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  isOffline: true;
}

const OFFLINE_AUTH_KEY = 'pbs-cpf-offline-user';

export function getOfflineAuthUser(): OfflineAuthUser | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(OFFLINE_AUTH_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as OfflineAuthUser;
  } catch {
    return null;
  }
}

function dispatchOfflineAuthChangedEvent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('offline-auth-changed'));
}

export function createOfflineAuthUser(displayName = 'Offline User'): OfflineAuthUser {
  const user: OfflineAuthUser = {
    uid: `offline-${Math.random().toString(36).slice(2, 10)}`,
    email: 'offline@pbs-cpf.local',
    displayName,
    isOffline: true,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(OFFLINE_AUTH_KEY, JSON.stringify(user));
    dispatchOfflineAuthChangedEvent();
  }

  return user;
}

export function clearOfflineAuthUser(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(OFFLINE_AUTH_KEY);
  dispatchOfflineAuthChangedEvent();
}

export function isOfflineUser(value: unknown): value is OfflineAuthUser {
  return typeof value === 'object' && value !== null && (value as any).isOffline === true;
}
