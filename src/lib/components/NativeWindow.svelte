<script lang="ts">
	import type { Snippet } from 'svelte';
	import AppWindow from './AppWindow.svelte';

	type Props = {
		title: string;
		icon: string;
		address?: string;
		windowId?: string;
		maximized?: boolean;
		onfocus?: () => void;
		onminimize?: () => void;
		onmaximize?: () => void;
		onclose?: () => void;
		children: Snippet;
	};

	let { children, ...props }: Props = $props();
</script>

<AppWindow {...props} variant="native" showMenubar={false} showToolbar={false}>
	{@render children()}
</AppWindow>
