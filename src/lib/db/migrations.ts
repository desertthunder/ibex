import type { DbClient } from './client';

export type Migration = { id: string; description: string; up: (db: DbClient) => Promise<void> };

export type MigrationStatus = {
	pending: readonly Migration[];
	applied: readonly string[];
	currentVersion: string | null;
};

export const migrations: readonly Migration[] = [];

export async function getMigrationStatus(_db: DbClient): Promise<MigrationStatus> {
	return { pending: migrations, applied: [], currentVersion: null };
}

export async function runMigrations(_db: DbClient): Promise<MigrationStatus> {
	return getMigrationStatus(_db);
}
