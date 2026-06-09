<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	type Props = {
		step: string;
		error?: string | null;
		canReset?: boolean;
		onretry: () => void;
		onreset: () => void;
		oncontinue: () => void;
	};

	let { step, error = null, canReset = false, onretry, onreset, oncontinue }: Props = $props();
</script>

<section class="boot-splash" aria-label="Starting Intrepid Ibex" aria-busy={error ? 'false' : 'true'}>
	<div class="boot-card">
		<img src={favicon} alt="" class="boot-logo" />
		<div class="boot-copy">
			<p class="boot-kicker">Intrepid Ibex</p>
			<h1>Starting desktop</h1>
			<p class="boot-step">{error ?? step}</p>
		</div>

		{#if error}
			<div class="boot-actions" aria-label="Database startup recovery actions">
				<button type="button" onclick={onretry}>Retry</button>
				{#if canReset}
					<button type="button" onclick={onreset}>Reset local cache</button>
				{/if}
				<button type="button" class="quiet" onclick={oncontinue}>Continue without cache</button>
			</div>
		{:else}
			<div class="boot-meter" aria-hidden="true"><span></span></div>
		{/if}
	</div>
</section>

<style>
	.boot-splash {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: grid;
		place-items: center;
		color: #eeeeec;
		background: #300a24;
	}

	.boot-card {
		display: grid;
		justify-items: center;
		width: min(24rem, calc(100vw - 2rem));
		padding: var(--space-8) var(--space-6);
		text-align: center;
	}

	.boot-logo {
		width: 6rem;
		height: 6rem;
		color: #e95420;
		filter: drop-shadow(0 0.35rem 0.75rem rgb(0 0 0 / 0.28));
	}

	.boot-copy {
		margin-top: var(--space-5);
	}

	.boot-kicker,
	.boot-copy h1 {
		color: #e95420;
	}

	.boot-kicker {
		font-size: var(--text-1);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.boot-copy h1 {
		margin-top: var(--space-1);
		font-size: clamp(1.6rem, 4vw, 2.2rem);
		line-height: var(--leading-tight);
	}

	.boot-step {
		min-height: 1.3rem;
		margin-top: var(--space-3);
		color: #eeeeec;
		font-size: var(--text-2);
	}

	.boot-meter {
		position: relative;
		width: min(13rem, 70vw);
		height: 0.45rem;
		margin-top: var(--space-6);
		overflow: hidden;
		background: rgb(238 238 236 / 0.18);
		border-radius: var(--radius-round);
	}

	.boot-meter span {
		position: absolute;
		top: 0;
		bottom: 0;
		left: -45%;
		width: 45%;
		border-radius: inherit;
		background: #e95420;
		animation: loading 1.35s ease-in-out infinite;
	}

	.boot-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-2);
		margin-top: var(--space-5);
	}

	.boot-actions button {
		padding: 0.45rem 0.75rem;
		color: #eeeeec;
		font: inherit;
		font-size: var(--text-1);
		font-weight: 700;
		background: #e95420;
		border: 1px solid #e95420;
		border-radius: var(--radius-2);
	}

	.boot-actions button.quiet {
		color: #eeeeec;
		background: transparent;
		border-color: rgb(238 238 236 / 0.45);
	}

	@keyframes loading {
		to {
			left: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.boot-meter span {
			left: 0;
			width: 100%;
			animation: none;
		}
	}
</style>
