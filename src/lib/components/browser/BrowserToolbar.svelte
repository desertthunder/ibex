<script lang="ts">
	type Props = {
		address: string;
		isLoading: boolean;
		canGoBack: boolean;
		canGoForward: boolean;
		canReload: boolean;
		onaddress: (address: string) => void;
		onsubmit: () => void;
		onback: () => void;
		onforward: () => void;
		onreload: () => void;
		onhome: () => void;
	};

	let {
		address,
		isLoading,
		canGoBack,
		canGoForward,
		canReload,
		onaddress,
		onsubmit,
		onback,
		onforward,
		onreload,
		onhome
	}: Props = $props();
</script>

<form
	class="browser-toolbar"
	aria-label="Navigation toolbar"
	onsubmit={(event) => {
		event.preventDefault();
		onsubmit();
	}}>
	<div class="nav-buttons" aria-label="Page navigation">
		<button type="button" disabled={!canGoBack} onclick={onback}>Back</button>
		<button type="button" disabled={!canGoForward} onclick={onforward}>Forward</button>
		<button type="button" disabled={!canReload} onclick={onreload}>Reload</button>
		<button type="button" onclick={onhome}>Home</button>
	</div>

	<label class="location-field">
		<span>Location:</span>
		<input
			value={address}
			aria-label="Lexicon address"
			placeholder="app.bsky.feed.post or at://.../com.atproto.lexicon.schema/..."
			oninput={(event) => onaddress(event.currentTarget.value)} />
	</label>

	<button class="go-button" type="submit" disabled={isLoading}>Go</button>

	<div class="throbber" class:loading={isLoading} aria-label="Loading status">
		<img src="/icons/humanity/apps/web-browser.svg" alt="" width="28" height="28" />
	</div>
</form>

<style>
	.browser-toolbar {
		display: grid;
		grid-template-columns: auto minmax(12rem, 1fr) auto auto;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
		background: linear-gradient(#eee5d4, #cdb690);
		border-bottom: 1px solid #8d704b;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.5) inset;
	}

	.nav-buttons {
		display: flex;
		gap: 2px;
	}

	button {
		min-height: 1.65rem;
		padding: 0 var(--space-2);
		color: #251b13;
		background: linear-gradient(#fffaf0, #d7c6a9);
		border: 1px solid #8d704b;
		border-radius: var(--radius-1);
		box-shadow: var(--shadow-raised);
		font: inherit;
		font-size: var(--text-1);
		cursor: default;
	}

	button:disabled {
		color: #827b70;
		background: #d8c7ab;
		box-shadow: none;
	}

	.location-field {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
		font-size: var(--text-1);
		font-weight: 700;
	}

	input {
		width: 100%;
		min-width: 0;
		height: 1.75rem;
		padding: 0 var(--space-2);
		background: #fffdf7;
		border: 1px solid #8d704b;
		border-radius: var(--radius-1);
		box-shadow: var(--shadow-sunken);
		font: inherit;
		font-family: var(--font-mono);
	}

	.go-button {
		min-width: 3rem;
	}

	.throbber {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border: 1px solid #8d704b;
		background: #f7efe1;
		box-shadow: var(--shadow-sunken);
	}

	.throbber.loading img {
		animation: throb 900ms steps(8) infinite;
	}

	@keyframes throb {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 760px) {
		.browser-toolbar {
			grid-template-columns: 1fr;
		}

		.location-field {
			grid-template-columns: 1fr;
		}
	}
</style>
