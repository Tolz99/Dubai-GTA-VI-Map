import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

/** useState that persists to AsyncStorage. */
export function usePersistent<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw != null) setValue(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [key]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        AsyncStorage.setItem(key, JSON.stringify(v)).catch(() => {});
        return v;
      });
    },
    [key],
  );
  return [value, set, loaded] as const;
}

export type Focus =
  | { kind: 'none' }
  | { kind: 'shopping' }
  | { kind: 'brand'; id: string }
  | { kind: 'brandCat'; id: string }
  | { kind: 'mission'; id: string };
