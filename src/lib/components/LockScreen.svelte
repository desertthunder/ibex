<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import type { AccountIdentity } from '$lib/atproto/types';

	type Props = { identity: AccountIdentity | null; onunlock: () => void };

	let { identity, onunlock }: Props = $props();
	let now = $state(new Date());

	const displayName = $derived(identity ? `@${identity.handle}` : 'Intrepid Ibex');
	const time = $derived(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
	const date = $derived(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));

	onMount(() => {
		const interval = window.setInterval(() => {
			now = new Date();
		}, 1000);

		return () => window.clearInterval(interval);
	});
</script>

<section class="lock-screen" aria-label="Screen locked">
	<div class="lock-card">
		<div class="lock-clock" aria-live="polite">
			<time datetime={now.toISOString()}>{time}</time>
			<p>{date}</p>
		</div>

		<div class="lock-user">
			{#if identity?.avatar}
				<img class="lock-avatar" src={identity.avatar} alt="" width="56" height="56" />
			{:else}
				<img class="lock-avatar fallback" src={favicon} alt="" width="56" height="56" />
			{/if}
			<div>
				<p class="lock-kicker">Locked</p>
				<h1>{displayName}</h1>
			</div>
		</div>

		<button type="button" onclick={onunlock}>Unlock</button>
	</div>
</section>

<style>
	.lock-screen {
		position: fixed;
		inset: 0;
		z-index: 9998;
		display: grid;
		place-items: center;
		color: #eeeeec;
		background:
			radial-gradient(circle at 50% 24%, rgb(233 84 32 / 0.2), transparent 18rem),
			linear-gradient(rgb(48 10 36 / 0.9), rgb(48 10 36 / 0.96));
		backdrop-filter: blur(5px);
	}

	.lock-card {
		display: grid;
		justify-items: center;
		width: min(24rem, calc(100vw - 2rem));
		padding: var(--space-8) var(--space-6);
		text-align: center;
	}

	.lock-clock time {
		display: block;
		color: #eeeeec;
		font-size: clamp(3rem, 16vw, 5.5rem);
		font-weight: 300;
		line-height: 0.95;
		letter-spacing: -0.06em;
		text-shadow: 0 0.25rem 1rem rgb(0 0 0 / 0.32);
	}

	.lock-clock p {
		margin-top: var(--space-2);
		color: rgb(238 238 236 / 0.76);
		font-size: var(--text-2);
	}

	.lock-user {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		margin-top: var(--space-7);
		padding: var(--space-3) var(--space-4);
		text-align: left;
		background: rgb(238 238 236 / 0.08);
		border: 1px solid rgb(238 238 236 / 0.16);
		border-radius: var(--radius-3);
		box-shadow:
			0 1px 0 rgb(255 255 255 / 0.12) inset,
			0 1rem 2.2rem rgb(0 0 0 / 0.22);
	}

	.lock-avatar {
		width: 3.5rem;
		height: 3.5rem;
		object-fit: cover;
		border: 2px solid rgb(238 238 236 / 0.8);
		border-radius: 0.8rem;
		box-shadow: 0 0.25rem 0.8rem rgb(0 0 0 / 0.35);
	}

	.lock-avatar.fallback {
		padding: 0.45rem;
		object-fit: contain;
		background: #eeeeec;
	}

	.lock-kicker,
	.lock-user h1 {
		color: #e95420;
	}

	.lock-kicker {
		font-size: var(--text-0);
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.lock-user h1 {
		max-width: 14rem;
		overflow: hidden;
		font-size: var(--text-4);
		line-height: var(--leading-tight);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.lock-card button {
		margin-top: var(--space-5);
		padding: 0.45rem 1.15rem;
		color: #eeeeec;
		font: inherit;
		font-size: var(--text-1);
		font-weight: 700;
		background: #e95420;
		border: 1px solid #e95420;
		border-radius: var(--radius-2);
		box-shadow: 0 0.25rem 0.8rem rgb(0 0 0 / 0.25);
	}

	.lock-card button:hover,
	.lock-card button:focus-visible {
		background: #f06a35;
		outline: none;
	}
</style>
