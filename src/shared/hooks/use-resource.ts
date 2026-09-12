import { useEffect, useState, useSyncExternalStore } from "react";

// Memory only; academic records are never persisted in browser storage.
const cache = new Map<string, unknown>();
const listeners = new Set<() => void>();
let version = 0;
export function invalidateResources() {
  cache.clear();
  version++;
  listeners.forEach((notify) => notify());
}
function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}
export function useResource<T>(key: string, loader: () => Promise<T>) {
  const revision = useSyncExternalStore(subscribe, () => version);
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>(
    { key, data: cache.get(key) as T | undefined },
  );
  useEffect(() => {
    let active = true;
    const requestVersion = version;
    loader()
      .then((data) => {
        if (!active || requestVersion !== version) return;
        cache.set(key, data);
        setState({ key, data });
      })
      .catch((error: unknown) => {
        if (active)
          setState({
            key,
            error:
              error instanceof Error
                ? error.message
                : "Não foi possível carregar os dados.",
          });
      });
    return () => {
      active = false;
    };
  }, [key, loader, revision]);
  const current =
    state.key === key
      ? state
      : { data: cache.get(key) as T | undefined, error: undefined };
  return { ...current, retry: invalidateResources };
}
