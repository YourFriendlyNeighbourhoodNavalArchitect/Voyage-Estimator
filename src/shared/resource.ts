import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { errorMessage } from './errors.ts';

export type Resource<T> =
  | { status: 'idle'; data: null }
  | { status: 'loading'; data: T | null }
  | { status: 'success'; data: T }
  | { status: 'error'; data: null; error: string };

export const IDLE = { status: 'idle', data: null } as const;

export interface Query<T> {
  subject: string;
  key: string;
  load: () => Promise<T>;
}

type Outcome<T> = { ok: true; data: T } | { ok: false; error: string };

interface Settled<T> {
  subject: string;
  id: string;
  outcome: Outcome<T>;
}

export function useResource<T>(query: Query<T> | null, delay = 0): Resource<T> {
  const id = query && JSON.stringify([query.subject, query.key]);
  const subject = query?.subject ?? null;
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const load = useEffectEvent(() => (query ? query.load() : Promise.reject(new Error('There is nothing to load.'))));

  useEffect(() => {
    if (id === null || subject === null) return;
    let current = true;
    const settle = (outcome: Outcome<T>) => {
      if (current) setSettled({ subject, id, outcome });
    };
    const timer = setTimeout(() => {
      load().then(
        (data) => settle({ ok: true, data }),
        (error: unknown) => settle({ ok: false, error: errorMessage(error) }),
      );
    }, delay);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [id, subject, delay]);

  return useMemo((): Resource<T> => {
    if (id === null) return IDLE;
    if (settled?.id === id) {
      const { outcome } = settled;
      return outcome.ok ? { status: 'success', data: outcome.data } : { status: 'error', data: null, error: outcome.error };
    }
    const shown = settled?.subject === subject && settled.outcome.ok ? settled.outcome.data : null;
    return { status: 'loading', data: shown };
  }, [id, subject, settled]);
}
