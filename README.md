# Q.js
All-In-One Front-End Web Framework from Qbix, alternative to jQuery, Angular, Vue etc.

Size: ~40KB (Minified + GZipped), [compare to other frameworks](https://gist.github.com/Restuta/cda69e50a853aa64912d)

How to use: copy contents of `dist` into your project, and then include it like this:
| File Type | Code to Use |
|------------|-------------|
|`.html` files| `<script type="module">import { Q } from './Q.js</script>`|
|`.js` or `.ts` files|`import Q from './Q.js';`
|<img src="https://github.com/user-attachments/assets/ba3df93e-0cd8-4189-93fc-11947b63b684" alt="Description" width="100" height="87"> | Full documentation here: https://qbix.com/platform/guide/javascript |

This is part of the much larger full-stack [Qbix Platform](https://github.com/Qbix/Platform) that contains many pre-built reusable tools, plugins, and requires PHP and Node.js on the back-end. If you want to build an entire full-stack social network like Facebook you're well-advised to go with that. But if you just want to use the lightweight front-end core, with your own back-end and other frameworks, then start with this framework here.

# 🌟 Advantages of Q.minimal.js

- **Smaller than all the major frameworks**  
  ~40KB gzipped (smaller than React without ReactDOM, smaller than Vue runtime, far smaller than Angular)

- **No build step required**  
  Just drop it in — works with plain `.html <template>` files or with JS/Handlebars templates

- **Components & Tools model**  
  Like React components or Vue directives, but attachable as behaviors to any DOM element

- **Faster rendering**  
  Uses `requestAnimationFrame` and `.rendering()` instead of reconciling a giant virtual DOM

- **Built-in power in the core**  
  Includes batching, caching, lazyloading, routing, slot-based page activation — no need for extra libraries

- **Universal dev model**  
  Designers can use pure HTML, developers can use JS — both approaches work interchangeably

- **Incremental adoption**  
  Can be dropped into any existing site without rewriting or compiling anything

- **Supports both `.html` and `.js` components**  
  Write Vue-style `<template>` components or define JS/Handlebars templates — whichever you prefer

# 🔍 Features

Despite its size, Q.js implements many features not found in other front-end frameworks.
Here is an overview of the main ones:

| Class Name | Description |
|------------|-------------|
| `Q.Tool`  | reusable components, activate with `Q.activate(element)` |
| `Q.Page`  | HTML pages, [for your SPA](https://developer.mozilla.org/en-US/docs/Glossary/SPA), routes, browser history |
| `Q.Event`  | events and handlers, loaded and unloaded automatically |
| `Q.Template` | for rendering templates, integrates with [Handlebars](https://github.com/handlebars-lang/handlebars.js) |
| `Q.Text` | for loading internationalized translations and text for templates |
| `Q.Method` | defines methods loading JS files asynchronously as needed |
| `Q.Visual` | managing the front end interface, standard hints, as well as `Q.Mask` |
| `Q.Animation` | for animating using [native Javascript animation](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) |
| `Q.Audio` | speaking, loading and playing audio, etc. |
| `Q.IndexedDB` | for easy interaction with the built-in IndexedDB |
| `Q.ServiceWorker` | to manage service workers in a standard way |
| Requests | `Q.request()`, `Q.handle()`, `Q.loadUrl()`, `Q.addScript()`, `Q.addStylesheet()` |
| Flow | `Q.chain()`, `Q.getter()`, `Q.batcher()`, `Q.promisify()`, `Q.debounce()` |
| Helpers | `Q.find()`, `Q.activate()`, `Q.cookie()`, `Q.handle()` |

# ⚖️ Comparison with React, Vue, Angular, Svelte

| Feature 🏆                | **Q.js** ⚡ (40KB) | **React** 🏗️ | **Vue** 🎨 | **Angular** 🏛️ | **Svelte** 🔥 |
|---------------------------|------------------|--------------|------------|----------------|---------------|
| **Bundle Size** 📦        | **~40KB gzipped (core + tools + events + routing)** | 42KB + ReactDOM (120KB) | ~60KB runtime | 140KB+ | ~50KB compiler/runtime |
| **Build Step** 🛠️         | **None (drop-in, works with `.html` + `.js`)** | Required | Required | Required | Required |
| **Rendering Approach** 🎨 | **Direct DOM Updates (No Diffing, No Virtual DOM)** | Virtual DOM diffing | Virtual DOM diffing | Change detection via zones | Precompiled updates (no VDOM, still re-renders) |
| **Performance** ⚡         | **Ultra-Fast (Only Updates What’s Needed, No Extra Work)** | Good, but reconciliation overhead | Good, but reconciliation overhead | Heavy watchers/zones | Fast, but dependencies rerender |
| **Memory Usage** 🧠        | **Low (No Virtual DOM, Minimal Garbage Collection)** | Higher (VDOM objects + GC) | Higher (VDOM overhead) | Higher (framework runtime) | Lower than React, some overhead |
| **State Management** 📦   | **Q.Streams + Events (lightweight, no reconciliation)** | React state / Redux / Context | Vuex / Pinia | Services | Reactive stores |
| **SSR & Hydration** 🌍     | **Pre-renders HTML + activates Tools dynamically** | Hydrates VDOM (slower) | Hydrates VDOM | Hydrates Angular components | Needs hydration after precompile |
| **Component Model** 🧩    | **Q.Tools (behaviors on any DOM element)** | JSX + Hooks | Directives + templates | Components + decorators | Compiled components |
| **Interactivity & Events** 🎭 | **Direct event binding (auto-cleans on removal)** | Event handlers in JSX (hook dependencies) | Event handlers in templates | Angular event bindings | Reactive bindings |
| **Batch Updates** 🚀      | **Efficient (requestAnimationFrame + `.rendering()`)** | `setState` batching | NextTick batching | Zone-based batching | Dependency-based, no explicit batching |
| **Lazy Loading** 💤       | **Built-in (images, tools, components auto-lazyload)** | Needs 3rd party libs | Needs 3rd party libs | Built-in, but heavy | Manual setup |
| **Internationalization** 🌐 | **Built-in (`Q.Text`)** | 3rd party | 3rd party | i18n module | 3rd party |
| **Incremental Adoption** 🔌 | **Yes (drop-in, enhance existing HTML without rewrite)** | No | No | No | No |
| **SEO & Progressive Enhancement** 🔍 | **Works with static HTML (enhances dynamically)** | Needs JS hydration | Needs JS hydration | Needs JS hydration | Needs JS for interactivity |
| **Ecosystem Dependence** 🌐 | **All-in-one (routing, templates, events, batching, caching built-in)** | Needs Router, Redux, i18n, etc. | Needs Vuex, Router, i18n | Huge framework but still many extra libs | Needs Kit/Sapper + libs |
| **Learning Curve** 📚     | **Simple (declarative, minimal magic)** | Medium-high (hooks, context, JSX) | Medium (directives, reactivity caveats) | High (decorators, DI, RxJS) | Medium |
| **Best For** ✅            | **High-performance apps, real-time dashboards, low-latency UI, social platforms** | Full-scale apps, large component hierarchies | Small-to-medium apps, good DX | Enterprise-scale apps | Small-to-medium apps, hobby projects |


# Overview

## 📝 Templates

You can dynamically create elements in a React-like way, such as this:

```javascript
Q.element('div', {id: "foo", "class": "bar baz"}, [
   Q.element('img', {src: "foo.png"}),
   Q.element('img', {src: "bar.png"})
]); 
```

Instead, you can define [Handlebars templates](https://github.com/handlebars-lang/handlebars.js) like this:
```javascript
Q.Template.set("Namespace/some/name", `put your template here`);
```

And then render them later like this:
```javascript
Q.Template.render("Namespace/some/name").then(html => Q.replace(element, html));
```

Rendering templates that haven't been set yet causes requests to autoload from inside `Q.Template.load.options.dir`

## 🛠️ Tools

Tools represent re-usable components in Q.js -- just like in other front-end libraries, except Tools are only one part of a unified framework!

Here's how to define new types of Tools. Normally you'd define each one in its own file:

File: `Namespace/js/tools/cool/name.js`:
```javascript
Q.Tool.define("Namespace/cool/name", constructor, defaultOptions, methods);
```
File: `Namespace/js/tools/another.js`:
```javascript
Q.Tool.define("Namespace/another", function (options) {
  this.refresh(); // call method of tool
}, {
  x: 1,
  y: 2
}, {
  refresh: function () {
    this.state; // copy of options
    this.element; // the element it was activated on
    this.renderTemplate('Namespace/another/view', this.state, {
        some: options,
        'Namespace_cool_name_tool': {
            some: childToolOptions
        }
    }).then(function (html, elements, tools) {
        // now this.x and this.y point to elements from
        // the template that was rendered, while
        this.element.forEachTool('Namespace/cool/name', function () {
            // run whenever a child tool activates
        });
    });
    // this is how we handle in-place updates if x or y changes:
    this.rendering([x, y], (changed, previous, timestamp) => {
      Q.replace(this.elements.x, x); // very quick
      Q.replace(this.elements.y, y); // very quick
      this.element.addClass('updated_flash'); // some CSS effect
    });
    // to trigger these, anyone can simply call tool.stateChanged('x')
  },
  Q: {
    onInit: function () {
      // all child tools have been initialized
    }
    beforeRemove: function () {
      // cleanup, but see Events section!
    }
  }
});

// define a template with a child tool
Q.Template.set("Namespace/another/view",
   `<span class="Namespace_another_x">{{x}}</span>
    <span class="Namespace_another_y">{{y}}</span>
    {{{tool "Namespace/cool/name" "some-child-id" x=x y=3 z="foo"}}}`,
   {
      "elements": {
         "x": ".Namespace_another_x",
         "y": ".Namespace_another_y"
      }
   }
);
```

Optionally, you can also define tools in HTML files, Vue-style, which may result in nicer
syntax highlighting for both the HTML templates and the Javascript:

```html
<template id="Namespace/another/view">
   <span class="Namespace_another_x">{{x}}</span>
</template>
<script>
Q.Tool.define("Namespace/another/x", constructor, defaultOptions, methods);
// you can Q.Template.render("Namespace/another/view") as above
</script>
```

How to include tools in HTML:
```html
<div class="Q_tool Namespace_tool_name Namespace-another-tool"
  data-namespace-cool-name='{
    "some": { "options": "go"}, "here": 2
  }'
  data-namespace-another='{
    "some": [ "other", options", here" ]
  }'
>
   <p>optionally might give the tool initial content</p>
</div>
```

How to prepare tools in JS:
```javascript
// new component:
Q.Tool.prepare('div', toolName, options); // new div
// or add behaviors to existing element:
Q.Tool.prepare(element, toolName, options);
Q.Tool.prepare(element, anotherTool, otherOptions);
```

Multiple Tools can be defined on the same element.
The `Q.activate()` function uses `Q.find()` to recursively find all elements with `Q_tool` CSS class, and then
activates the tools in the order they've been defined. 
Tools are activated parent->child->grandchild, and then initialized grandchild->child->parent.
You can pass options at activation-time, too, targeting tools by `.classname` or `#id`:

```javascript
Q.activate(element, {
  '#specific_id': {
    "override": { "some": "options" },
  },
  '.Namespace_another_tool': {
     "some": ["more", "options" ]
  }
}); // finds and activates tools, then initializes them
```

Whenever you call `Q.activate(document.body)` it will traverse the whole document body, so it's slightly faster to call
`Q.activate()` on containers where you've recently replaced HTML, rather than the whole document body.

You can remove tools manually before removing elements:
```javascript
Q.Tool.clear(container); // child elements only
Q.Tool.remove(element); // also on element itself
```

but you usually don't need to, because `Q.replace(element, source)` does this for you automatically.
The `source` can be an element, document fragment, or some HTML string.

Some tools might have `data-q-retain` attributes, causing them to be retained, and not removed and re-activated, if the incoming
HTML has the same tool IDs. When a tool is retained, its `tool.Q.onRetain` event is triggered.
However, incoming tools with a `data-q-replace` attributes replace even tools that had `data-q-retain` set.

Q.js even overrides `$.fn.html()` and `$.fn.activate()` in libraries like jQuery and $cash so that you can call the following
to automatically cause old tools to be removed and new tools to be activated inside the element:
```javascript
$(element).html(html).activate();
```

When tools are removed, all associated event handlers are removede automaitically! (See **Events** section below).

More information: https://qbix.com/platform/guide/tools

## 📄 Pages

While Tools are reusable components, the concept of Pages is tied to HTTP resources and URLs in browsers.

`Q.Page` class can be used to manage pages and browser page history, loading and unloading their contents, stylesheets, etc.
This happens automatically when you call `Q.handle(url)` or `Q.loadUrl(url)`.
The server-side can send a JSON payload with keys like `scripts`, `stylesheets`, etc. and the framework will
call `Q.addScript()` and `Q.addStylesheet()` to add any new scripts and stylesheets, and `Q.removeStylesheet()` for any
stylesheets that are not in the new page.

Pages can be divided into named `slots` (e.g. "navigation", "content") so that only parts of a page are requested from the server.
The server typically responds with JSON containing `slots`, which is a map of `{slotName: html}` pairs, containing new HTML content.
Then `Q.replace()` is used on slots that should be replaced, and finally `Q.activate()` is called to activate any new tools.

Here is how you add code to run when a page loads and before it unloads:

```javascript:
Q.page('Namespace/action', function () {
  // runs when page is loaded
  return function () {
    // runs before page is unloaded
  };
});
```

`Q.Page.onLoad` and `Q.Page.onUnload` are events that occur when pages are loaded an unloaded.

`Q.Page.push()`, `Q.Page.pop()` and `Q.Page.currentUrl` works with browser history. 

More information: https://qbix.com/platform/guide/pages

## ⏰ Events

Add `onFoo: new Q.Event()` as properties on any object. By convention, the properties are called `onFoo`, and optionally `beforeFoo` (before the event occurs).

To trigger an event, call `Q.handle(event, context, arguments)`. This will call all the handlers set on the event. If any of the handlers returns `false` then all subsequent handlers are skipped and `Q.handle` returns false. While being handled, `event.occurring = true`, and afterwards, `event.occured = true`.

Use `onFoo.set(handler, key)` to set a handler on an event, or `onFoo.add(handler, key)` to set it but also call it, if the event already `.occurred === true`. 

You can call `onFoo.remove(key)` to remove handlers previously set for that key. Or call `onFoo.removeAllHandlers()` to remove all handlers for that event.

Authors of new Tools and Pages use `Q.Tool.define(name, constructor)` and `Q.page(name, constructor)`.  During the lifetime of a tool or page, outside code may add handlers to some events associated with those tools or pages. Normally, they'd need to follow it up with code to manually remove those events when the tool is removed or page is unloaded, _i.e._ during `tool.Q.beforeRemove` and `Q.Page.beforeUnload` events, respectively.

However, Q.js has a great way to automate the removal of events. Simply pass the `tool` or `true` instead of the key, as follows:

| Call Type | Description |
|------------|-------------|
| `event.set(handler, string)`  | need to manually call `event.remove(key)` |
| `event.set(handler, tool)`  | automatically removed when tool is removed |
| `event.set(handler, true)`  | automatically removed when current page is unloaded |
| `$cash.on(event, tool, handler)`  | automatically calls `.off()` when tool is removed |
| `$cash.on(event, true, handler)`  | automatically removed when current page is unloaded |

Calling `set()` or `add()` again with the same String key replaces previous handlers set with that same key. But if the `key` is not a `String` (i.e. it's a `Q.Tool` or `true`) then the handlers are added to the existing ones, while `event.remove(tool)` `event.remove(true)` removes everything added for that tool or current page. 

You can define your own event factory very easily using the `Q.Event.factory()` function. The Event Factory pattern is used in order to create events on demand. For example, here we call an event factory to produce an event and add a handler to be run whenever a tool is activated
```javascript
Q.Tool.onActivate(toolType) // retrieves or creates new Q.Event
   .add(handler, "MyModule"); // adds the handler with a key
```

`Q.Event` also supports Observable Streams / Reactive Events, through methods like

| method | the new event |
|------------|-------------|
| `a.and(b)`  | occurs when both occurred` |
| `a.or(b)`  | occurs when either occurred |
| `a.stop()`  | indicates event won't be occurring anymore |
| `a.until(b)`  | occurs when a occurs, until b starts occurring |
| `a.then()`  | occurs only after a stops occurring |
| `a.filter(test)`  | occurrs only if test returns true |
| `a.map(transform)`  | occurrs after transforming parameters |
| `a.debounce(ms)`  | occurs only during a pause in a being fired |
| `a.throttle(ms)`  | occurs when a occurs, but at most once every ms |
| `a.queue(ms)`  | queues up occurrences to happen every ms |

More information: https://qbix.com/platform/guide/eventsClient

## ⚙️ Methods

There are multiple ways to autoload external tools on demand.

```javascript
// Analogues of node.js modules
Q.exports(function () { ... }); // in a file
Q.require(src, callback); // loading the file
Q.import(src).then(...); // wrapper around native import
```

But also, any asynchronous methods that utilize a callback or promise can be autoloaded:

```javascript
Q.Data = Q.Method.define({
  all: function (a, b) {
    // regular method
  },
  digest: new Q.Method(),
  compress: new Q.Method(),
  decompress: new Q.Method(),
  sign: new Q.Method(),
  verify: new Q.Method(),
}, "Q/Data", function() {
  // pass variables in a closure
  return [Q, something];
}));
```

and then you can define the methods in files like `Q/Data/digest.js`:

```javascript
Q.exports(function (Q, something) { // receive closures from main file
    return function Q_Data_digest(algorithm, payload, callback) {
        // here you have access to both the parameters and the closures!!
        return doStuff.then(function (result) {
            callback && callback(null, result); // callback interface
            return result; // promise interface
        });
    };
});
```

You should consider using this extensively, to organize your front-end code and load only as needed:

```javascript
Q.Data.sign(algorithm, payload) // autoload method's code on demand
.then(...) // continue after promise resolves
```

## 📂 Objects

Use `Q.copy(object, fields, levels)` to copy an object. Sub-objects may expose custom `.copy()` methods to be used.

Do `Q.extend(target, levels, obj1, obj2)` method is used to modify `target`, adding from `extension`.

Do `result = Q.extend({}, defaults, levels, obj1, obj2)` to overrides some defaults with specific values.

You can extend `Q.Event` objects, `Q.extend(target.onFoo, {"bar": handler))` will call `target.onFoo.set(handler, bar)`.
This allows you to pass custom event handlers that will be added to **a copy of** an event:

```javascript
Q.Tool.define("Foo/bar", function (options) {
   this.state // this is Q.extend({}, defaults, options);
}, {
  foo: ['a', 'b'],
  bar: ['a', 'b'],
  onFoo: new Event(function () {
     // default handler here
  }, "Foo/bar"), // with sensible key name
  childToolOptions: {
    onBaz: new Event() // empty event
  }
});
```

Every instance of the `Foo/bar` tool actually makes a copy of the default options, and then extends them, saving the result
in `tool.state`, ready to use. So suppose you instantiated the tool as follows:

```javascript
const element = Q.Tool.prepare('div', 'Foo/bar', {
   // override some options when making element
   foo: ['c', 'd'],
   bar: {replace: ['c', 'd']},
   onFoo: {
     "Foo/bar": function () {
       // override default handler, but only for this instance
     }
   }
});
document.body.appendChild(element);
Q.activate(element, {
  // override more options at activation time
  childToolOptions: {
    onBaz: {
      "myCoolPage": function () {
         // add this handler, but only for this instance
      }
    }
  }
});
```

Other tool instances won't have these handlers added. They'll have **a copy of** the default options, including the event objects, that wasn't extended with these. 

Also notice what `Q.extend()` does with arrays. The `foo` above would become `['a', 'b', 'c', 'd']` while the `bar` would become `['c', 'd']`, because the array was being replaced by an object with a key "replace", so it replaces the array with the given value (another array).

## ➕ Functions

By convention, methods that take options have default options defined in the `options` property on the method itself.
When called, a copy of the default options extended with any options passed to the method. Example:

```
A.method = function (a, b, options) {
   const o = Q.extend({}, A.method.options, 10, options);
}
A.method.options = {
   some: {
     "default": options
   },
   many: "levels"
}
```

You've already seen this in action above with tools, but you're highly encouraged to use this pattern with any functions
or methods that take an object of options. It's a unified way to override default values, including events.

# 🚀 Putting It All Together

## 📦 Main Module

When you write an app or a plugin, you'll probably want to have Javascript file that acts as your main module.
In it, you will define the tools, methods, and other things. Here is an example:

```javascript
/**
 * Streams plugin's front end code
 *
 * @module Streams
 * @class Streams
 */
"use strict";
(function(Q, $) { // $ can be jQuery, $Cash, in any case it's optional

  // defaults are in english, but you can override with Q.Text.get below
  // by convention, modules usually store all user-facing text in Q.text:
  Q.text.Streams = {
    onboarding: {
      prompt: "Fill our your basic information to complete your signup.",
      title: "Basic Information"
    }
  };

  // set default text file for tools and templates
  // with names that start with "Streams/"
  Q.Text.addFor(
    ['Q.Tool.define', 'Q.Template.set'],
    'Streams/', ["Streams/content"]
  );

  Q.Tool.define({
    // specify js and css
    "Streams/chat": {
      js: "{{Streams}}/js/tools/chat.js",
      css: "{{Streams}}/css/tools/chat.css"
    },
    // or define tools as html file (Vue-style)
    "Streams/comments": {
      html: "Streams/html/tools/comments.html"
    }
    // override another module's tool:
    "Users/avatar": "{{Streams}}/js/tools/avatar.js",
  });

  Q.onInit.add(function _Streams_onInit() {
    Q.Text.get('Streams/content').then(text => {
      Q.extend(Q.text.Streams, 10, text);
    });
  });
})(Q, jQuery);
```

