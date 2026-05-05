<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		forceSimulation,
		forceLink,
		forceManyBody,
		forceCenter,
		forceCollide,
		forceX,
		forceY,
		type Simulation,
		type SimulationNodeDatum,
		type SimulationLinkDatum
	} from 'd3-force';
	import { select } from 'd3-selection';
	import { zoom, zoomIdentity } from 'd3-zoom';
	import { drag, type D3DragEvent } from 'd3-drag';
	import { untrack } from 'svelte';
	import type { EntityType } from '../../entity-types';

	type InputNode = {
		id: string;
		type: EntityType;
		nativeId: string;
		title: string;
	};
	type InputEdge = { source: string; target: string; relation: string };

	type SimNode = SimulationNodeDatum & InputNode;
	type SimEdge = SimulationLinkDatum<SimNode> & { relation: string };

	let {
		nodes: rawNodes,
		edges: rawEdges,
		country
	}: { nodes: InputNode[]; edges: InputEdge[]; country: string } = $props();

	const TYPE_STROKE: Record<EntityType, string> = {
		act: '#94a3b8',
		bill: '#34d399',
		amendment: '#fbbf24',
		debate: '#60a5fa',
		citation: '#60a5fa',
		judgment: '#fb7185',
		journal: '#a78bfa',
		document_collection: '#cbd5e1',
		question: '#22d3ee',
		communication: '#22d3ee',
		change_set: '#f472b6',
		statement: '#22d3ee',
		portion: '#cbd5e1',
		doc: '#cbd5e1'
	};

	const RELATION_DASH: Record<string, string> = {
		amends: '',
		enacts: '',
		mentions: '4 3',
		cites: '1 3'
	};
	function dashFor(rel: string): string {
		return RELATION_DASH[rel] ?? '4 3';
	}

	const presentTypes = $derived(Array.from(new Set(rawNodes.map((n) => n.type))).sort());

	const nodes: SimNode[] = untrack(() => rawNodes.map((n) => ({ ...n })));
	const edges: SimEdge[] = untrack(() =>
		rawEdges.map((e) => ({ source: e.source, target: e.target, relation: e.relation }))
	);

	let tick = $state(0);
	let transform = $state(zoomIdentity);
	let hoveredId = $state<string | null>(null);

	let simulation: Simulation<SimNode, SimEdge> | null = null;

	const adjacency = $derived.by(() => {
		const map = new Map<string, Set<string>>();
		for (const n of rawNodes) map.set(n.id, new Set());
		for (const e of rawEdges) {
			map.get(e.source)?.add(e.target);
			map.get(e.target)?.add(e.source);
		}
		return map;
	});

	function isNeighbor(id: string): boolean {
		if (!hoveredId) return true;
		if (id === hoveredId) return true;
		return adjacency.get(hoveredId)?.has(id) ?? false;
	}

	function isEdgeActive(e: SimEdge): boolean {
		if (!hoveredId) return false;
		const s = typeof e.source === 'object' ? (e.source as SimNode).id : (e.source as string);
		const t = typeof e.target === 'object' ? (e.target as SimNode).id : (e.target as string);
		return s === hoveredId || t === hoveredId;
	}

	function shortLabel(title: string, max = 28): string {
		if (title.length <= max) return title;
		return title.slice(0, max - 1).trimEnd() + '…';
	}

	function startSimulation(w: number, h: number) {
		simulation?.stop();
		for (const n of nodes) {
			if (n.x === undefined) n.x = w / 2 + (Math.random() - 0.5) * 50;
			if (n.y === undefined) n.y = h / 2 + (Math.random() - 0.5) * 50;
		}
		simulation = forceSimulation<SimNode>(nodes)
			.force(
				'link',
				forceLink<SimNode, SimEdge>(edges)
					.id((d) => d.id)
					.distance(80)
					.strength(0.4)
			)
			.force('charge', forceManyBody<SimNode>().strength(-260))
			.force('center', forceCenter(w / 2, h / 2).strength(0.5))
			.force('x', forceX<SimNode>(w / 2).strength(0.08))
			.force('y', forceY<SimNode>(h / 2).strength(0.08))
			.force('collide', forceCollide<SimNode>().radius(28))
			.alphaDecay(0.02)
			.alpha(1)
			.on('tick', () => {
				tick++;
			});
	}

	function svgAttach(svg: SVGSVGElement) {
		const sel = select(svg);

		const zoomBehavior = zoom<SVGSVGElement, unknown>()
			.scaleExtent([0.3, 4])
			.filter((event) => {
				if (event.type === 'wheel') return true;
				const target = event.target as Element;
				return !target.closest('[data-node]');
			})
			.on('zoom', (event) => {
				transform = event.transform;
			});

		sel.call(zoomBehavior);

		let started = false;
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const cr = entry.contentRect;
				if (cr.width === 0 || cr.height === 0) continue;
				if (!started) {
					startSimulation(cr.width, cr.height);
					started = true;
				} else if (simulation) {
					simulation.force('center', forceCenter(cr.width / 2, cr.height / 2));
					simulation.alpha(0.3).restart();
				}
			}
		});
		ro.observe(svg);

		return () => {
			ro.disconnect();
			simulation?.stop();
			simulation = null;
		};
	}

	function nodeAttach(g: SVGGElement) {
		const node = (g as SVGGElement & { __data__?: SimNode }).__data__;
		if (!node) return;

		const dragBehavior = drag<SVGGElement, unknown>()
			.on('start', (event: D3DragEvent<SVGGElement, unknown, unknown>) => {
				if (!event.active) simulation?.alphaTarget(0.3).restart();
				node.fx = node.x;
				node.fy = node.y;
			})
			.on('drag', (event: D3DragEvent<SVGGElement, unknown, unknown>) => {
				node.fx = event.x;
				node.fy = event.y;
			})
			.on('end', (event: D3DragEvent<SVGGElement, unknown, unknown>) => {
				if (!event.active) simulation?.alphaTarget(0);
				node.fx = null;
				node.fy = null;
			});

		select(g as SVGGElement).datum(node).call(dragBehavior);
	}

	function handleNodeClick(node: SimNode, event: MouseEvent) {
		if ((event as MouseEvent & { defaultPrevented: boolean }).defaultPrevented) return;
		goto(`/demo/${country}/${node.type}/${node.nativeId}`);
	}

	function handleNodeKey(node: SimNode, event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			goto(`/demo/${country}/${node.type}/${node.nativeId}`);
		}
	}
</script>

<div class="relative h-full w-full">
	<svg
		class="h-full w-full"
		{@attach svgAttach}
		role="img"
		aria-label="Document link graph"
	>
		<g transform="translate({transform.x},{transform.y}) scale({transform.k})">
			<g class="edges">
				{#each edges as e, i (i)}
					{@const _t = tick}
					{@const sx =
						_t >= 0 && typeof e.source === 'object' ? ((e.source as SimNode).x ?? 0) : 0}
					{@const sy =
						_t >= 0 && typeof e.source === 'object' ? ((e.source as SimNode).y ?? 0) : 0}
					{@const tx =
						_t >= 0 && typeof e.target === 'object' ? ((e.target as SimNode).x ?? 0) : 0}
					{@const ty =
						_t >= 0 && typeof e.target === 'object' ? ((e.target as SimNode).y ?? 0) : 0}
					{@const active = isEdgeActive(e)}
					{@const dim = hoveredId !== null && !active}
					<line
						x1={sx}
						y1={sy}
						x2={tx}
						y2={ty}
						stroke={active ? '#374151' : '#e5e7eb'}
						stroke-width={active ? 1.25 : 1}
						stroke-dasharray={dashFor(e.relation)}
						opacity={dim ? 0.25 : 1}
					/>
				{/each}
			</g>
			<g class="nodes">
				{#each nodes as n (n.id)}
					{@const _t = tick}
					{@const dim = hoveredId !== null && !isNeighbor(n.id)}
					{@const nx = _t >= 0 ? (n.x ?? 0) : 0}
					{@const ny = _t >= 0 ? (n.y ?? 0) : 0}
					<g
						data-node
						transform="translate({nx},{ny})"
						class="cursor-pointer"
						style="opacity: {dim ? 0.2 : 1}"
						onmouseenter={() => (hoveredId = n.id)}
						onmouseleave={() => {
							if (hoveredId === n.id) hoveredId = null;
						}}
						onclick={(e) => handleNodeClick(n, e)}
						onkeydown={(e) => handleNodeKey(n, e)}
						role="link"
						tabindex="0"
						{@attach nodeAttach}
					>
						<circle
							r="6"
							fill="#ffffff"
							stroke={TYPE_STROKE[n.type] ?? '#cbd5e1'}
							stroke-width="1.5"
						/>
						<text
							x="10"
							dy="0.32em"
							class="pointer-events-none"
							font-family="ui-monospace, SFMono-Regular, monospace"
							font-size="10"
							fill="#4b5563"
						>
							{shortLabel(n.title)}
						</text>
					</g>
				{/each}
			</g>
		</g>
	</svg>

	{#if presentTypes.length > 0}
		<div
			class="absolute bottom-4 left-4 rounded border border-gray-200 bg-white/90 px-3 py-2 backdrop-blur"
		>
			<div class="mb-1 font-mono text-[10px] tracking-wider text-gray-500 uppercase">
				types
			</div>
			<ul class="flex flex-col gap-1">
				{#each presentTypes as t (t)}
					<li class="flex items-center gap-2 font-mono text-[10px] text-gray-600">
						<span
							class="inline-block h-2 w-2 rounded-full border"
							style="border-color: {TYPE_STROKE[t] ?? '#cbd5e1'}; background:#fff"
						></span>
						{t}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
