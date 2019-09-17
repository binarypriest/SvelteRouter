<script>
	import { router, curRoute } from '../routes.js';
	export let name;	
</script>

<svelte:component this={router[$curRoute]} nav={router} naver={curRoute} />

