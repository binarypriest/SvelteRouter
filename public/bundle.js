
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
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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

    /* src\Navigator.svelte generated by Svelte v3.12.1 */

    const file = "src\\Navigator.svelte";

    // (15:0) {:else}
    function create_else_block(ctx) {
    	var button, t, button_class_value, dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.content);
    			attr_dev(button, "class", button_class_value = "btn " + ctx.btnClass);
    			attr_dev(button, "type", ctx.btnType);
    			add_location(button, file, 15, 2, 401);
    			dispose = listen_dev(button, "click", ctx.func);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.content) {
    				set_data_dev(t, ctx.content);
    			}

    			if ((changed.btnClass) && button_class_value !== (button_class_value = "btn " + ctx.btnClass)) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (changed.btnType) {
    				attr_dev(button, "type", ctx.btnType);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(15:0) {:else}", ctx });
    	return block;
    }

    // (13:0) {#if isLink == true}
    function create_if_block(ctx) {
    	var a, t, dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(ctx.content);
    			attr_dev(a, "href", ctx.path);
    			add_location(a, file, 13, 4, 344);
    			dispose = listen_dev(a, "click", ctx.func);
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

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(a);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(13:0) {#if isLink == true}", ctx });
    	return block;
    }

    function create_fragment(ctx) {
    	var if_block_anchor;

    	function select_block_type(changed, ctx) {
    		if (ctx.isLink == true) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { path, navctrl, content, isLink = true, btnType = 'button', btnClass = 'btn-lg btn-primary btn-block', func = function(e){
            e.preventDefault();
            navctrl.set(path);
        } } = $$props;

    	const writable_props = ['path', 'navctrl', 'content', 'isLink', 'btnType', 'btnClass', 'func'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Navigator> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('path' in $$props) $$invalidate('path', path = $$props.path);
    		if ('navctrl' in $$props) $$invalidate('navctrl', navctrl = $$props.navctrl);
    		if ('content' in $$props) $$invalidate('content', content = $$props.content);
    		if ('isLink' in $$props) $$invalidate('isLink', isLink = $$props.isLink);
    		if ('btnType' in $$props) $$invalidate('btnType', btnType = $$props.btnType);
    		if ('btnClass' in $$props) $$invalidate('btnClass', btnClass = $$props.btnClass);
    		if ('func' in $$props) $$invalidate('func', func = $$props.func);
    	};

    	$$self.$capture_state = () => {
    		return { path, navctrl, content, isLink, btnType, btnClass, func };
    	};

    	$$self.$inject_state = $$props => {
    		if ('path' in $$props) $$invalidate('path', path = $$props.path);
    		if ('navctrl' in $$props) $$invalidate('navctrl', navctrl = $$props.navctrl);
    		if ('content' in $$props) $$invalidate('content', content = $$props.content);
    		if ('isLink' in $$props) $$invalidate('isLink', isLink = $$props.isLink);
    		if ('btnType' in $$props) $$invalidate('btnType', btnType = $$props.btnType);
    		if ('btnClass' in $$props) $$invalidate('btnClass', btnClass = $$props.btnClass);
    		if ('func' in $$props) $$invalidate('func', func = $$props.func);
    	};

    	return {
    		path,
    		navctrl,
    		content,
    		isLink,
    		btnType,
    		btnClass,
    		func
    	};
    }

    class Navigator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["path", "navctrl", "content", "isLink", "btnType", "btnClass", "func"]);
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

    	get isLink() {
    		throw new Error("<Navigator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isLink(value) {
    		throw new Error("<Navigator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get btnType() {
    		throw new Error("<Navigator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set btnType(value) {
    		throw new Error("<Navigator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get btnClass() {
    		throw new Error("<Navigator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set btnClass(value) {
    		throw new Error("<Navigator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get func() {
    		throw new Error("<Navigator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set func(value) {
    		throw new Error("<Navigator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\LogIn.svelte generated by Svelte v3.12.1 */

    const file$1 = "src\\LogIn.svelte";

    function create_fragment$1(ctx) {
    	var section, form, img, t0, label0, t2, input0, t3, label1, t5, input1, t6, div, label2, input2, t7, t8, t9, p, current;

    	var navigator = new Navigator({
    		props: {
    		path: "/home",
    		navctrl: ctx.naver,
    		content: "Sign In",
    		isLink: "false"
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			section = element("section");
    			form = element("form");
    			img = element("img");
    			t0 = space();
    			label0 = element("label");
    			label0.textContent = "Email address";
    			t2 = space();
    			input0 = element("input");
    			t3 = space();
    			label1 = element("label");
    			label1.textContent = "Password";
    			t5 = space();
    			input1 = element("input");
    			t6 = space();
    			div = element("div");
    			label2 = element("label");
    			input2 = element("input");
    			t7 = text(" Store");
    			t8 = space();
    			navigator.$$.fragment.c();
    			t9 = space();
    			p = element("p");
    			p.textContent = "© 2017-2019 Health Care Finance Direct";
    			attr_dev(img, "class", "mb-4 mx-auto d-block");
    			attr_dev(img, "src", src);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "width", "72");
    			attr_dev(img, "height", "72");
    			add_location(img, file$1, 53, 4, 1199);
    			attr_dev(label0, "for", "inputEmail");
    			attr_dev(label0, "class", "sr-only");
    			add_location(label0, file$1, 54, 4, 1275);
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "id", "inputEmail");
    			attr_dev(input0, "class", "form-control mb-2 svelte-zr31fl");
    			attr_dev(input0, "placeholder", "Email address");
    			input0.required = true;
    			add_location(input0, file$1, 55, 4, 1342);
    			attr_dev(label1, "for", "inputPassword");
    			attr_dev(label1, "class", "sr-only");
    			add_location(label1, file$1, 56, 4, 1449);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "inputPassword");
    			attr_dev(input1, "class", "form-control svelte-zr31fl");
    			attr_dev(input1, "placeholder", "Password");
    			input1.required = true;
    			add_location(input1, file$1, 57, 4, 1514);
    			attr_dev(input2, "type", "checkbox");
    			input2.value = "remember-me";
    			add_location(input2, file$1, 60, 8, 1667);
    			add_location(label2, file$1, 59, 6, 1650);
    			attr_dev(div, "class", "checkbox mb-3 svelte-zr31fl");
    			add_location(div, file$1, 58, 4, 1615);
    			attr_dev(p, "class", "mt-5 mb-3 text-muted");
    			add_location(p, file$1, 65, 4, 1925);
    			attr_dev(form, "class", "form-signin svelte-zr31fl");
    			add_location(form, file$1, 52, 2, 1167);
    			attr_dev(section, "class", "login-wrapper svelte-zr31fl");
    			add_location(section, file$1, 51, 0, 1132);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, form);
    			append_dev(form, img);
    			append_dev(form, t0);
    			append_dev(form, label0);
    			append_dev(form, t2);
    			append_dev(form, input0);
    			append_dev(form, t3);
    			append_dev(form, label1);
    			append_dev(form, t5);
    			append_dev(form, input1);
    			append_dev(form, t6);
    			append_dev(form, div);
    			append_dev(div, label2);
    			append_dev(label2, input2);
    			append_dev(label2, t7);
    			append_dev(form, t8);
    			mount_component(navigator, form, null);
    			append_dev(form, t9);
    			append_dev(form, p);
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
    				detach_dev(section);
    			}

    			destroy_component(navigator);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    let src = 'images/logo.png';

    function instance$1($$self, $$props, $$invalidate) {
    	
      let { nav, naver } = $$props;
        document.title = 'Login | ELI';

    	const writable_props = ['nav', 'naver'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<LogIn> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('nav' in $$props) $$invalidate('nav', nav = $$props.nav);
    		if ('naver' in $$props) $$invalidate('naver', naver = $$props.naver);
    	};

    	$$self.$capture_state = () => {
    		return { src, nav, naver };
    	};

    	$$self.$inject_state = $$props => {
    		if ('src' in $$props) $$invalidate('src', src = $$props.src);
    		if ('nav' in $$props) $$invalidate('nav', nav = $$props.nav);
    		if ('naver' in $$props) $$invalidate('naver', naver = $$props.naver);
    	};

    	return { nav, naver };
    }

    class LogIn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["nav", "naver"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "LogIn", options, id: create_fragment$1.name });

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

    /* src\SideBar.svelte generated by Svelte v3.12.1 */

    const file$2 = "src\\SideBar.svelte";

    function create_fragment$2(ctx) {
    	var div8, div2, div0, t1, div1, a0, t3, a1, t5, a2, t7, a3, t9, a4, t11, a5, t13, div7, nav, button0, t15, button1, span0, t16, div5, ul, li0, a6, t17, span1, t19, li1, a7, t21, li2, a8, t23, div4, a9, t25, a10, t27, div3, t28, a11, t30, div6, h1, t32, p0, t34, p1, t35, code0, t37, code1, t39, div8_class_value, dispose;

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "HFD";
    			t1 = space();
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "Dashboard";
    			t3 = space();
    			a1 = element("a");
    			a1.textContent = "Shortcuts";
    			t5 = space();
    			a2 = element("a");
    			a2.textContent = "Overview";
    			t7 = space();
    			a3 = element("a");
    			a3.textContent = "Events";
    			t9 = space();
    			a4 = element("a");
    			a4.textContent = "Profile";
    			t11 = space();
    			a5 = element("a");
    			a5.textContent = "Status";
    			t13 = space();
    			div7 = element("div");
    			nav = element("nav");
    			button0 = element("button");
    			button0.textContent = "Toggle Menu";
    			t15 = space();
    			button1 = element("button");
    			span0 = element("span");
    			t16 = space();
    			div5 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			a6 = element("a");
    			t17 = text("Home ");
    			span1 = element("span");
    			span1.textContent = "(current)";
    			t19 = space();
    			li1 = element("li");
    			a7 = element("a");
    			a7.textContent = "Link";
    			t21 = space();
    			li2 = element("li");
    			a8 = element("a");
    			a8.textContent = "Dropdown";
    			t23 = space();
    			div4 = element("div");
    			a9 = element("a");
    			a9.textContent = "Action";
    			t25 = space();
    			a10 = element("a");
    			a10.textContent = "Another action";
    			t27 = space();
    			div3 = element("div");
    			t28 = space();
    			a11 = element("a");
    			a11.textContent = "Something else here";
    			t30 = space();
    			div6 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Simple Sidebar";
    			t32 = space();
    			p0 = element("p");
    			p0.textContent = "The starting state of the menu will appear collapsed on smaller screens, and will appear non-collapsed on larger screens. When toggled using the button below, the menu will change.";
    			t34 = space();
    			p1 = element("p");
    			t35 = text("Make sure to keep all page content within the ");
    			code0 = element("code");
    			code0.textContent = "#page-content-wrapper";
    			t37 = text(". The top navbar is optional, and just for demonstration. Just create an element with the ");
    			code1 = element("code");
    			code1.textContent = "#menu-toggle";
    			t39 = text(" ID which will toggle the menu when clicked.");
    			attr_dev(div0, "class", "sidebar-heading svelte-qb454");
    			add_location(div0, file$2, 55, 6, 1048);
    			attr_dev(a0, "href", "!#");
    			attr_dev(a0, "class", "list-group-item list-group-item-action bg-light svelte-qb454");
    			add_location(a0, file$2, 57, 8, 1145);
    			attr_dev(a1, "href", "!#");
    			attr_dev(a1, "class", "list-group-item list-group-item-action bg-light svelte-qb454");
    			add_location(a1, file$2, 58, 8, 1237);
    			attr_dev(a2, "href", "!#");
    			attr_dev(a2, "class", "list-group-item list-group-item-action bg-light svelte-qb454");
    			add_location(a2, file$2, 59, 8, 1329);
    			attr_dev(a3, "href", "!#");
    			attr_dev(a3, "class", "list-group-item list-group-item-action bg-light svelte-qb454");
    			add_location(a3, file$2, 60, 8, 1420);
    			attr_dev(a4, "href", "!#");
    			attr_dev(a4, "class", "list-group-item list-group-item-action bg-light svelte-qb454");
    			add_location(a4, file$2, 61, 8, 1509);
    			attr_dev(a5, "href", "!#");
    			attr_dev(a5, "class", "list-group-item list-group-item-action bg-light svelte-qb454");
    			add_location(a5, file$2, 62, 8, 1599);
    			attr_dev(div1, "class", "list-group list-group-flush svelte-qb454");
    			add_location(div1, file$2, 56, 6, 1094);
    			attr_dev(div2, "class", "bg-light border-right svelte-qb454");
    			attr_dev(div2, "id", "sidebar-wrapper");
    			add_location(div2, file$2, 54, 4, 984);
    			attr_dev(button0, "class", "btn btn-primary");
    			attr_dev(button0, "id", "menu-toggle");
    			add_location(button0, file$2, 67, 8, 1832);
    			attr_dev(span0, "class", "navbar-toggler-icon");
    			add_location(span0, file$2, 70, 10, 2157);
    			attr_dev(button1, "class", "navbar-toggler");
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "data-toggle", "collapse");
    			attr_dev(button1, "data-target", "#navbarSupportedContent");
    			attr_dev(button1, "aria-controls", "navbarSupportedContent");
    			attr_dev(button1, "aria-expanded", "false");
    			attr_dev(button1, "aria-label", "Toggle navigation");
    			add_location(button1, file$2, 68, 8, 1928);
    			attr_dev(span1, "class", "sr-only");
    			add_location(span1, file$2, 75, 49, 2442);
    			attr_dev(a6, "class", "nav-link");
    			attr_dev(a6, "href", "!#");
    			add_location(a6, file$2, 75, 14, 2407);
    			attr_dev(li0, "class", "nav-item active");
    			add_location(li0, file$2, 74, 12, 2363);
    			attr_dev(a7, "class", "nav-link");
    			attr_dev(a7, "href", "!#");
    			add_location(a7, file$2, 78, 14, 2554);
    			attr_dev(li1, "class", "nav-item");
    			add_location(li1, file$2, 77, 12, 2517);
    			attr_dev(a8, "class", "nav-link dropdown-toggle");
    			attr_dev(a8, "href", "!#");
    			attr_dev(a8, "id", "navbarDropdown");
    			attr_dev(a8, "role", "button");
    			attr_dev(a8, "data-toggle", "dropdown");
    			attr_dev(a8, "aria-haspopup", "true");
    			attr_dev(a8, "aria-expanded", "false");
    			add_location(a8, file$2, 81, 14, 2671);
    			attr_dev(a9, "class", "dropdown-item");
    			attr_dev(a9, "href", "!#");
    			add_location(a9, file$2, 85, 16, 2977);
    			attr_dev(a10, "class", "dropdown-item");
    			attr_dev(a10, "href", "!#");
    			add_location(a10, file$2, 86, 16, 3040);
    			attr_dev(div3, "class", "dropdown-divider");
    			add_location(div3, file$2, 87, 16, 3111);
    			attr_dev(a11, "class", "dropdown-item");
    			attr_dev(a11, "href", "!#");
    			add_location(a11, file$2, 88, 16, 3165);
    			attr_dev(div4, "class", "dropdown-menu dropdown-menu-right");
    			attr_dev(div4, "aria-labelledby", "navbarDropdown");
    			add_location(div4, file$2, 84, 14, 2879);
    			attr_dev(li2, "class", "nav-item dropdown");
    			add_location(li2, file$2, 80, 12, 2625);
    			attr_dev(ul, "class", "navbar-nav ml-auto mt-2 mt-lg-0");
    			add_location(ul, file$2, 73, 10, 2305);
    			attr_dev(div5, "class", "collapse navbar-collapse");
    			attr_dev(div5, "id", "navbarSupportedContent");
    			add_location(div5, file$2, 72, 8, 2227);
    			attr_dev(nav, "class", "navbar navbar-expand-lg navbar-light bg-light border-bottom");
    			add_location(nav, file$2, 66, 6, 1749);
    			attr_dev(h1, "class", "mt-4");
    			add_location(h1, file$2, 95, 8, 3358);
    			add_location(p0, file$2, 96, 8, 3404);
    			add_location(code0, file$2, 97, 57, 3650);
    			add_location(code1, file$2, 97, 181, 3774);
    			add_location(p1, file$2, 97, 8, 3601);
    			attr_dev(div6, "class", "container-fluid");
    			add_location(div6, file$2, 94, 6, 3319);
    			attr_dev(div7, "id", "page-content-wrapper");
    			attr_dev(div7, "class", "svelte-qb454");
    			add_location(div7, file$2, 65, 4, 1710);
    			attr_dev(div8, "class", div8_class_value = "d-flex " + ctx.flag + " svelte-qb454");
    			attr_dev(div8, "id", "wrapper");
    			add_location(div8, file$2, 53, 2, 938);
    			dispose = listen_dev(button0, "click", ctx.toggle);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, a0);
    			append_dev(div1, t3);
    			append_dev(div1, a1);
    			append_dev(div1, t5);
    			append_dev(div1, a2);
    			append_dev(div1, t7);
    			append_dev(div1, a3);
    			append_dev(div1, t9);
    			append_dev(div1, a4);
    			append_dev(div1, t11);
    			append_dev(div1, a5);
    			append_dev(div8, t13);
    			append_dev(div8, div7);
    			append_dev(div7, nav);
    			append_dev(nav, button0);
    			append_dev(nav, t15);
    			append_dev(nav, button1);
    			append_dev(button1, span0);
    			append_dev(nav, t16);
    			append_dev(nav, div5);
    			append_dev(div5, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a6);
    			append_dev(a6, t17);
    			append_dev(a6, span1);
    			append_dev(ul, t19);
    			append_dev(ul, li1);
    			append_dev(li1, a7);
    			append_dev(ul, t21);
    			append_dev(ul, li2);
    			append_dev(li2, a8);
    			append_dev(li2, t23);
    			append_dev(li2, div4);
    			append_dev(div4, a9);
    			append_dev(div4, t25);
    			append_dev(div4, a10);
    			append_dev(div4, t27);
    			append_dev(div4, div3);
    			append_dev(div4, t28);
    			append_dev(div4, a11);
    			append_dev(div7, t30);
    			append_dev(div7, div6);
    			append_dev(div6, h1);
    			append_dev(div6, t32);
    			append_dev(div6, p0);
    			append_dev(div6, t34);
    			append_dev(div6, p1);
    			append_dev(p1, t35);
    			append_dev(p1, code0);
    			append_dev(p1, t37);
    			append_dev(p1, code1);
    			append_dev(p1, t39);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.flag) && div8_class_value !== (div8_class_value = "d-flex " + ctx.flag + " svelte-qb454")) {
    				attr_dev(div8, "class", div8_class_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div8);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let flag = '';
      function toggle(){  
          console.log('hi jason');  
          if(flag != ''){
              $$invalidate('flag', flag = '');
          }else{
              $$invalidate('flag', flag = 'toggled');
          }
      }

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('flag' in $$props) $$invalidate('flag', flag = $$props.flag);
    	};

    	return { flag, toggle };
    }

    class SideBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "SideBar", options, id: create_fragment$2.name });
    	}
    }

    /* src\Dashboard.svelte generated by Svelte v3.12.1 */

    function create_fragment$3(ctx) {
    	var current;

    	var sidebar = new SideBar({ $$inline: true });

    	const block = {
    		c: function create() {
    			sidebar.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    class Dashboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Dashboard", options, id: create_fragment$3.name });
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
        '/home': Dashboard
    };
    const curRoute = writable('/');

    /* src\App.svelte generated by Svelte v3.12.1 */

    function create_fragment$4(ctx) {
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
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
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, ["name"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$4.name });

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
