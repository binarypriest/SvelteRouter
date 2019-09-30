<script>
    export let path;
    export let ctrl;
    export let content;
    export let isLink = true;
    export let btnType = 'button'
    export let btnClass = 'btn-lg btn-primary btn-block';
    export let lnkClass = ''
    export let func = function(e){
        e.preventDefault();
        ctrl.set(path);
    }
</script>
{#if isLink == true}
    <a class={lnkClass} href={path} on:click={func}>{content}</a>
{:else}
  <button class="btn {btnClass}" type={btnType} on:click={func}>{content}</button>
{/if}