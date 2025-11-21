/**
 * Normalizes a path to ensure it begins with a leading slash.
 */
export function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    return `/${path}`;
  }
  return path;
}

/**
 * Checks whether a URL belongs to an allowed set of path prefixes.
 */
export function isRouteAllowed(url: string, validPaths: string[]): boolean {
  const parsed = new URL(url, 'http://localhost');
  const normalizedPaths = validPaths.map(normalizePath);
  return normalizedPaths.some(path => parsed.pathname.startsWith(path));
}
