/**
 * Tiny classNames joiner. Avoids pulling in a dependency for something this
 * small. Falsy values are dropped; everything else is space-joined.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
