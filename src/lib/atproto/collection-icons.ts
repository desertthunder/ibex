import type { CollectionIconMatch } from './types';

enum BasePath {
	atmologo = '/atmologos/color',
	namespace = '/icons/namespaces'
}

const namespaceIcon = (ns: string) => `${BasePath.namespace}/${ns.replaceAll('.', '/')}/icon.svg`;

export const collectionIconMatches: readonly CollectionIconMatch[] = [
	{ prefix: 'chat.bsky.', label: 'Bluesky', icon: `${BasePath.atmologo}/bluesky.svg` },
	{ prefix: 'app.blento.', label: 'Blento', icon: `${BasePath.atmologo}/blento.svg` },
	{ prefix: 'app.bsky.', label: 'Bluesky', icon: `${BasePath.atmologo}/bluesky.svg` },
	{ prefix: 'at.inlay.', label: 'Inlay', icon: namespaceIcon('at.inlay') },
	{ prefix: 'at.margin.', label: 'Margin', icon: `${BasePath.atmologo}/margin.svg` },
	{ prefix: 'blog.pckt.', label: 'Pckt', icon: `${BasePath.atmologo}/pckt.svg` },
	{ prefix: 'com.atproto.', label: 'ATProto', icon: namespaceIcon('com.atproto') },
	{ prefix: 'com.germnetwork.', label: 'Germ', icon: namespaceIcon('com.germnetwork') },
	{ prefix: 'community.lexicon.', label: 'Community', icon: namespaceIcon('com.atproto') },
	{ prefix: 'computer.aetheros.', label: 'Aether OS', icon: namespaceIcon('computer.aetheros') },
	{ prefix: 'dev.npmx.', label: 'npmx', icon: `${BasePath.atmologo}/npmx.svg` },
	{ prefix: 'fm.plyr.', label: 'plyr.fm', icon: `${BasePath.atmologo}/plyr.fm.svg` },
	{ prefix: 'id.sifa.', label: 'Sifa', icon: `${BasePath.atmologo}/sifa%20id.svg` },
	{ prefix: 'net.anisota.', label: 'Anisota', icon: `${BasePath.atmologo}/anisota.svg` },
	{ prefix: 'network.cosmik.', label: 'Cosmik', icon: `${BasePath.atmologo}/semble.svg` },
	{ prefix: 'pub.leaflet.', label: 'Leaflet', icon: `${BasePath.atmologo}/leaflet.svg` },
	{ prefix: 'sh.tangled.', label: 'Tangled', icon: `${BasePath.atmologo}/tangled.svg` },
	{ prefix: 'site.standard.', label: 'Standard Site', icon: `${BasePath.atmologo}/standard%20site.svg` },
	{ prefix: 'so.sprk.', label: 'Spark', icon: `${BasePath.atmologo}/spark.svg` },
	{ prefix: 'social.grain.', label: 'Grain', icon: `${BasePath.atmologo}/grain.svg` },
	{ prefix: 'social.popfeed.', label: 'Popfeed', icon: `${BasePath.atmologo}/popfeed.svg` }
];

export function collectionIconMatch(collection: string): CollectionIconMatch | null {
	return (
		collectionIconMatches
			.filter((match) => collection.startsWith(match.prefix))
			.sort((a, b) => b.prefix.length - a.prefix.length)[0] ?? null
	);
}

export function appLabelForCollection(collection: string): string | null {
	return collectionIconMatch(collection)?.label ?? null;
}
