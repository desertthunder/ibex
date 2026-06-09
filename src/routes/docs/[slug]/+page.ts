import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

const documents = import.meta.glob('../*.md');

function slugFromPath(path: string) {
	return path
		.split('/')
		.at(-1)
		?.replace(/\.md$/, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

const documentSlugs = Object.keys(documents).map((path) => slugFromPath(path)).filter(Boolean) as string[];

export const entries: EntryGenerator = () => {
	return documentSlugs.map((slug) => ({ slug }));
};

export const load: PageLoad = ({ params }) => {
	if (!documentSlugs.includes(params.slug)) {
		error(404, 'Document not found');
	}

	return { slug: params.slug };
};
