import adapter from '@sveltejs/adapter-static';
import * as proc from 'node:child_process';
import * as fs from 'node:fs';
import { mdsvex } from 'mdsvex';

const packageJson = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const buildVersion = buildVersionDetails(packageJson.version);

function getVersion(v) {
	const verify = gitOutput(['rev-parse', '--verify', v]);
	if (verify === null) return v;
	return gitOutput(['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*']);
}

function buildVersionDetails(version) {
	const versionTag = `v${version}`;
	const tag = getVersion(versionTag) ?? versionTag;
	const count = gitOutput(tag ? ['rev-list', '--count', `${tag}..HEAD`] : ['rev-list', '--count', 'HEAD']) ?? '0';
	const commit = gitOutput(['rev-parse', 'HEAD']) ?? 'unknown';
	const shortCommit = gitOutput(['rev-parse', '--short', 'HEAD']) ?? 'unknown';
	const display = count === '0' ? versionTag : `${versionTag}-${count}+g${shortCommit}`;
	return { display, commit, version: tag };
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
	kit: { adapter: adapter({ fallback: 'index.html' }), version: { name: JSON.stringify(buildVersion) } }
};

export default config;
