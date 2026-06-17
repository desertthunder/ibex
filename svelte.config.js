import adapter from '@sveltejs/adapter-static';
import * as proc from 'node:child_process';
import * as fs from 'node:fs';
import { mdsvex } from 'mdsvex';

const packageJson = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const buildVersion = buildVersionLabel(packageJson.version);

function getVersion(v) {
	const verify = gitOutput(['rev-parse', '--verify', v]);
	if (verify === null) return v;
	return gitOutput(['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*']);
}

function buildVersionLabel(version) {
	const versionTag = `v${version}`;
	const tag = getVersion(versionTag);
	const count = gitOutput(tag ? ['rev-list', '--count', `${tag}..HEAD`] : ['rev-list', '--count', 'HEAD']) ?? '0';

	if (count === '0') {
		return `v${version}`;
	}

	const commit = gitOutput(['rev-parse', '--short', 'HEAD']) ?? 'unknown';
	return `v${version}-${count}+g${commit}`;
}

function gitOutput(args) {
	try {
		return proc.execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	} catch {
		return null;
	}
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.svx', '.md'],
	preprocess: [mdsvex({ extensions: ['.svx', '.md'] })],
	compilerOptions: { runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true) },
	kit: { adapter: adapter({ fallback: 'index.html' }), version: { name: buildVersion } }
};

export default config;
