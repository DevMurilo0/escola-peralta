export function invalidateResources() {
  window.dispatchEvent(new Event("fixture-refresh"));
}

export function useResource<T>(key: string, loader: () => Promise<T>) {
  void key;
  void loader;
  return { data: [] as T, error: undefined, retry: invalidateResources };
}
