import { useRef, useState, useCallback } from 'react';

export function useRefState<T>(initialValue: T) {
  const ref = useRef<T>(initialValue);
  const [, setDummyState] = useState({}); // ダミー。リレンダリング用。

  const setRefState = useCallback((value: T) => {
    ref.current = value;
    setDummyState({}); // ダミー更新でリレンダリング
  }, []);

  return [ref, setRefState] as const;
}
