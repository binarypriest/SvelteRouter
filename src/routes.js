import NavBar from './components/Navbar.svelte';
import LogIn from './components/LogIn.svelte';	
import { writable } from 'svelte/store';

export let router = {
    '/': LogIn,
    '/nav': NavBar
}

export default router;
export const curRoute = writable('/');