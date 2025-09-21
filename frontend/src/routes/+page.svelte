<script>
	import { localData } from '$lib/stores/data.svelte.js';
	import { onMount } from 'svelte';

	$inspect(localData.dict);

	onMount(() => {});
</script>

<div class="content">
	<div class="grid">
		{#each Object.values(localData.dict) as user}
			<div class="user">
				{user.name}
			</div>
		{/each}
	</div>
</div>

<style>
</style>
