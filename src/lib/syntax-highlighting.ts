import type { ThemeRegistration } from 'shiki';

export type SyntaxToken = { content: string; color?: string; fontStyle?: number };
export type SyntaxTokenLine = SyntaxToken[];

const themeName = 'ubuntu-iterm2b24';
const ubuntuTheme: ThemeRegistration = {
	name: themeName,
	type: 'dark',
	colors: {
		'editor.background': '#300a24',
		'editor.foreground': '#eeeeec',
		'editorLineNumber.foreground': '#747772',
		'editor.selectionBackground': '#555753'
	},
	settings: [
		{ settings: { foreground: '#eeeeec', background: '#300a24' } },
		{ scope: ['comment'], settings: { foreground: '#747772', fontStyle: 'italic' } },
		{ scope: ['string', 'string.quoted'], settings: { foreground: '#4e9a06' } },
		{ scope: ['constant.numeric', 'constant.language'], settings: { foreground: '#c4a000' } },
		{
			scope: ['support.type.property-name', 'meta.structure.dictionary.key.json string'],
			settings: { foreground: '#729fcf' }
		},
		{ scope: ['punctuation'], settings: { foreground: '#b3b7b0' } },
		{ scope: ['invalid'], settings: { foreground: '#ef2929' } }
	]
};

type JsonTokenizer = (code: string, options: { lang: 'json'; theme: string }) => SyntaxTokenLine[];
let highlighterPromise: Promise<{ codeToTokensBase: JsonTokenizer }> | null = null;

async function getJsonHighlighter() {
	highlighterPromise ??= Promise.all([
		import('@shikijs/core'),
		import('@shikijs/engine-javascript'),
		import('@shikijs/langs/json')
	]).then(async ([core, engine, json]) => {
		const highlighter = await core.createHighlighterCore({
			themes: [ubuntuTheme],
			langs: [json.default],
			engine: engine.createJavaScriptRegexEngine()
		});

		return {
			codeToTokensBase(code: string, options: { lang: 'json'; theme: string }) {
				return highlighter.codeToTokensBase(code, options) as SyntaxTokenLine[];
			}
		};
	});

	return highlighterPromise;
}

export async function highlightJson(code: string): Promise<SyntaxTokenLine[]> {
	const highlighter = await getJsonHighlighter();
	return highlighter.codeToTokensBase(code, { lang: 'json', theme: themeName });
}
