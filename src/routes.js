import LogIn from './LogIn.svelte';	
import Dashboard from './Dashboard.svelte';
import Main from './Main.svelte';
import SecondMain from './SecondMain.svelte';
import { writable, get } from 'svelte/store';

let routePats = [/(home)(\/)?([0-9]+)?/g];
export let router = {
    '/': LogIn,
    '/home': Dashboard,
    '/main': Main,
    '/next': SecondMain,
     parseRoute:function(_v){
         let r = _v;
         routePats.forEach(function(p, i){
            router.routeParams = [];
            if(_v.match(p)){
                let vals = p.exec(_v);
                for(let i = 3; i < vals.length; i++){
                    router.routeParams.push(vals[i]);
                }
                r = `/${vals[1]}`;
            }
         });
         return r;
     },
     routeParams : []
}

export default router;
export const curRoute = (sessionStorage.getItem('cur_route')) ? writable(sessionStorage.getItem('cur_route')) : writable('/');
export const subRoute = (sessionStorage.getItem('sub_route')) ? writable(sessionStorage.getItem('sub_route')) : writable('/main');

curRoute.subscribe(function(v){
    sessionStorage.setItem('cur_route',v);
});
subRoute.subscribe(function(v){
    sessionStorage.setItem('sub_route',v);
});