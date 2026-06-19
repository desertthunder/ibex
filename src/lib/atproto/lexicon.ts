export const LEXDNS_API_BASE = 'https://lex.desertthunder.dev/api/resolve';

export type ParsedLexiconNsid = { nsid: string; authority: string; domain: string; name: string; dnsName: string };

export type LexiconDocument = {
	$type?: string;
	lexicon: 1;
	id: string;
	defs: Record<string, LexiconDefinition>;
	[key: string]: unknown;
};

export type LexiconDefinition = {
	type?: string;
	description?: string;
	key?: string;
	required?: string[];
	record?: LexiconObject;
	parameters?: LexiconObject;
	input?: LexiconEncoding;
	output?: LexiconEncoding;
	properties?: Record<string, LexiconProperty>;
	refs?: string[];
	ref?: string;
	knownValues?: string[];
	[key: string]: unknown;
};

export type LexiconObject = {
	type?: string;
	required?: string[];
	properties?: Record<string, LexiconProperty>;
	[key: string]: unknown;
};

export type LexiconEncoding = { encoding?: string; schema?: LexiconObject; [key: string]: unknown };

export type LexiconProperty = {
	type?: string;
	description?: string;
	format?: string;
	ref?: string;
	refs?: string[];
	items?: LexiconProperty;
	knownValues?: string[];
	required?: string[];
	properties?: Record<string, LexiconProperty>;
	[key: string]: unknown;
};

export type LexiconTrace = {
	dnsName: string | null;
	txtRecords: Array<{ name: string; data: string; ttl?: number }>;
	selectedDid: string | null;
	didDocument: { url: string | null; status: number | null };
	pdsEndpoint: string | null;
	repoGetRecord: { url: string | null; status: number | null };
	final: { success: boolean; code?: string; message: string };
};

export type ResolvedLexicon = {
	version: string;
	nsid: string;
	parsed: ParsedLexiconNsid;
	hash: string;
	fetchedAt: string;
	source: { name: string; url: string };
	lexicon: LexiconDocument;
	cache: 'hit' | 'miss';
	trace: LexiconTrace;
	_links: { self: { href: string }; source: { href: string } };
};

export type LexiconApiError = { version?: string; error: { code: string; message: string }; trace?: LexiconTrace };

export class LexiconResolveError extends Error {
	constructor(
		readonly status: number,
		readonly code: string,
		message: string,
		readonly trace: LexiconTrace | null
	) {
		super(message);
		this.name = 'LexiconResolveError';
	}
}

export async function resolveLexicon(input: string, fetcher: typeof fetch = fetch): Promise<ResolvedLexicon> {
	const nsid = normalizeLexiconInput(input);
	const response = await fetcher(lexiconApiUrl(nsid), { headers: { accept: 'application/json' } });
	const body = (await response.json()) as ResolvedLexicon | LexiconApiError;

	if (!response.ok || isLexiconApiError(body)) {
		const apiError = isLexiconApiError(body)
			? body.error
			: { code: 'upstream_error', message: `Lexicon lookup failed with ${response.status}` };
		throw new LexiconResolveError(response.status, apiError.code, apiError.message, body.trace ?? null);
	}

	return body;
}

export function lexiconApiUrl(nsid: string) {
	return `${LEXDNS_API_BASE}/${encodeURIComponent(nsid)}`;
}

export function lexiconPath(input: string) {
	return `/lexicons/${encodeURIComponent(normalizeLexiconInput(input))}`;
}

export function normalizeLexiconInput(input: string) {
	const trimmed = input.trim();
	if (!trimmed) throw new Error('Enter an NSID or Lexicon record URL.');

	const withoutHash = trimmed.split('#', 1)[0] ?? trimmed;

	if (withoutHash.startsWith('at://')) {
		const nsid = nsidFromAtUri(withoutHash);
		if (nsid) return nsid;
	}

	if (/^https?:\/\//i.test(withoutHash)) {
		const nsid = nsidFromUrl(withoutHash);
		if (nsid) return nsid;
	}

	const nsid = withoutHash.replace(/^\/lexicons\//, '');
	return decodeURIComponent(nsid);
}

function nsidFromAtUri(input: string) {
	const withoutProtocol = input.slice('at://'.length);
	const [, collection, rkey] = withoutProtocol.split('/');
	if (collection === 'com.atproto.lexicon.schema' && rkey) return decodeURIComponent(rkey);
	return null;
}

function nsidFromUrl(input: string) {
	try {
		const url = new URL(input);
		const apiMatch = url.pathname.match(/\/api\/resolve\/([^/]+)$/);
		if (apiMatch?.[1]) return decodeURIComponent(apiMatch[1]);

		const routeMatch = url.pathname.match(/\/lexicons\/([^/]+)$/);
		if (routeMatch?.[1]) return decodeURIComponent(routeMatch[1]);

		const queryNsid = url.searchParams.get('nsid');
		if (queryNsid) return queryNsid;
	} catch {
		return null;
	}

	return null;
}

function isLexiconApiError(value: unknown): value is LexiconApiError {
	return (
		typeof value === 'object' &&
		value !== null &&
		'error' in value &&
		typeof (value as LexiconApiError).error?.message === 'string'
	);
}
