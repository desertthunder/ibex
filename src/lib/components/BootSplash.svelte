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
	<div class="boot-orb" aria-hidden="true"></div>
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
		overflow: hidden;
		color: #fff7e8;
		background:
			radial-gradient(circle at 52% 42%, rgb(255 132 34 / 0.28), transparent 0 11rem),
			radial-gradient(circle at 30% 30%, rgb(119 36 87 / 0.72), transparent 0 22rem),
			radial-gradient(circle at 78% 78%, rgb(238 105 16 / 0.28), transparent 0 24rem),
			linear-gradient(145deg, #2c001e 0%, #441134 48%, #230017 100%);
	}

	.boot-splash::before {
		position: absolute;
		inset: 0;
		content: '';
		background-image:
			linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px),
			linear-gradient(90deg, rgb(255 255 255 / 0.025) 1px, transparent 1px);
		background-size: 18px 18px;
		mask-image: radial-gradient(circle at center, black, transparent 78%);
	}

	.boot-orb {
		position: absolute;
		width: min(30rem, 74vw);
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(circle, rgb(255 151 51 / 0.18), transparent 62%);
		box-shadow: 0 0 6rem rgb(255 107 24 / 0.32);
		animation: breathe 2.8s ease-in-out infinite;
	}

	.boot-card {
		position: relative;
		display: grid;
		justify-items: center;
		width: min(24rem, calc(100vw - 2rem));
		padding: var(--space-8) var(--space-6) var(--space-6);
		text-align: center;
		background: linear-gradient(rgb(255 255 255 / 0.08), rgb(0 0 0 / 0.06));
		border: 1px solid rgb(255 229 198 / 0.22);
		border-radius: 10px;
		box-shadow:
			0 2rem 5rem rgb(0 0 0 / 0.38),
			0 1px 0 rgb(255 255 255 / 0.18) inset;
		backdrop-filter: blur(4px);
	}

	.boot-logo {
		width: 6rem;
		height: 6rem;
		padding: var(--space-3);
		border-radius: 1.4rem;
		filter: drop-shadow(0 1rem 1.5rem rgb(0 0 0 / 0.4));
		background: radial-gradient(circle at 38% 32%, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.04));
	}

	.boot-copy {
		margin-top: var(--space-5);
	}

	.boot-kicker {
		color: #f4b15f;
		font-size: var(--text-1);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.55);
	}

	.boot-copy h1 {
		margin-top: var(--space-1);
		font-size: clamp(1.6rem, 4vw, 2.2rem);
		line-height: var(--leading-tight);
		text-shadow: 0 2px 8px rgb(0 0 0 / 0.45);
	}

	.boot-step {
		min-height: 1.3rem;
		margin-top: var(--space-3);
		color: #f0d6c2;
		font-size: var(--text-2);
	}

	.boot-meter {
		position: relative;
		width: min(13rem, 70vw);
		height: 0.55rem;
		margin-top: var(--space-6);
		overflow: hidden;
		background: rgb(24 0 17 / 0.62);
		border: 1px solid rgb(255 255 255 / 0.16);
		border-radius: var(--radius-round);
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.45) inset;
	}

	.boot-meter span {
		position: absolute;
		top: 0;
		bottom: 0;
		left: -45%;
		width: 45%;
		border-radius: inherit;
		background: linear-gradient(90deg, transparent, #f28c22, #ffd08a, transparent);
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
		color: #2c001e;
		font: inherit;
		font-size: var(--text-1);
		font-weight: 700;
		background: linear-gradient(#fff4d8, #d9b06e);
		border: 1px solid #7a481a;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
	}

	.boot-actions button.quiet {
		color: #fff3df;
		background: rgb(255 255 255 / 0.08);
		border-color: rgb(255 255 255 / 0.22);
	}

	@keyframes loading {
		to {
			left: 100%;
		}
	}

	@keyframes breathe {
		50% {
			transform: scale(1.05);
			opacity: 0.82;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.boot-orb,
		.boot-meter span {
			animation: none;
		}

		.boot-meter span {
			left: 0;
			width: 100%;
		}
	}
</style>
