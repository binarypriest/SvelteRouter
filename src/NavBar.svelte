<script>
    export let className = '';
    export let nav;
    export let naver;
    export let isFooter = false;
    
    let src = 'images/logo.png';

    import { onMount } from 'svelte';
    import Navigator from './Navigator.svelte';

    onMount(() => {
        console.log('NavBar component mounted');
    });
    
    function logOut(e){
        e.preventDefault();
        naver.set('/');
    }
</script>
<div class="{className}">
    <nav>
        <div class="nav-wrapper">
            <a href="!#" class="brand-logo">
                <img {src} class="navbar-brand" alt="ELI Icon" />
            </a>
            {#if !isFooter}
                <ul id="nav-mobile" class="right hide-on-med-and-down">
                    <li>
                        <Navigator path="/" navctrl={naver} content="test" />
                    </li>
                </ul>
            {/if}
        </div>
    </nav>
</div>

<tester />