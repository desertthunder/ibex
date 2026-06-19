import { normalizeLexiconInput, resolveLexicon, type LexiconTrace, type ResolvedLexicon } from './lexicon';

class LexiconBrowserState {
	address = $state('');
	activeInput = $state('');
	result = $state<ResolvedLexicon | null>(null);
	error = $state<string | null>(null);
	errorCode = $state<string | null>(null);
	errorTrace = $state<LexiconTrace | null>(null);
	isLoading = $state(false);
	history = $state<string[]>([]);
	historyIndex = $state(-1);

	get activeNsid() {
		return this.result?.nsid ?? this.activeInput;
	}

	get canGoBack() {
		return this.historyIndex > 0;
	}

	get canGoForward() {
		return this.historyIndex >= 0 && this.historyIndex < this.history.length - 1;
	}

	async open(input: string, options: { recordHistory?: boolean } = {}) {
		const recordHistory = options.recordHistory ?? true;
		const normalized = normalizeLexiconInput(input);
		this.address = normalized;
		this.activeInput = normalized;
		this.isLoading = true;
		this.error = null;
		this.errorCode = null;
		this.errorTrace = null;

		try {
			const resolved = await resolveLexicon(normalized);
			this.result = resolved;
			this.address = resolved.nsid;

			if (recordHistory) this.remember(resolved.nsid);
		} catch (unknownError) {
			this.result = null;

			if (unknownError instanceof Error) {
				const details = unknownError as Error & { code?: unknown; trace?: unknown };
				this.error = unknownError.message;
				this.errorCode = details.code ? String(details.code) : 'lookup_error';
				this.errorTrace = details.trace ? (details.trace as LexiconTrace) : null;
			} else {
				this.error = String(unknownError);
				this.errorCode = 'lookup_error';
			}
		} finally {
			this.isLoading = false;
		}
	}

	async reload() {
		const target = this.activeNsid || this.address;
		if (!target) return;

		await this.open(target, { recordHistory: false });
	}

	async goBack() {
		if (!this.canGoBack) return;

		this.historyIndex -= 1;
		const target = this.history[this.historyIndex];
		if (target) await this.open(target, { recordHistory: false });
	}

	async goForward() {
		if (!this.canGoForward) return;

		this.historyIndex += 1;
		const target = this.history[this.historyIndex];
		if (target) await this.open(target, { recordHistory: false });
	}

	clear() {
		this.address = '';
		this.activeInput = '';
		this.result = null;
		this.error = null;
		this.errorCode = null;
		this.errorTrace = null;
		this.isLoading = false;
	}

	private remember(nsid: string) {
		if (this.history[this.historyIndex] === nsid) return;

		const nextHistory = this.history.slice(0, this.historyIndex + 1);
		nextHistory.push(nsid);
		this.history = nextHistory.slice(-25);
		this.historyIndex = this.history.length - 1;
	}
}

export const lexiconBrowser = new LexiconBrowserState();
