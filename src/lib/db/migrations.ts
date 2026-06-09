import Dexie from 'dexie';
import type { DbClient } from './client';
import { DB_NAME } from './schema';

export type Migration = { id: string; description: string };

export type AppliedMigration = { version: string; appliedAt: string };

export type MigrationStatus = {
	pending: readonly Migration[];
	applied: readonly AppliedMigration[];
	currentVersion: string | null;
};

export const migrations: readonly Migration[] = [
	{
		id: '202606090001_dexie_cache_schema',
		description: 'Create local Dexie cache stores and indexes.'
	}
];

export async function getMigrationStatus(db: DbClient): Promise<MigrationStatus> {
	await db.open();
	return currentStatus();
}

export async function runMigrations(db: DbClient): Promise<MigrationStatus> {
	await db.open();
	return currentStatus();
}

export async function resetLocalCacheDatabase(): Promise<void> {
	if (!import.meta.env.DEV) {
		throw new Error('Resetting the local cache is only available in development builds.');
	}

	await Dexie.delete(DB_NAME);
}

function currentStatus(): MigrationStatus {
	const version = migrations.at(-1)?.id ?? null;

	return {
		pending: [],
		applied: version ? [{ version, appliedAt: new Date().toISOString() }] : [],
		currentVersion: version
	};
}
