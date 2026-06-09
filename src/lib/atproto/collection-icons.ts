export type CollectionIconMatch = { prefix: string; label: string; icon: string };

const atmologoBasePath = '/atmologos/color';

export const collectionIconMatches: readonly CollectionIconMatch[] = [
	{ prefix: 'app.blento.', label: 'Blento', icon: `${atmologoBasePath}/blento.svg` },
	{ prefix: 'app.bsky.', label: 'Bluesky', icon: `${atmologoBasePath}/bluesky.svg` },
	{ prefix: 'at.margin.', label: 'Margin', icon: `${atmologoBasePath}/margin.svg` },
	{ prefix: 'blog.pckt.', label: 'Pckt', icon: `${atmologoBasePath}/pckt.svg` },
	{ prefix: 'dev.npmx.', label: 'npmx', icon: `${atmologoBasePath}/npmx.svg` },
	{ prefix: 'fm.plyr.', label: 'plyr.fm', icon: `${atmologoBasePath}/plyr.fm.svg` },
	{ prefix: 'id.sifa.', label: 'Sifa', icon: `${atmologoBasePath}/sifa%20id.svg` },
	{ prefix: 'net.anisota.', label: 'Anisota', icon: `${atmologoBasePath}/anisota.svg` },
	{ prefix: 'network.cosmik.', label: 'Cosmik', icon: `${atmologoBasePath}/semble.svg` },
	{ prefix: 'pub.leaflet.', label: 'Leaflet', icon: `${atmologoBasePath}/leaflet.svg` },
	{ prefix: 'sh.tangled.', label: 'Tangled', icon: `${atmologoBasePath}/tangled.svg` },
	{ prefix: 'site.standard.', label: 'Standard Site', icon: `${atmologoBasePath}/standard%20site.svg` },
	{ prefix: 'so.sprk.', label: 'Spark', icon: `${atmologoBasePath}/spark.svg` },
	{ prefix: 'social.grain.', label: 'Grain', icon: `${atmologoBasePath}/grain.svg` },
	{ prefix: 'social.popfeed.', label: 'Popfeed', icon: `${atmologoBasePath}/popfeed.svg` }
];

export function collectionIconMatch(collection: string): CollectionIconMatch | null {
	return collectionIconMatches.find((match) => collection.startsWith(match.prefix)) ?? null;
}

export function appLabelForCollection(collection: string): string | null {
	return collectionIconMatch(collection)?.label ?? null;
}
