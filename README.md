# SvelteRouter
SvelteRouting Made easy!

This uses basic elements of svelte so no additional dependencies or libraries needed!

## Updates ##
  * I have implemented a second 'router' to allow conent routing withing components and not just routing from 'screen' to 'screen'.
  * I have implemented regular expression pattern matching to allow for parameters in the path attribute in Navigator components.
## route.js ##

This is where you import your components and and define the regular expression(s) used to retrieve any route parameters you specify.

```import LogIn from './LogIn.svelte';
import Dashboard from './Dashboard.svelte';
import Main from './Main.svelte';
import SecondMain from './SecondMain.svelte';
import { writable, get } from 'svelte/store';

let routePats = [/(home)(\/)?([0-9]+)?/g];
```
It is also where you define your router object which contains all of your routes.
It also contains a function that applies the defined regular expressions to each route.

```router = {
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
```
