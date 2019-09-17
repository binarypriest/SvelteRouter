<script>
    export let path;
    export let navctrl;
    export let content;

    function clicked(e){
        e.preventDefault();
        navctrl.set(path);
    }
</script>

<a href={path} on:click={clicked}>{content}</a>