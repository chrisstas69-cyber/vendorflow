export function isAllowedImageReference(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && url.protocol === 'http:');
  } catch {
    return false;
  }
}

export function safeImageReference(value: string | null | undefined): string | undefined {
  return isAllowedImageReference(value) ? value : undefined;
}
