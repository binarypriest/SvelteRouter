
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\components\Navigator.svelte generated by Svelte v3.12.1 */

    const file = "src\\components\\Navigator.svelte";

    function create_fragment(ctx) {
    	var a, t, dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(ctx.content);
    			attr_dev(a, "href", ctx.path);
    			add_location(a, file, 11, 0, 187);
    			dispose = listen_dev(a, "click", ctx.clicked);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.content) {
    				set_data_dev(t, ctx.content);
    			}

    			if (changed.path) {
    				attr_dev(a, "href", ctx.path);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(a);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { path, navctrl, content } = $$props;

        function clicked(e){
            e.preventDefault();
            navctrl.set(path);
        }

    	const writable_props = ['path', 'navctrl', 'content'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Navigator> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('path' in $$props) $$invalidate('path', path = $$props.path);
    		if ('navctrl' in $$props) $$invalidate('navctrl', navctrl = $$props.navctrl);
    		if ('content' in $$props) $$invalidate('content', content = $$props.content);
    	};

    	$$self.$capture_state = () => {
    		return { path, navctrl, content };
    	};

    	$$self.$inject_state = $$props => {
    		if ('path' in $$props) $$invalidate('path', path = $$props.path);
    		if ('navctrl' in $$props) $$invalidate('navctrl', navctrl = $$props.navctrl);
    		if ('content' in $$props) $$invalidate('content', content = $$props.content);
    	};

    	return { path, navctrl, content, clicked };
    }

    class Navigator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["path", "navctrl", "content"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Navigator", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.path === undefined && !('path' in props)) {
    			console.warn("<Navigator> was created without expected prop 'path'");
    		}
    		if (ctx.navctrl === undefined && !('navctrl' in props)) {
    			console.warn("<Navigator> was created without expected prop 'navctrl'");
    		}
    		if (ctx.content === undefined && !('content' in props)) {
    			console.warn("<Navigator> was created without expected prop 'content'");
    		}
    	}

    	get path() {
    		throw new Error("<Navigator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set path(value) {
    		throw new Error("<Navigator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get navctrl() {
    		throw new Error("<Navigator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set navctrl(value) {
    		throw new Error("<Navigator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get content() {
    		throw new Error("<Navigator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<Navigator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Navbar.svelte generated by Svelte v3.12.1 */
    const { console: console_1 } = globals;

    const file$1 = "src\\components\\Navbar.svelte";

    // (25:12) {#if !isFooter}
    function create_if_block(ctx) {
    	var ul, li, current;

    	var navigator = new Navigator({
    		props: {
    		path: "/",
    		navctrl: ctx.naver,
    		content: "test"
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li = element("li");
    			navigator.$$.fragment.c();
    			add_location(li, file$1, 26, 20, 717);
    			attr_dev(ul, "id", "nav-mobile");
    			attr_dev(ul, "class", "right hide-on-med-and-down");
    			add_location(ul, file$1, 25, 16, 640);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li);
    			mount_component(navigator, li, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var navigator_changes = {};
    			if (changed.naver) navigator_changes.navctrl = ctx.naver;
    			navigator.$set(navigator_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigator.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(navigator.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(ul);
    			}

    			destroy_component(navigator);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(25:12) {#if !isFooter}", ctx });
    	return block;
    }

    function create_fragment$1(ctx) {
    	var div1, nav_1, div0, a, img, t0, t1, tester, current;

    	var if_block = (!ctx.isFooter) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			nav_1 = element("nav");
    			div0 = element("div");
    			a = element("a");
    			img = element("img");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			tester = element("tester");
    			attr_dev(img, "src", "images/ELIicon.png");
    			attr_dev(img, "class", "navbar-brand");
    			attr_dev(img, "alt", "ELI Icon");
    			add_location(img, file$1, 22, 16, 507);
    			attr_dev(a, "href", "!#");
    			attr_dev(a, "class", "brand-logo");
    			add_location(a, file$1, 21, 12, 457);
    			attr_dev(div0, "class", "nav-wrapper");
    			add_location(div0, file$1, 20, 8, 418);
    			add_location(nav_1, file$1, 19, 4, 403);
    			attr_dev(div1, "class", ctx.className);
    			add_location(div1, file$1, 18, 0, 372);
    			add_location(tester, file$1, 35, 0, 909);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, nav_1);
    			append_dev(nav_1, div0);
    			append_dev(div0, a);
    			append_dev(a, img);
    			append_dev(div0, t0);
    			if (if_block) if_block.m(div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, tester, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!ctx.isFooter) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}

    			if (!current || changed.className) {
    				attr_dev(div1, "class", ctx.className);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			if (if_block) if_block.d();

    			if (detaching) {
    				detach_dev(t1);
    				detach_dev(tester);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { className = '', nav, naver, isFooter = false } = $$props;

        onMount(() => {
            console.log('NavBar component mounted');
        });

    	const writable_props = ['className', 'nav', 'naver', 'isFooter'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('className' in $$props) $$invalidate('className', className = $$props.className);
    		if ('nav' in $$props) $$invalidate('nav', nav = $$props.nav);
    		if ('naver' in $$props) $$invalidate('naver', naver = $$props.naver);
    		if ('isFooter' in $$props) $$invalidate('isFooter', isFooter = $$props.isFooter);
    	};

    	$$self.$capture_state = () => {
    		return { className, nav, naver, isFooter };
    	};

    	$$self.$inject_state = $$props => {
    		if ('className' in $$props) $$invalidate('className', className = $$props.className);
    		if ('nav' in $$props) $$invalidate('nav', nav = $$props.nav);
    		if ('naver' in $$props) $$invalidate('naver', naver = $$props.naver);
    		if ('isFooter' in $$props) $$invalidate('isFooter', isFooter = $$props.isFooter);
    	};

    	return { className, nav, naver, isFooter };
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["className", "nav", "naver", "isFooter"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Navbar", options, id: create_fragment$1.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.nav === undefined && !('nav' in props)) {
    			console_1.warn("<Navbar> was created without expected prop 'nav'");
    		}
    		if (ctx.naver === undefined && !('naver' in props)) {
    			console_1.warn("<Navbar> was created without expected prop 'naver'");
    		}
    	}

    	get className() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set className(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nav() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nav(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get naver() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set naver(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isFooter() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isFooter(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\LogIn.svelte generated by Svelte v3.12.1 */

    const file$2 = "src\\components\\LogIn.svelte";

    function create_fragment$2(ctx) {
    	var div10, div9, div8, div7, div0, img, t0, div6, form, div5, div1, input0, t1, label0, t3, div2, input1, t4, label1, t6, div3, label2, input2, t7, span, t9, div4, button, dispose;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div6 = element("div");
    			form = element("form");
    			div5 = element("div");
    			div1 = element("div");
    			input0 = element("input");
    			t1 = space();
    			label0 = element("label");
    			label0.textContent = "Username";
    			t3 = space();
    			div2 = element("div");
    			input1 = element("input");
    			t4 = space();
    			label1 = element("label");
    			label1.textContent = "Password";
    			t6 = space();
    			div3 = element("div");
    			label2 = element("label");
    			input2 = element("input");
    			t7 = space();
    			span = element("span");
    			span.textContent = "Remember Me";
    			t9 = space();
    			div4 = element("div");
    			button = element("button");
    			button.textContent = "Log In";
    			attr_dev(img, "src", "/images/ELIicon.png");
    			attr_dev(img, "alt", "ELI Icon");
    			attr_dev(img, "class", "card-img");
    			add_location(img, file$2, 18, 12, 497);
    			attr_dev(div0, "class", "card-title center-align");
    			add_location(div0, file$2, 17, 10, 446);
    			attr_dev(input0, "id", "user_name");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "validate");
    			add_location(input0, file$2, 24, 24, 761);
    			attr_dev(label0, "for", "user_name");
    			add_location(label0, file$2, 25, 24, 838);
    			attr_dev(div1, "class", "input-field col s12");
    			add_location(div1, file$2, 23, 20, 702);
    			attr_dev(input1, "id", "pass_word");
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "class", "validate");
    			add_location(input1, file$2, 28, 24, 986);
    			attr_dev(label1, "for", "pass_word");
    			add_location(label1, file$2, 29, 24, 1067);
    			attr_dev(div2, "class", "input-field col s12");
    			add_location(div2, file$2, 27, 20, 927);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$2, 33, 28, 1240);
    			add_location(span, file$2, 34, 28, 1295);
    			add_location(label2, file$2, 32, 24, 1203);
    			attr_dev(div3, "class", "col s12");
    			add_location(div3, file$2, 31, 20, 1156);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "waves-effect waves-light btn blue");
    			add_location(button, file$2, 38, 24, 1463);
    			attr_dev(div4, "class", "col s12 center-align");
    			add_location(div4, file$2, 37, 20, 1403);
    			attr_dev(div5, "class", "row svelte-n5fdhs");
    			add_location(div5, file$2, 22, 16, 663);
    			attr_dev(form, "class", "col s12");
    			add_location(form, file$2, 21, 12, 623);
    			attr_dev(div6, "class", "row svelte-n5fdhs");
    			add_location(div6, file$2, 20, 10, 592);
    			attr_dev(div7, "class", "card-content white-text");
    			add_location(div7, file$2, 16, 8, 397);
    			attr_dev(div8, "class", "card gray lighten-1 valign z-depth-3");
    			add_location(div8, file$2, 15, 6, 337);
    			attr_dev(div9, "class", "col s12 m4 offset-m4 valign-wrapper");
    			set_style(div9, "height", "80vh");
    			add_location(div9, file$2, 14, 4, 260);
    			attr_dev(div10, "class", "row svelte-n5fdhs");
    			set_style(div10, "height", "80vh");
    			add_location(div10, file$2, 13, 0, 217);
    			dispose = listen_dev(button, "click", ctx.logIn);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div0);
    			append_dev(div0, img);
    			append_dev(div7, t0);
    			append_dev(div7, div6);
    			append_dev(div6, form);
    			append_dev(form, div5);
    			append_dev(div5, div1);
    			append_dev(div1, input0);
    			append_dev(div1, t1);
    			append_dev(div1, label0);
    			append_dev(div5, t3);
    			append_dev(div5, div2);
    			append_dev(div2, input1);
    			append_dev(div2, t4);
    			append_dev(div2, label1);
    			append_dev(div5, t6);
    			append_dev(div5, div3);
    			append_dev(div3, label2);
    			append_dev(label2, input2);
    			append_dev(label2, t7);
    			append_dev(label2, span);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			append_dev(div4, button);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div10);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { nav, naver } = $$props;
        document.title = 'Login | ELI';
        function logIn(){
          naver.set('/nav');
        }

    	const writable_props = ['nav', 'naver'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<LogIn> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('nav' in $$props) $$invalidate('nav', nav = $$props.nav);
    		if ('naver' in $$props) $$invalidate('naver', naver = $$props.naver);
    	};

    	$$self.$capture_state = () => {
    		return { nav, naver };
    	};

    	$$self.$inject_state = $$props => {
    		if ('nav' in $$props) $$invalidate('nav', nav = $$props.nav);
    		if ('naver' in $$props) $$invalidate('naver', naver = $$props.naver);
    	};

    	return { nav, naver, logIn };
    }

    class LogIn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["nav", "naver"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "LogIn", options, id: create_fragment$2.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.nav === undefined && !('nav' in props)) {
    			console.warn("<LogIn> was created without expected prop 'nav'");
    		}
    		if (ctx.naver === undefined && !('naver' in props)) {
    			console.warn("<LogIn> was created without expected prop 'naver'");
    		}
    	}

    	get nav() {
    		throw new Error("<LogIn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nav(value) {
    		throw new Error("<LogIn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get naver() {
    		throw new Error("<LogIn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set naver(value) {
    		throw new Error("<LogIn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let router = {
        '/': LogIn,
        '/nav': Navbar
    };
    const curRoute = writable('/');

    /* src\components\App.svelte generated by Svelte v3.12.1 */

    function create_fragment$3(ctx) {
    	var switch_instance_anchor, current;

    	var switch_value = router[ctx.$curRoute];

    	function switch_props(ctx) {
    		return {
    			props: { nav: router, naver: curRoute },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) switch_instance.$$.fragment.c();
    			switch_instance_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (switch_value !== (switch_value = router[ctx.$curRoute])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;
    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});
    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());

    					switch_instance.$$.fragment.c();
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(switch_instance_anchor);
    			}

    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $curRoute;

    	validate_store(curRoute, 'curRoute');
    	component_subscribe($$self, curRoute, $$value => { $curRoute = $$value; $$invalidate('$curRoute', $curRoute); });

    	let { name } = $$props;

    	const writable_props = ['name'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    	};

    	$$self.$capture_state = () => {
    		return { name, $curRoute };
    	};

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('$curRoute' in $$props) curRoute.set($curRoute);
    	};

    	return { name, $curRoute };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["name"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$3.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
