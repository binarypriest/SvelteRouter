<script>
    import SideBar from './SideBar.svelte';
    import { onMount } from 'svelte';
  import { router } from './routes.js';
</script>
<SideBar parms={router.routeParams}/>
