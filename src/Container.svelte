<script>
    export let base;
	import { router, curRoute, subRoute } from './routes.js';
</script>
{#if base == 'cur'}
    <svelte:component this={router[router.parseRoute($curRoute)]} nav={router} navctrl={curRoute} />
{:else}
    <svelte:component this={router[$subRoute]} nav={router} navctrl={subRoute} />
{/if}


