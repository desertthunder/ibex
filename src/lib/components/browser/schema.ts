import type { LexiconDefinition, LexiconProperty } from '$lib/atproto/lexicon';

export type LexiconDefRow = {
	name: string;
	type: string;
	description: string;
	required: string[];
	properties: Array<{ name: string; type: string; description: string }>;
	refs: string[];
};

export function defRows(defs: Record<string, LexiconDefinition>): LexiconDefRow[] {
	return Object.entries(defs).map(([name, def]) => {
		const object = def.record ?? def.parameters ?? def.input?.schema ?? def.output?.schema ?? def;
		const properties = Object.entries(object.properties ?? {}).map(([propertyName, property]) => ({
			name: propertyName,
			type: propertyType(property),
			description: property.description ?? ''
		}));

		return {
			name,
			type: def.type ?? object.type ?? 'definition',
			description: def.description ?? '',
			required: object.required ?? def.required ?? [],
			properties,
			refs: refsForDefinition(def)
		};
	});
}

export function referenceNsid(ref: string) {
	const [nsid] = ref.split('#');
	if (!nsid) return null;
	if (nsid.startsWith('#')) return null;
	if (!nsid.includes('.')) return null;
	return nsid;
}

function propertyType(property: LexiconProperty): string {
	if (property.ref) return property.ref;
	if (property.refs) return property.refs.join(' | ');
	if (property.type === 'array' && property.items) return `array<${propertyType(property.items)}>`;
	if (property.format) return `${property.type ?? 'value'}:${property.format}`;
	return property.type ?? 'unknown';
}

function refsForDefinition(def: LexiconDefinition) {
	const refs = new Set<string>();
	collectRefs(def, refs);
	return [...refs].sort();
}

function collectRefs(value: unknown, refs: Set<string>) {
	if (Array.isArray(value)) {
		for (const item of value) collectRefs(item, refs);
		return;
	}

	if (typeof value !== 'object' || value === null) return;

	const record = value as Record<string, unknown>;
	if (typeof record.ref === 'string') refs.add(record.ref);
	if (Array.isArray(record.refs)) {
		for (const ref of record.refs) {
			if (typeof ref === 'string') refs.add(ref);
		}
	}

	for (const child of Object.values(record)) collectRefs(child, refs);
}
