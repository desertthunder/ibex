import adapter from '@sveltejs/adapter-static';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx', '.md'],
	preprocess: [mdsvex({ extensions: ['.svx', '.md'] })],
	compilerOptions: { runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true) },
	kit: { adapter: adapter() }
};

export default config;
