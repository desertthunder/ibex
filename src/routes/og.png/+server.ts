import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import Opengraph from '$lib/components/Opengraph.svelte';
import satori from 'satori';
import { html } from 'satori-html';
import { render } from 'svelte/server';

export const prerender = true;

const width = 1200;
const height = 630;

const staticPath = (file: string) => join(process.cwd(), 'static', file);

const toArrayBuffer = (buffer: Buffer): ArrayBuffer =>
	buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

const toDataUri = (mimeType: string, buffer: Buffer): string => `data:${mimeType};base64,${buffer.toString('base64')}`;

const stripSvelteComments = (value: string) => value.replace(/<!--[\s\S]*?-->/g, '');

export async function GET() {
	const [ubuntu, ubuntuBold, ubuntuMono, ubuntuMonoBold, browserIcon] = await Promise.all([
		readFile(staticPath('og/fonts/ubuntu-latin-400-normal.woff')).then(toArrayBuffer),
		readFile(staticPath('og/fonts/ubuntu-latin-700-normal.woff')).then(toArrayBuffer),
		readFile(staticPath('og/fonts/ubuntu-mono-latin-400-normal.woff')).then(toArrayBuffer),
		readFile(staticPath('og/fonts/ubuntu-mono-latin-700-normal.woff')).then(toArrayBuffer),
		readFile(staticPath('icons/humanity/apps/web-browser.svg')).then((buffer) => toDataUri('image/svg+xml', buffer))
	]);

	const { body } = render(Opengraph, { props: { browserIcon, width, height } });
	const markup = html(stripSvelteComments(body));

	const svg = await satori(markup, {
		width,
		height,
		fonts: [
			{ name: 'Ubuntu Sans', data: ubuntu, weight: 400, style: 'normal' },
			{ name: 'Ubuntu Sans', data: ubuntuBold, weight: 700, style: 'normal' },
			{ name: 'Ubuntu Mono', data: ubuntuMono, weight: 400, style: 'normal' },
			{ name: 'Ubuntu Mono', data: ubuntuMonoBold, weight: 700, style: 'normal' }
		]
	});

	const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();

	return new Response(toArrayBuffer(png), {
		headers: { 'content-type': 'image/png', 'cache-control': 'public, immutable, max-age=31536000' }
	});
}
