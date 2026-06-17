/** Move to test/inspector.test.ts */
import { describe, expect, it } from 'vitest';
import {
	findHandleAlias,
	findPdsEndpoint,
	inspectIdentity,
	normalizeHandle,
	resolveDidDocumentUrl,
	validateHandle
} from './identity-inspector';
import type { DidDocument } from './types';

describe('identity inspector helpers', () => {
	it('resolves supported DID document URLs', () => {
		expect(resolveDidDocumentUrl('did:plc:xg2vq45muivyy3xwatcehspu')).toBe(
			'https://plc.directory/did%3Aplc%3Axg2vq45muivyy3xwatcehspu'
		);
		expect(resolveDidDocumentUrl('did:web:example.com:user')).toBe('https://example.com/user/.well-known/did.json');
	});

	it('normalizes handle aliases and PDS services', () => {
		expect(normalizeHandle('@DesertThunder.Dev')).toBe('desertthunder.dev');
		expect(findHandleAlias(['at://desertthunder.dev'])).toBe('desertthunder.dev');
		expect(
			findPdsEndpoint([
				{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: 'https://pds.example.com' }
			])
		).toBe('https://pds.example.com');
	});

	it('classifies handle validation responses', async () => {
		const client = {
			get: async (name: string, _init?: unknown) => {
				if (name === 'com.atproto.identity.resolveHandle') {
					return { ok: true, data: { did: 'did:plc:example' } };
				}

				throw new Error('Unexpected XRPC call');
			}
		};
		const fetcher = async (input: RequestInfo | URL) => {
			const url = String(input);

			if (url.includes('/.well-known/atproto-did')) {
				return new Response('did:plc:other');
			}

			return Response.json({ Answer: [{ data: '"did=did:plc:example"' }] });
		};

		const validation = await validateHandle('desertthunder.dev', 'did:plc:example', client, fetcher);

		expect(validation.resolveHandle.status).toBe('valid');
		expect(validation.wellKnown.status).toBe('mismatch');
		expect(validation.dnsTxt.status).toBe('valid');
	});

	it('builds an inspection model from atcute DID resolution and PLC audit', async () => {
		const didDocument: DidDocument = {
			id: 'did:plc:example',
			alsoKnownAs: ['at://desertthunder.dev'],
			verificationMethod: [
				{
					id: 'did:plc:example#atproto',
					type: 'Multikey',
					controller: 'did:plc:example',
					publicKeyMultibase: 'zExample'
				}
			],
			service: [{ id: '#atproto_pds', type: 'AtprotoPersonalDataServer', serviceEndpoint: 'https://pds.example.com' }]
		};
		const client = {
			get: async (name: string, _init?: unknown) => {
				if (name === 'com.atproto.identity.resolveDid') {
					return { ok: true, data: { didDoc: didDocument } };
				}

				if (name === 'com.atproto.identity.resolveHandle') {
					return { ok: true, data: { did: 'did:plc:example' } };
				}

				throw new Error('Unexpected XRPC call');
			}
		};
		const fetcher = async (input: RequestInfo | URL) => {
			const url = String(input);

			if (url.endsWith('/log/audit')) {
				return Response.json([
					{
						cid: 'bafyold',
						nullified: false,
						createdAt: '2024-01-01T00:00:00.000Z',
						operation: { rotationKeys: ['did:key:old'] }
					},
					{
						cid: 'bafynew',
						nullified: false,
						createdAt: '2024-02-01T00:00:00.000Z',
						operation: { rotationKeys: ['did:key:new'] }
					}
				]);
			}

			if (url.includes('/.well-known/atproto-did')) {
				return new Response('did:plc:example');
			}

			return Response.json({ Answer: [] });
		};

		const inspection = await inspectIdentity('did:plc:example', null, { client, fetcher });

		expect(inspection.handle).toBe('desertthunder.dev');
		expect(inspection.pds).toBe('https://pds.example.com');
		expect(inspection.rotationKeys).toEqual(['did:key:new']);
		expect(inspection.handleValidation?.wellKnown.status).toBe('valid');
	});
});
