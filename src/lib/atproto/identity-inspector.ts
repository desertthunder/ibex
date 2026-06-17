/** TODO: this should be identity/inspector.ts */
import { Client, simpleFetchHandler } from '@atcute/client';
import type { Did, Handle } from '@atcute/lexicons/syntax';
import type {} from '@atcute/atproto';
import type { DidDocument, DidService, DidVerificationMethod } from './types';

export type IdentityValidationStatus = 'valid' | 'mismatch' | 'unavailable' | 'unsupported';

export type HandleValidation = {
	handle: string;
	resolveHandle: IdentityCheck;
	wellKnown: IdentityCheck;
	dnsTxt: IdentityCheck;
};

export type IdentityCheck = { status: IdentityValidationStatus; label: string; detail: string; value: string | null };

export type PlcAuditEntry = {
	cid: string;
	createdAt: string;
	nullified: boolean;
	operation: {
		alsoKnownAs?: string[];
		rotationKeys?: string[];
		verificationMethods?: Record<string, string>;
		services?: Record<string, { type?: string; endpoint?: string }>;
	};
};

export type IdentityInspection = {
	did: string;
	handle: string | null;
	didDocument: DidDocument;
	aliases: string[];
	services: DidService[];
	verificationMethods: DidVerificationMethod[];
	rotationKeys: string[];
	pds: string | null;
	didDocumentUrl: string;
	plcAuditUrl: string | null;
	handleValidation: HandleValidation | null;
	rawJson: string;
};

type IdentityClient = { get: (name: string, init?: unknown) => Promise<unknown> };

export type ResolveDidDocumentOptions = { client?: IdentityClient; fetcher?: typeof fetch };

type InspectIdentityOptions = ResolveDidDocumentOptions;

const publicApi = new Client({ handler: simpleFetchHandler({ service: 'https://public.api.bsky.app' }) });
const publicIdentityApi = publicApi as unknown as IdentityClient;

export async function inspectIdentity(
	did: string,
	fallbackHandle: string | null = null,
	options: InspectIdentityOptions = {}
): Promise<IdentityInspection> {
	if (!did.startsWith('did:')) {
		throw new Error('Identity Inspector requires a DID.');
	}

	const client = options.client ?? publicIdentityApi;
	const fetcher = options.fetcher ?? fetch;
	const didDocumentUrl = resolveDidDocumentUrl(did);
	const didDocument = await resolveDidDocument(did, { client, fetcher });
	const aliases = didDocument.alsoKnownAs ?? [];
	const handle = findHandleAlias(aliases) ?? normalizeHandle(fallbackHandle);
	const services = didDocument.service ?? [];
	const verificationMethods = didDocument.verificationMethod ?? [];
	const pds = findPdsEndpoint(services);
	const audit = did.startsWith('did:plc:') ? await fetchPlcAudit(did, fetcher).catch(() => []) : [];
	const latestOperation = audit.at(-1)?.operation;
	const rotationKeys = latestOperation?.rotationKeys ?? [];

	return {
		did,
		handle,
		didDocument,
		aliases,
		services,
		verificationMethods,
		rotationKeys,
		pds,
		didDocumentUrl,
		plcAuditUrl: did.startsWith('did:plc:') ? `${didDocumentUrl}/log/audit` : null,
		handleValidation: handle ? await validateHandle(handle, did, client, fetcher) : null,
		rawJson: JSON.stringify(didDocument, null, 2)
	};
}

export async function validateHandle(
	handle: string,
	did: string,
	client: IdentityClient = publicIdentityApi,
	fetcher: typeof fetch = fetch
): Promise<HandleValidation> {
	const normalizedHandle = normalizeHandle(handle);

	if (!normalizedHandle) {
		throw new Error('Handle is empty.');
	}

	const [resolveHandle, wellKnown, dnsTxt] = await Promise.all([
		validateResolveHandle(normalizedHandle, did, client),
		validateWellKnown(normalizedHandle, did, fetcher),
		validateDnsTxt(normalizedHandle, did, fetcher)
	]);

	return { handle: normalizedHandle, resolveHandle, wellKnown, dnsTxt };
}

export function resolveDidDocumentUrl(did: string) {
	if (did.startsWith('did:plc:')) {
		return `https://plc.directory/${encodeURIComponent(did)}`;
	}

	if (did.startsWith('did:web:')) {
		const domain = did.slice('did:web:'.length).replaceAll(':', '/');
		return `https://${domain}/.well-known/did.json`;
	}

	throw new Error(`Unsupported DID method: ${did}`);
}

export function findPdsEndpoint(services: DidService[]) {
	const pdsService = services.find(
		(service) => service.id === '#atproto_pds' || service.type === 'AtprotoPersonalDataServer'
	);
	const endpoint = pdsService?.serviceEndpoint;

	return typeof endpoint === 'string' ? endpoint : null;
}

export function findHandleAlias(aliases: string[]) {
	const alias = aliases.find((value) => value.startsWith('at://'));
	return alias ? normalizeHandle(alias.slice('at://'.length)) : null;
}

export function normalizeHandle(handle: string | null | undefined) {
	const normalized = handle?.trim().replace(/^@/, '').toLowerCase();
	return normalized || null;
}

export async function resolveDidDocument(did: string, options: ResolveDidDocumentOptions = {}): Promise<DidDocument> {
	const client = options.client ?? publicIdentityApi;
	const fetcher = options.fetcher ?? fetch;

	try {
		const result = unwrapXrpcData(
			await client.get('com.atproto.identity.resolveDid', { params: { did: did as Did } })
		) as { didDoc: unknown };
		return result.didDoc as DidDocument;
	} catch {
		const response = await fetcher(resolveDidDocumentUrl(did));

		if (!response.ok) {
			throw new Error(`Could not fetch DID document (${response.status}).`);
		}

		return (await response.json()) as DidDocument;
	}
}

async function validateResolveHandle(handle: string, did: string, client: IdentityClient): Promise<IdentityCheck> {
	try {
		const result = unwrapXrpcData(
			await client.get('com.atproto.identity.resolveHandle', { params: { handle: handle as Handle } })
		) as { did: string };
		const status = result.did === did ? 'valid' : 'mismatch';

		return {
			status,
			label: 'XRPC resolveHandle',
			detail:
				status === 'valid'
					? 'Public ATProto resolver matches this DID.'
					: 'Public ATProto resolver returned a different DID.',
			value: result.did
		};
	} catch {
		return unavailableCheck('XRPC resolveHandle', 'Could not resolve this handle through public.api.bsky.app.');
	}
}

async function validateWellKnown(handle: string, did: string, fetcher: typeof fetch): Promise<IdentityCheck> {
	try {
		const response = await fetcher(`https://${handle}/.well-known/atproto-did`);

		if (!response.ok) {
			return unavailableCheck('.well-known', `HTTP ${response.status} from the handle well-known endpoint.`);
		}

		const value = (await response.text()).trim();
		const status = value === did ? 'valid' : 'mismatch';

		return {
			status,
			label: '.well-known',
			detail:
				status === 'valid'
					? 'Handle well-known file asserts this DID.'
					: 'Endpoint responded, but did not assert this DID.',
			value: value.slice(0, 160)
		};
	} catch {
		return unavailableCheck('.well-known', 'Could not fetch the handle well-known endpoint.');
	}
}

async function validateDnsTxt(handle: string, did: string, fetcher: typeof fetch): Promise<IdentityCheck> {
	try {
		const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(`_atproto.${handle}`)}&type=TXT`;
		const response = await fetcher(url, { headers: { accept: 'application/dns-json' } });

		if (!response.ok) {
			return unavailableCheck('DNS TXT', `DNS-over-HTTPS returned HTTP ${response.status}.`);
		}

		const data = (await response.json()) as { Answer?: Array<{ data?: string }> };
		const values = data.Answer?.map((answer) => answer.data ?? '').map(stripDnsTxtQuotes) ?? [];
		const assertion = values.find((value) => value.startsWith('did='));

		if (!assertion) {
			return unavailableCheck('DNS TXT', 'No _atproto TXT DID assertion was found.');
		}

		const value = assertion.slice('did='.length);
		const status = value === did ? 'valid' : 'mismatch';

		return {
			status,
			label: 'DNS TXT',
			detail: status === 'valid' ? 'DNS TXT record asserts this DID.' : 'DNS TXT record asserts a different DID.',
			value
		};
	} catch {
		return unavailableCheck('DNS TXT', 'Could not query DNS-over-HTTPS for this handle.');
	}
}

async function fetchPlcAudit(did: string, fetcher: typeof fetch): Promise<PlcAuditEntry[]> {
	const response = await fetcher(`${resolveDidDocumentUrl(did)}/log/audit`);

	if (!response.ok) {
		return [];
	}

	return (await response.json()) as PlcAuditEntry[];
}

function unavailableCheck(label: string, detail: string): IdentityCheck {
	return { status: 'unavailable', label, detail, value: null };
}

function stripDnsTxtQuotes(value: string) {
	return value.replace(/^"|"$/g, '').replaceAll('" "', '');
}

function unwrapXrpcData(response: unknown) {
	if (typeof response !== 'object' || response === null) {
		throw new Error('Invalid XRPC response.');
	}

	if (!('ok' in response) || response.ok !== true || !('data' in response)) {
		throw new Error('XRPC request failed.');
	}

	return response.data;
}
