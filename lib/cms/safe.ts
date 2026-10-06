export async function withCMS<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[cms]", error);
    return fallback;
  }
}
