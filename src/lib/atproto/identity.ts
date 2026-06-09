import { Client, ok, simpleFetchHandler } from '@atcute/client';
import type { ActorIdentifier } from '@atcute/lexicons/syntax';
import type { Handle } from '@atcute/lexicons/syntax';
import type {} from '@atcute/atproto';
import type {} from '@atcute/bluesky';
import type { AccountIdentity, ActorTypeaheadResult, DidDocument } from './types';

export type { AccountIdentity, ActorTypeaheadResult } from './types';

export const defaultIdentity = { handle: 'desertthunder.dev', did: 'did:plc:xg2vq45muivyy3xwatcehspu' };

const publicApi = new Client({ handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' }) });

export async function resolveAccount(handle: string): Promise<AccountIdentity> {
	const normalizedHandle = handle.trim().replace(/^@/, '').toLowerCase();

	if (!normalizedHandle) {
		throw new Error('Enter an AT Protocol handle.');
	}

	if (!normalizedHandle.includes('.')) {
		throw new Error('Handles should look like a domain, for example desertthunder.dev.');
	}

	const identity = await ok(
		publicApi.get('com.atproto.identity.resolveHandle', { params: { handle: normalizedHandle as Handle } })
	);

	return hydratePublicIdentity(identity.did, normalizedHandle);
}

export async function searchActorsTypeahead(query: string, limit = 6): Promise<ActorTypeaheadResult[]> {
	const normalizedQuery = query.trim().replace(/^@/, '');

	if (!normalizedQuery) {
		return [];
	}

	const result = await ok(
		publicApi.get('app.bsky.actor.searchActorsTypeahead', { params: { q: normalizedQuery, limit } })
	);

	return result.actors.map((actor) => ({
		handle: actor.handle,
		did: actor.did,
		displayName: actor.displayName ?? null,
		avatar: actor.avatar ?? null
	}));
}

export async function hydratePublicIdentity(did: string, fallbackHandle = did): Promise<AccountIdentity> {
	if (!did.startsWith('did:')) {
		throw new Error('Record routes must include a DID.');
	}

	const [profile, pds] = await Promise.all([
		getPublicProfile(did).catch(() => null),
		resolvePds(did).catch(() => null)
	]);
	const handle = profile?.handle ?? fallbackHandle;

	return {
		handle,
		did,
		pds,
		displayName: profile?.displayName ?? null,
		avatar: profile?.avatar ?? null,
		description: profile?.description ?? null
	};
}

async function getPublicProfile(actor: string) {
	const response = await publicApi.get('app.bsky.actor.getProfile', { params: { actor: actor as ActorIdentifier } });

	return response.ok ? response.data : null;
}

async function resolvePds(did: string): Promise<string | null> {
	const response = await fetch(resolveDidDocumentUrl(did));

	if (!response.ok) {
		return null;
	}

	const document = (await response.json()) as DidDocument;
	const pdsService = document.service?.find(
		(service) => service.id === '#atproto_pds' || service.type === 'AtprotoPersonalDataServer'
	);
	const endpoint = pdsService?.serviceEndpoint;

	return typeof endpoint === 'string' ? endpoint : null;
}

function resolveDidDocumentUrl(did: string) {
	if (did.startsWith('did:plc:')) {
		return `https://plc.directory/${encodeURIComponent(did)}`;
	}

	if (did.startsWith('did:web:')) {
		const domain = did.slice('did:web:'.length).replaceAll(':', '/');
		return `https://${domain}/.well-known/did.json`;
	}

	throw new Error(`Unsupported DID method: ${did}`);
}
