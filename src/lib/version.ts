import { version as VERSION } from '$app/environment';
import { REPO_URL } from './constants';

export type BuildVersion = { display: string; commit: string; version: string };

const fallbackVersion: BuildVersion = { display: VERSION, commit: 'unknown', version: VERSION };

function isBuildVersion(value: unknown): value is BuildVersion {
	if (!value || typeof value !== 'object') return false;

	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.display === 'string' &&
		typeof candidate.commit === 'string' &&
		typeof candidate.version === 'string'
	);
}

function parseBuildVersion(value: string): BuildVersion {
	try {
		const parsed: unknown = JSON.parse(value);
		if (isBuildVersion(parsed)) return parsed;
	} catch (err) {
		console.warn(err instanceof Error ? err.message : String(err));
	}

	return fallbackVersion;
}

export const buildVersion = parseBuildVersion(VERSION);

export const buildCommitUrl = `${REPO_URL}/commit/${buildVersion.commit}`;
