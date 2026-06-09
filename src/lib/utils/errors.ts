/**
 *
 * Extracts the error message from an error object, or returns a fallback string
 *  if the error is not an instance of Error.
 *
 * @param err
 * @param fallback
 * @returns an error message, object as string, or fallback
 */
export function errorMessage(err: unknown, fallback?: string): string {
	const message = fallback ?? String(err);
	return err instanceof Error ? err.message : message;
}
