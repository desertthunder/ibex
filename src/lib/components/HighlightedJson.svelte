<script lang="ts">
	import { highlightJson, type SyntaxTokenLine } from '$lib/syntax-highlighting';

	type Props = { code: string };
	let { code }: Props = $props();

	let tokenLines = $state<SyntaxTokenLine[]>([]);
	let highlightedCode = $state('');

	$effect(() => {
		const source = code;
		let cancelled = false;

		void highlightJson(source).then(
			(lines) => {
				if (cancelled) return;
				tokenLines = lines;
				highlightedCode = source;
			},
			() => {
				if (cancelled) return;
				tokenLines = [];
				highlightedCode = '';
			}
		);

		return () => {
			cancelled = true;
		};
	});
</script>

<code class="highlighted-json"
	>{#if highlightedCode === code}{#each tokenLines as line, lineIndex (`${lineIndex}-${line.map((token) => token.content).join('')}`)}<span
				class="syntax-line"
				>{#each line as token, tokenIndex (`${lineIndex}-${tokenIndex}`)}<span style:color={token.color}
						>{token.content}</span
					>{/each}</span
			>{/each}{:else}{code}{/if}</code>

<style>
	.highlighted-json {
		font: inherit;
	}

	.syntax-line {
		display: block;
		min-height: 1.45em;
	}
</style>
