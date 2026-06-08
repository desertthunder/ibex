<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		icon: string;
		address?: string;
		movable?: boolean;
		showMenubar?: boolean;
		showToolbar?: boolean;
		windowId?: string;
		maximized?: boolean;
		onfocus?: () => void;
		onminimize?: () => void;
		onmaximize?: () => void;
		resizable?: boolean;
		onclose?: () => void;
	};

	let {
		title,
		icon,
		address = 'at://ubuntu.example/app.bsky.feed.post',
		movable = true,
		showMenubar = true,
		showToolbar = true,
		windowId,
		maximized = false,
		onfocus,
		onminimize,
		onmaximize,
		resizable = true,
		onclose,
		children
	}: Props & { children: Snippet } = $props();

	let x = $state(0);
	let y = $state(0);
	let width = $state<number | null>(null);
	let height = $state<number | null>(null);
	let drag = $state<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(
		null
	);
	let resize = $state<{
		pointerId: number;
		startX: number;
		startY: number;
		originWidth: number;
		originHeight: number;
	} | null>(null);

	const storageKey = $derived(windowId ? `intrepid-ibex:window-geometry:${windowId}` : null);

	onMount(() => {
		if (!browser || !storageKey) return;

		const storedGeometry = localStorage.getItem(storageKey);
		if (!storedGeometry) return;

		try {
			const geometry = JSON.parse(storedGeometry) as { x?: number; y?: number; width?: number; height?: number };
			x = typeof geometry.x === 'number' ? geometry.x : 0;
			y = typeof geometry.y === 'number' ? geometry.y : 0;
			width = typeof geometry.width === 'number' ? geometry.width : null;
			height = typeof geometry.height === 'number' ? geometry.height : null;
		} catch {
			localStorage.removeItem(storageKey);
		}
	});

	function startDrag(event: PointerEvent) {
		onfocus?.();

		if (!movable || maximized || event.button !== 0 || event.target instanceof HTMLButtonElement) {
			return;
		}

		drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: x, originY: y };

		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function moveDrag(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) {
			return;
		}

		x = drag.originX + event.clientX - drag.startX;
		y = drag.originY + event.clientY - drag.startY;
	}

	function stopDrag(event: PointerEvent) {
		if (!drag || event.pointerId !== drag.pointerId) {
			return;
		}

		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
		drag = null;

		persistGeometry();
	}

	function startResize(event: PointerEvent) {
		onfocus?.();

		if (!resizable || maximized || event.button !== 0) {
			return;
		}

		const windowElement = (event.currentTarget as HTMLElement).closest('.app-window');
		if (!windowElement) return;

		const bounds = windowElement.getBoundingClientRect();
		resize = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			originWidth: bounds.width,
			originHeight: bounds.height
		};

		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function moveResize(event: PointerEvent) {
		if (!resize || event.pointerId !== resize.pointerId) {
			return;
		}

		width = Math.max(320, resize.originWidth + event.clientX - resize.startX);
		height = Math.max(220, resize.originHeight + event.clientY - resize.startY);
	}

	function stopResize(event: PointerEvent) {
		if (!resize || event.pointerId !== resize.pointerId) {
			return;
		}

		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
		resize = null;
		persistGeometry();
	}

	function persistGeometry() {
		if (browser && storageKey) {
			localStorage.setItem(storageKey, JSON.stringify({ x, y, width, height }));
		}
	}
</script>

<section
	class="app-window"
	class:dragging={drag}
	class:resizing={resize}
	class:maximized
	aria-label={title}
	role="group"
	style:transform={maximized ? undefined : `translate(${x}px, ${y}px)`}
	style:width={maximized || width === null ? undefined : `${width}px`}
	style:height={maximized || height === null ? undefined : `${height}px`}
	onpointerdown={onfocus}>
	<header
		class="titlebar"
		role="group"
		aria-label="Window title bar"
		onpointerdown={startDrag}
		onpointermove={moveDrag}
		onpointerup={stopDrag}
		onpointercancel={stopDrag}>
		<div class="window-title">
			<img src={icon} alt="" width="18" height="18" />
			<h1>{title}</h1>
		</div>
		<div class="window-controls" aria-label="Window controls">
			<button
				class="minimize-control"
				type="button"
				aria-label="Minimize"
				tabindex={onminimize ? 0 : -1}
				onclick={onminimize}></button>
			<button
				class="maximize-control"
				type="button"
				aria-label={maximized ? 'Restore' : 'Maximize'}
				tabindex={onmaximize ? 0 : -1}
				onclick={onmaximize}></button>
			<button class="close-control" type="button" aria-label="Close" tabindex={onclose ? 0 : -1} onclick={onclose}
			></button>
		</div>
	</header>

	{#if showMenubar}
		<nav class="menubar" aria-label="Application menu">
			<button type="button">Collection</button>
			<button type="button">Navigate</button>
			<button type="button">View</button>
			<button type="button">Bookmarks</button>
			<button type="button">Help</button>
		</nav>
	{/if}

	{#if showToolbar}
		<div class="toolbar" aria-label="Application toolbar">
			<button type="button"><span aria-hidden="true">◀</span> Back</button>
			<button type="button"><span aria-hidden="true">▶</span> Forward</button>
			<button type="button"
				><img src="/icons/humanity/actions/mail-send-receive.svg" alt="" width="18" height="18" /> Sync</button>
			<label>
				<span class="sr-only">Address</span>
				<input value={address} readonly />
			</label>
		</div>
	{/if}

	<div class="content">
		{@render children()}
	</div>

	{#if resizable && !maximized}
		<div
			class="resize-handle"
			role="separator"
			aria-label="Resize window"
			onpointerdown={startResize}
			onpointermove={moveResize}
			onpointerup={stopResize}
			onpointercancel={stopResize}>
		</div>
	{/if}
</section>

<style>
	.app-window {
		position: relative;
		display: grid;
		grid-template-rows: auto auto auto minmax(0, 1fr);
		min-width: 320px;
		min-height: 220px;
		overflow: hidden;
		background: var(--window-surface);
		border: 1px solid #2a170d;
		border-radius: var(--radius-3) var(--radius-3) var(--radius-2) var(--radius-2);
		box-shadow: var(--shadow-window);
		will-change: transform;
	}

	.app-window.dragging,
	.app-window.resizing {
		user-select: none;
	}

	.app-window.maximized {
		width: 100%;
		height: 100%;
		border-radius: 0;
		transform: none;
	}

	.titlebar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 1.85rem;
		padding: 3px var(--space-2) 3px var(--space-3);
		color: #fff1d7;
		background:
			linear-gradient(rgb(255 255 255 / 0.14), transparent 45%),
			linear-gradient(var(--window-title-start), var(--window-title-end));
		border-bottom: 1px solid #1b0f09;
		text-shadow: 0 1px 1px rgb(0 0 0 / 0.9);
		cursor: move;
		touch-action: none;
	}

	.window-title {
		display: flex;
		align-items: center;
		min-width: 0;
		gap: var(--space-2);
	}

	h1 {
		overflow: hidden;
		font-size: var(--text-2);
		font-weight: 700;
		line-height: var(--leading-tight);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.window-controls {
		display: flex;
		gap: 5px;
	}

	.window-controls button {
		width: 14px;
		height: 14px;
		border: 1px solid #1e120a;
		border-radius: var(--radius-round);
		background: radial-gradient(circle at 35% 30%, #fff4d0, #cf7b1f 45%, #6d3412 78%);
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.24) inset;
		cursor: default;
		transition:
			filter 120ms ease,
			box-shadow 120ms ease,
			background 120ms ease;
	}

	.window-controls button:hover,
	.window-controls button:focus-visible {
		filter: brightness(1.16) saturate(1.1);
		box-shadow:
			0 1px 0 rgb(255 255 255 / 0.42) inset,
			0 0 0 1px rgb(255 238 186 / 0.45),
			0 0 7px rgb(255 194 78 / 0.65);
	}

	.minimize-control:hover,
	.minimize-control:focus-visible {
		background: radial-gradient(circle at 35% 30%, #fff8ce, #fce94f 42%, #9b7f00 78%);
	}

	.maximize-control:hover,
	.maximize-control:focus-visible {
		background: radial-gradient(circle at 35% 30%, #efffd4, #8ae234 42%, #3b7c09 78%);
	}

	.close-control:hover,
	.close-control:focus-visible {
		background: radial-gradient(circle at 35% 30%, #ffd6c9, #ef2929 42%, #660000 78%);
	}

	.menubar,
	.toolbar {
		display: flex;
		align-items: center;
		background: linear-gradient(#f3e5ca, #d4bb91);
		border-bottom: 1px solid #9b805b;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.68) inset;
	}

	.menubar {
		gap: var(--space-1);
		padding: 2px var(--space-2);
		font-size: var(--text-1);
	}

	.menubar button {
		padding: 1px var(--space-2);
		border-radius: var(--radius-1);
		cursor: default;
	}

	.menubar button:hover {
		color: white;
		background: var(--selection);
	}

	.toolbar {
		gap: var(--space-2);
		padding: var(--space-2);
	}

	.toolbar button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		height: 1.75rem;
		padding: 0 var(--space-3);
		background: linear-gradient(#fff9ec, #ceb48a);
		border: 1px solid #9b7d55;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-raised);
		font-size: var(--text-1);
		cursor: default;
	}

	.toolbar label {
		min-width: 8rem;
		flex: 1;
	}

	.toolbar input {
		width: 100%;
		height: 1.75rem;
		padding: 0 var(--space-2);
		color: var(--text-muted);
		background: #fffcf4;
		border: 1px solid #8e7654;
		border-radius: var(--radius-2);
		box-shadow: var(--shadow-sunken);
		font-family: var(--font-mono);
		font-size: var(--text-1);
	}

	.content {
		overflow: hidden;
		padding: var(--space-3);
		background: var(--window-surface);
	}

	.resize-handle {
		position: absolute;
		right: 0;
		bottom: 0;
		width: 16px;
		height: 16px;
		cursor: nwse-resize;
		touch-action: none;
		background:
			linear-gradient(135deg, transparent 0 48%, rgb(77 44 23 / 0.65) 49% 54%, transparent 55%),
			linear-gradient(135deg, transparent 0 66%, rgb(255 255 255 / 0.45) 67% 72%, transparent 73%);
	}

	.resize-handle:hover {
		background:
			linear-gradient(135deg, transparent 0 48%, rgb(196 91 18 / 0.85) 49% 54%, transparent 55%),
			linear-gradient(135deg, transparent 0 66%, rgb(255 246 213 / 0.8) 67% 72%, transparent 73%);
	}

	@media (max-width: 760px) {
		.toolbar button:nth-of-type(2),
		.toolbar input {
			display: none;
		}
	}
</style>
