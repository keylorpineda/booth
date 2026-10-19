export type DefinedOnly<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

/**
 * Drops keys whose value is `undefined`, so partial updates from Zod (`field?: T | undefined`) fit
 * Prisma's inputs under `exactOptionalPropertyTypes`. `null` is kept: it means "clear the field".
 */
export function definedOnly<T extends object>(input: T): DefinedOnly<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as DefinedOnly<T>;
}
