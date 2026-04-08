/** Ejecuta tareas en paralelo con un máximo de `concurrency` a la vez (sin colas externas). */
export async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let next = 0;
  const cap = Math.max(1, Math.min(Math.floor(concurrency) || 1, items.length));

  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: cap }, () => worker()));
  return results;
}
