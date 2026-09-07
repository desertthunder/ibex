<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ComAtprotoSyncSubscribeRepos } from '@atcute/atproto';
	import { FirehoseSubscription } from '@atcute/firehose';
	import {
		buildLiveStreamUrl,
		parseFirehoseEvent,
		parseTextLiveEvent,
		streamDefaults,
		type LiveEvent,
		type LiveStreamKind
	} from '$lib/atproto/live-stream';
	import { errorMessage } from '$lib/utils/errors';

	type Props = { stream: LiveStreamKind };
	let { stream }: Props = $props();

	const MAX_EVENTS = 200;
	const streamLabels: Record<LiveStreamKind, string> = {
		jetstream: 'Jetstream',
		firehose: 'Firehose',
		spacedust: 'Spacedust'
	};
	const descriptions: Record<LiveStreamKind, string> = {
		jetstream: 'Decoded, filterable ATProto records as JSON.',
		firehose: 'Decoded full-network relay events with CBOR/CAR payload summaries.',
		spacedust: 'Links and backlinks extracted from records across the network.'
	};

	const initialDefaults = untrack(() => streamDefaults[stream]);
	let instance = $state(initialDefaults.instance);
	let did = $state('');
	let collection = $state(initialDefaults.collection);
	let cursor = $state('');
	let status = $state<'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'>('idle');
	let statusDetail = $state('Configure a stream, then connect.');
	let events = $state<LiveEvent[]>([]);
	let selectedEventId = $state<string | null>(null);
	let totalEvents = $state(0);
	let totalBytes = $state(0);
	let eventCount = 0;
	let byteCount = 0;
	let rateHistory = $state<number[]>(Array.from({ length: 24 }, () => 0));
	let currentRate = $state(0);
	let copied = $state(false);
	let socket: WebSocket | null = null;
	let firehoseIterator: AsyncIterator<unknown> | null = null;
	let rateTimer: ReturnType<typeof setInterval> | null = null;
	let eventsThisSecond = 0;
	let pendingEvents: LiveEvent[] = [];
	let flushScheduled = false;
	let pendingSourceCounts: Record<string, number> = Object.create(null);
	const sourceCounts = new SvelteMap<string, number>();

	const selectedEvent = $derived(events.find((event) => event.id === selectedEventId) ?? null);
	const topSources = $derived(
		Array.from(sourceCounts.entries())
			.sort((left, right) => right[1] - left[1])
			.slice(0, 5)
	);
	const peakRate = $derived(Math.max(1, ...rateHistory));
	const graphPoints = $derived(
		rateHistory
			.map((value, index) => `${(index / (rateHistory.length - 1)) * 100},${36 - (value / peakRate) * 32}`)
			.join(' ')
	);

	onDestroy(disconnect);

	function switchStream(next: LiveStreamKind) {
		if (next === stream) return;
		disconnect();
		void goto(resolve(next === 'jetstream' ? '/live' : `/live/${next}`));
	}

	function connect() {
		disconnect();
		resetStatistics();
		status = 'connecting';
		statusDetail = `Connecting to ${streamLabels[stream]}…`;

		try {
			const url = buildLiveStreamUrl(stream, { instance, did, collection, cursor });
			if (stream === 'firehose') {
				connectFirehose(url);
				return;
			}

			socket = new WebSocket(url);
			socket.binaryType = 'arraybuffer';
			socket.onopen = () => {
				status = 'connected';
				statusDetail = `Receiving live events from ${new URL(url).host}.`;
				startRateTimer();
			};
			socket.onmessage = (message) => void receiveMessage(message.data);
			socket.onerror = () => {
				status = 'error';
				statusDetail = 'The stream connection failed. Check the instance and your network, then reconnect.';
			};
			socket.onclose = (closeEvent) => {
				stopRateTimer();
				if (status !== 'error' && status !== 'idle') {
					status = 'disconnected';
					statusDetail = closeEvent.reason || 'The stream connection closed.';
				}
				socket = null;
			};
		} catch (unknownError) {
			status = 'error';
			statusDetail = errorMessage(unknownError, 'Could not open the stream.');
		}
	}

	function connectFirehose(url: string) {
		const parsedCursor = cursor.trim() ? Number(cursor) : undefined;
		if (parsedCursor !== undefined && !Number.isSafeInteger(parsedCursor)) {
			throw new Error('Enter a valid numeric firehose cursor.');
		}

		const subscription = new FirehoseSubscription({
			service: new URL(url).origin,
			nsid: ComAtprotoSyncSubscribeRepos.mainSchema,
			params: parsedCursor === undefined ? undefined : { cursor: parsedCursor },
			onConnectionOpen: () => {
				status = 'connected';
				statusDetail = `Receiving decoded relay events from ${new URL(url).host}.`;
				startRateTimer();
			},
			onConnectionClose: (event) => {
				stopRateTimer();
				if (status !== 'error' && firehoseIterator) {
					status = 'disconnected';
					statusDetail = event.reason || 'The relay connection closed.';
				}
			},
			onConnectionError: () => {
				status = 'error';
				statusDetail = 'The relay connection failed. Check the instance and cursor, then reconnect.';
			},
			onError: (unknownError) => {
				statusDetail = errorMessage(unknownError, 'The relay sent an event that could not be decoded.');
			}
		});
		const iterator: AsyncIterator<unknown> = subscription[Symbol.asyncIterator]();
		firehoseIterator = iterator;

		void (async () => {
			try {
				while (firehoseIterator === iterator) {
					const next = await iterator.next();
					if (next.done || firehoseIterator !== iterator) break;
					queueEvent(parseFirehoseEvent(next.value));
				}
			} catch (unknownError) {
				if (firehoseIterator === iterator) {
					status = 'error';
					statusDetail = errorMessage(unknownError, 'The firehose subscription stopped.');
				}
			}
		})();
	}

	function disconnect() {
		stopRateTimer();
		const iterator = firehoseIterator;
		firehoseIterator = null;
		void iterator?.return?.();
		if (socket) {
			socket.onclose = null;
			socket.close(1000, 'Closed by System Monitor');
			socket = null;
		}
		if (status === 'connected' || status === 'connecting') {
			status = 'disconnected';
			statusDetail = 'Monitoring stopped. Existing events remain available.';
		}
	}

	async function receiveMessage(data: string | ArrayBuffer | Blob) {
		try {
			const raw = typeof data === 'string' ? data : await new Blob([data]).text();
			const event = parseTextLiveEvent(stream as Exclude<LiveStreamKind, 'firehose'>, raw);
			if (stream === 'spacedust' && collection && !collection.includes(':') && event.collection !== collection) return;
			queueEvent(event);
		} catch (unknownError) {
			status = 'error';
			statusDetail = errorMessage(unknownError, 'A stream event could not be read.');
		}
	}

	function queueEvent(event: LiveEvent) {
		eventCount += 1;
		byteCount += event.bytes ?? 0;
		eventsThisSecond += 1;
		const source = event.source ?? event.collection ?? event.kind;
		pendingSourceCounts[source] = (pendingSourceCounts[source] ?? 0) + 1;
		pendingEvents.unshift(event);
		scheduleFlush();
	}

	function scheduleFlush() {
		if (flushScheduled) return;
		flushScheduled = true;
		window.setTimeout(() => {
			events = [...pendingEvents, ...events].slice(0, MAX_EVENTS);
			totalEvents = eventCount;
			totalBytes = byteCount;
			for (const [source, count] of Object.entries(pendingSourceCounts)) {
				sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + count);
			}
			pendingSourceCounts = Object.create(null);
			pendingEvents = [];
			flushScheduled = false;
		}, 200);
	}

	function startRateTimer() {
		stopRateTimer();
		rateTimer = setInterval(() => {
			currentRate = eventsThisSecond;
			rateHistory = [...rateHistory.slice(1), eventsThisSecond];
			eventsThisSecond = 0;
		}, 1000);
	}

	function stopRateTimer() {
		if (rateTimer) clearInterval(rateTimer);
		rateTimer = null;
	}

	function resetStatistics() {
		events = [];
		pendingEvents = [];
		selectedEventId = null;
		totalEvents = 0;
		totalBytes = 0;
		eventCount = 0;
		byteCount = 0;
		currentRate = 0;
		eventsThisSecond = 0;
		rateHistory = Array.from({ length: 24 }, () => 0);
		pendingSourceCounts = Object.create(null);
		sourceCounts.clear();
	}

	async function copySelectedEvent() {
		if (!selectedEvent) return;
		try {
			await navigator.clipboard.writeText(selectedEvent.json);
			copied = true;
			window.setTimeout(() => (copied = false), 1500);
		} catch {
			copied = false;
		}
	}

	function selectEvent(event: KeyboardEvent, eventId: string) {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		selectedEventId = eventId;
	}

	function displayTime(value: string) {
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString();
	}

	function formatCount(value: number) {
		return new Intl.NumberFormat().format(value);
	}

	function formatBytes(value: number) {
		if (value < 1024) return `${value} B`;
		if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
		return `${(value / 1024 / 1024).toFixed(1)} MiB`;
	}
</script>

<section class="system-monitor" aria-label="ATProto System Monitor">
	<nav class="stream-tabs" aria-label="Live stream">
		{#each ['jetstream', 'firehose', 'spacedust'] as streamKind (streamKind)}
			<button
				type="button"
				class:active={stream === streamKind}
				aria-current={stream === streamKind ? 'page' : undefined}
				onclick={() => switchStream(streamKind as LiveStreamKind)}>
				{streamLabels[streamKind as LiveStreamKind]}
			</button>
		{/each}
	</nav>

	<form
		class="connection-bar"
		onsubmit={(event) => {
			event.preventDefault();
			connect();
		}}>
		<label class="instance-field">
			<span>Stream instance</span>
			<input bind:value={instance} spellcheck="false" autocomplete="off" />
		</label>
		<label>
			<span>{stream === 'spacedust' ? 'Target DID' : 'DID'}</span>
			<input bind:value={did} disabled={stream === 'firehose'} placeholder="did:plc:…" spellcheck="false" />
		</label>
		<label>
			<span>{stream === 'spacedust' ? 'Collection or link source' : 'Collection'}</span>
			<input
				bind:value={collection}
				disabled={stream === 'firehose'}
				placeholder={stream === 'spacedust' ? 'app.bsky.feed.like:subject.uri' : 'app.bsky.feed.post'}
				spellcheck="false" />
		</label>
		<label class="cursor-field">
			<span>Cursor</span>
			<input bind:value={cursor} disabled={stream === 'spacedust'} inputmode="numeric" placeholder="Live" />
		</label>
		<div class="connection-actions">
			{#if status === 'connected' || status === 'connecting'}
				<button class="stop-button" type="button" onclick={disconnect}>Stop</button>
			{:else}
				<button class="connect-button" type="submit">Connect</button>
			{/if}
		</div>
	</form>

	<div class="status-strip" class:error={status === 'error'} aria-live="polite">
		<span class:online={status === 'connected'} class="status-light"></span>
		<strong>{streamLabels[stream]}</strong>
		<span>{descriptions[stream]}</span>
		<small>{statusDetail}</small>
	</div>

	<div class="monitor-body">
		<section class="overview-pane" aria-label="Stream activity">
			<div class="stat-grid">
				<div><span>Event rate</span><strong>{formatCount(currentRate)}</strong><small>events/sec</small></div>
				<div><span>Total events</span><strong>{formatCount(totalEvents)}</strong><small>this connection</small></div>
				<div>
					{#if stream === 'firehose'}
						<span>Decoded detail</span>
					{:else}
						<span>Data received</span>
					{/if}
					<strong>{formatBytes(totalBytes)}</strong>
					{#if stream === 'firehose'}
						<small>JSON view size</small>
					{:else}
						<small>payload bytes</small>
					{/if}
				</div>
			</div>

			<section class="rate-graph" aria-labelledby="rate-title">
				<header>
					<h2 id="rate-title">Event Rate History</h2>
					<span>Peak {formatCount(peakRate)} events/sec</span>
				</header>
				<svg
					viewBox="0 0 100 40"
					role="img"
					aria-label="Event rate over the last 24 seconds"
					preserveAspectRatio="none">
					<path d="M0 36H100 M0 20H100 M0 4H100" class="grid-lines" />
					<polygon points={`0,36 ${graphPoints} 100,36`} class="graph-fill" />
					<polyline points={graphPoints} class="graph-line" />
				</svg>
			</section>

			<section class="event-list" aria-labelledby="events-title">
				<header>
					<h2 id="events-title">Live Events</h2>
					<span>Keeping the newest {MAX_EVENTS}</span>
				</header>
				<div class="table-scroll">
					<table>
						<thead><tr><th>Time</th><th>Kind</th><th>Repository</th><th>Event</th></tr></thead>
						<tbody>
							{#each events as event (event.id)}
								<tr
									class:selected={selectedEventId === event.id}
									tabindex="0"
									aria-selected={selectedEventId === event.id}
									onclick={() => (selectedEventId = event.id)}
									onkeydown={(keyboardEvent) => selectEvent(keyboardEvent, event.id)}>
									<td>{displayTime(event.time)}</td>
									<td><span class="kind-badge">{event.kind}</span></td>
									<td title={event.did ?? ''}>{event.did ?? '—'}</td>
									<td title={event.summary}>{event.summary}</td>
								</tr>
							{:else}
								<tr class="empty-row"><td colspan="4">No events yet. Connect to begin monitoring this stream.</td></tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		</section>

		<aside class="detail-pane" aria-label="Event details">
			<section class="top-sources">
				<h2>{stream === 'spacedust' ? 'Top Link Sources' : 'Top Collections / Sources'}</h2>
				<ol>
					{#each topSources as [source, count] (source)}
						<li><span title={source}>{source}</span><strong>{formatCount(count)}</strong></li>
					{:else}
						<li class="empty-source">Sources appear as events arrive.</li>
					{/each}
				</ol>
			</section>

			<section class="json-detail">
				<header>
					<h2>Event Details</h2>
					<button type="button" onclick={copySelectedEvent} disabled={!selectedEvent}
						>{copied ? 'Copied' : 'Copy JSON'}</button>
				</header>
				{#if selectedEvent}
					<dl>
						<div>
							<dt>Operation</dt>
							<dd>{selectedEvent.operation ?? '—'}</dd>
						</div>
						<div>
							<dt>Source</dt>
							<dd>{selectedEvent.source ?? '—'}</dd>
						</div>
					</dl>
					<pre>{selectedEvent.json}</pre>
				{:else}
					<p>Select an event to inspect its JSON.</p>
				{/if}
			</section>
		</aside>
	</div>
</section>

<style>
	.system-monitor {
		display: grid;
		grid-template-rows: auto auto auto minmax(0, 1fr);
		height: 100%;
		min-height: 0;
		color: #2e241b;
		background: #eeeeec;
	}
	.stream-tabs {
		display: flex;
		gap: 2px;
		padding: var(--space-2) var(--space-2) 0;
		background: #d3d7cf;
		border-bottom: 1px solid #888a85;
	}
	.stream-tabs button {
		min-width: 7rem;
		padding: var(--space-1) var(--space-3);
		background: linear-gradient(#eeeeec, #babdb6);
		border: 1px solid #888a85;
		border-bottom: 0;
		border-radius: var(--radius-2) var(--radius-2) 0 0;
		cursor: default;
	}
	.stream-tabs button.active {
		position: relative;
		bottom: -1px;
		padding-bottom: calc(var(--space-1) + 1px);
		background: #eeeeec;
		font-weight: 700;
	}
	.connection-bar {
		display: grid;
		grid-template-columns: 1.35fr 1fr 1fr minmax(5rem, 0.55fr) auto;
		gap: var(--space-2);
		align-items: end;
		padding: var(--space-2);
		background: linear-gradient(#eeeeec, #d3d7cf);
		border-bottom: 1px solid #888a85;
	}
	.connection-bar label {
		display: grid;
		gap: 2px;
		min-width: 0;
		color: #555753;
		font-size: var(--text-0);
		font-weight: 700;
	}
	.connection-bar input {
		width: 100%;
		min-width: 0;
		height: 1.75rem;
		padding: 0 var(--space-2);
		color: #2e3436;
		background: white;
		border: 1px solid #888a85;
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.2) inset;
		font-family: var(--font-mono);
		font-size: var(--text-1);
	}
	.connection-bar input:disabled {
		color: #888a85;
		background: #d3d7cf;
	}
	.connection-actions button,
	.json-detail button {
		min-height: 1.75rem;
		padding: 0 var(--space-3);
		border: 1px solid #888a85;
		border-radius: var(--radius-1);
		box-shadow: 0 1px 0 white inset;
		cursor: default;
	}
	.connect-button {
		color: white;
		background: linear-gradient(#729fcf, #3465a4);
		text-shadow: 0 1px #204a87;
	}
	.stop-button,
	.json-detail button {
		background: linear-gradient(#fff, #d3d7cf);
	}
	.status-strip {
		display: grid;
		grid-template-columns: auto auto minmax(10rem, auto) minmax(12rem, 1fr);
		gap: var(--space-2);
		align-items: center;
		min-height: 1.8rem;
		padding: var(--space-1) var(--space-3);
		background: #fff;
		border-bottom: 1px solid #babdb6;
		font-size: var(--text-1);
	}
	.status-strip small {
		justify-self: end;
		color: #555753;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.status-strip.error small {
		color: #a40000;
	}
	.status-light {
		width: 0.65rem;
		height: 0.65rem;
		background: #888a85;
		border: 1px solid #555753;
		border-radius: 50%;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.6) inset;
	}
	.status-light.online {
		background: #73d216;
		border-color: #4e9a06;
	}
	.monitor-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
		min-height: 0;
	}
	.overview-pane {
		display: grid;
		grid-template-rows: auto minmax(8rem, 0.7fr) minmax(12rem, 1.3fr);
		gap: var(--space-2);
		min-width: 0;
		min-height: 0;
		padding: var(--space-2);
	}
	.stat-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		border: 1px solid #888a85;
		background: #fff;
	}
	.stat-grid div {
		display: grid;
		grid-template-columns: auto auto;
		align-items: baseline;
		gap: 0 var(--space-2);
		padding: var(--space-2) var(--space-3);
		border-right: 1px solid #d3d7cf;
	}
	.stat-grid div:last-child {
		border-right: 0;
	}
	.stat-grid span {
		grid-column: 1 / -1;
		color: #555753;
		font-size: var(--text-1);
	}
	.stat-grid strong {
		font-size: var(--text-5);
		font-variant-numeric: tabular-nums;
	}
	.stat-grid small {
		color: #555753;
	}
	.rate-graph,
	.event-list,
	.top-sources,
	.json-detail {
		min-height: 0;
		overflow: hidden;
		background: #fff;
		border: 1px solid #888a85;
		box-shadow: 0 1px 0 rgb(255 255 255 / 0.8) inset;
	}
	.rate-graph,
	.event-list {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
	}
	.rate-graph header,
	.event-list header,
	.json-detail header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-2);
		min-height: 1.8rem;
		padding: var(--space-1) var(--space-2);
		background: linear-gradient(#eeeeec, #d3d7cf);
		border-bottom: 1px solid #babdb6;
	}
	h2 {
		font-size: var(--text-1);
	}
	.rate-graph header span,
	.event-list header span {
		color: #555753;
		font-size: var(--text-0);
	}
	.rate-graph svg {
		width: 100%;
		height: 100%;
		min-height: 6rem;
		background: #1b2b23;
	}
	.grid-lines {
		fill: none;
		stroke: #496b57;
		stroke-width: 0.3;
	}
	.graph-fill {
		fill: rgb(138 226 52 / 0.18);
	}
	.graph-line {
		fill: none;
		stroke: #8ae234;
		stroke-width: 0.8;
		vector-effect: non-scaling-stroke;
	}
	.table-scroll {
		min-height: 0;
		overflow: auto;
	}
	table {
		width: 100%;
		table-layout: fixed;
		border-collapse: collapse;
		font-size: var(--text-1);
	}
	th {
		position: sticky;
		top: 0;
		padding: var(--space-1) var(--space-2);
		text-align: left;
		background: linear-gradient(#eeeeec, #d3d7cf);
		border-right: 1px solid #babdb6;
		border-bottom: 1px solid #888a85;
	}
	th:nth-child(1) {
		width: 6rem;
	}
	th:nth-child(2) {
		width: 6.5rem;
	}
	th:nth-child(3) {
		width: 12rem;
	}
	td {
		padding: var(--space-1) var(--space-2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		border-bottom: 1px solid #eeeeec;
		font-variant-numeric: tabular-nums;
	}
	tbody tr:not(.empty-row) {
		cursor: default;
	}
	tbody tr:not(.empty-row):hover {
		background: #e7f0fa;
	}
	tbody tr.selected {
		color: white;
		background: #3465a4;
	}
	.kind-badge {
		padding: 0 0.3rem;
		background: #eeeeec;
		border: 1px solid #babdb6;
		border-radius: var(--radius-1);
		color: #2e3436;
	}
	.empty-row td {
		padding: var(--space-4);
		color: #555753;
		text-align: center;
		white-space: normal;
	}
	.detail-pane {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		gap: var(--space-2);
		min-width: 0;
		min-height: 0;
		padding: var(--space-2) var(--space-2) var(--space-2) 0;
		border-left: 1px solid #babdb6;
	}
	.top-sources {
		padding-bottom: var(--space-1);
	}
	.top-sources h2 {
		padding: var(--space-2);
		background: #d3d7cf;
		border-bottom: 1px solid #babdb6;
	}
	.top-sources ol {
		display: grid;
	}
	.top-sources li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-2);
		border-bottom: 1px solid #eeeeec;
		font-size: var(--text-1);
	}
	.top-sources li span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.top-sources li strong {
		font-variant-numeric: tabular-nums;
	}
	.top-sources .empty-source {
		display: block;
		color: #555753;
	}
	.json-detail {
		display: grid;
		grid-template-rows: auto auto minmax(0, 1fr);
	}
	.json-detail button:disabled {
		opacity: 0.55;
	}
	.json-detail dl {
		display: grid;
		grid-template-columns: 1fr 1fr;
		border-bottom: 1px solid #babdb6;
	}
	.json-detail dl div {
		min-width: 0;
		padding: var(--space-1) var(--space-2);
	}
	.json-detail dt {
		color: #555753;
		font-size: var(--text-0);
		font-weight: 700;
	}
	.json-detail dd {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-family: var(--font-mono);
		font-size: var(--text-1);
	}
	.json-detail pre {
		min-height: 0;
		margin: 0;
		padding: var(--space-2);
		overflow: auto;
		color: #eeeeec;
		background: #2e3436;
		font-family: var(--font-mono);
		font-size: var(--text-1);
		line-height: var(--leading-base);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.json-detail > p {
		padding: var(--space-4);
		color: #555753;
		font-size: var(--text-1);
	}
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid #f57900;
		outline-offset: 1px;
	}
	@media (max-width: 850px) {
		.connection-bar {
			grid-template-columns: 1fr 1fr;
		}
		.instance-field {
			grid-column: 1 / -1;
		}
		.connection-actions {
			justify-self: end;
		}
		.monitor-body {
			grid-template-columns: 1fr;
			overflow: auto;
		}
		.overview-pane {
			grid-template-rows: auto 10rem 18rem;
		}
		.detail-pane {
			grid-template-columns: minmax(12rem, 0.7fr) minmax(18rem, 1.3fr);
			grid-template-rows: 18rem;
			padding: 0 var(--space-2) var(--space-2);
			border-left: 0;
		}
	}
	@media (max-width: 560px) {
		.stream-tabs button {
			min-width: 0;
			flex: 1;
		}
		.connection-bar {
			grid-template-columns: 1fr;
		}
		.instance-field {
			grid-column: auto;
		}
		.status-strip {
			grid-template-columns: auto auto 1fr;
		}
		.status-strip > span:nth-of-type(2) {
			display: none;
		}
		.status-strip small {
			grid-column: 1 / -1;
			justify-self: start;
			white-space: normal;
		}
		.stat-grid {
			grid-template-columns: 1fr;
		}
		.stat-grid div {
			border-right: 0;
			border-bottom: 1px solid #d3d7cf;
		}
		.detail-pane {
			grid-template-columns: 1fr;
			grid-template-rows: auto 22rem;
		}
		th:nth-child(3),
		td:nth-child(3) {
			display: none;
		}
	}
	@media (pointer: coarse) {
		.stream-tabs button,
		.connection-actions button,
		.json-detail button {
			min-height: 2.75rem;
		}
	}
</style>
