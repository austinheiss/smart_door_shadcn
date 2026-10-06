<script>
	import { Slider as SliderPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	// children = extra marks in the track, thumb = thumb face, thumbProps go on each thumb
	let {
		ref = $bindable(null),
		value = $bindable(),
		orientation = "horizontal",
		type = "single",
		class: className,
		children: marks,
		thumb,
		thumbProps = {},
		...restProps
	} = $props();
</script>

<SliderPrimitive.Root
	bind:ref
	bind:value={value}
	{type}
	{orientation}
	data-slot="slider"
	class={cn(
		"relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-orientation={orientation}
			data-slot="slider-track"
			class="bg-muted relative grow rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
		>
			<SliderPrimitive.Range
				data-slot="slider-range"
				class="bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
			/>
			{@render marks?.()}
		</span>
		{#each thumbItems as item (item.index)}
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				index={item.index}
				class="border-primary ring-ring/50 block size-4 shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
				{...thumbProps}
			>
				{@render thumb?.()}
			</SliderPrimitive.Thumb>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
