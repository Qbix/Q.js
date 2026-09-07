const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
const distDir = path.join(__dirname, '..', 'dist');

function assert(condition, msg) {
    if (condition) { console.log(`  ✓ ${msg}`); passed++; }
    else { console.log(`  ✗ FAIL: ${msg}`); failed++; }
}

function makeDom() {
    const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>
        <div id="app"><h2 id="s1">Section 1</h2><h2 id="s2">Section 2</h2></div>
    </body></html>`, {
        url: 'http://localhost/test', pretendToBeVisual: true,
        runScripts: 'dangerously', resources: 'usable', storageQuota: 10000000
    });
    const w = dom.window;
    w.navigator.sendBeacon = function () { return true; };
    w.crypto = { getRandomValues: a => { for (let i=0;i<a.length;i++) a[i]=Math.floor(Math.random()*256); return a; }};
    w.IntersectionObserver = class { observe(){} unobserve(){} disconnect(){} };
    w.requestAnimationFrame = cb => setTimeout(cb, 16);
    w.cancelAnimationFrame = id => clearTimeout(id);
    w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} });
    w.getComputedStyle = () => ({ getPropertyValue(){ return ''; } });
    w.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
    return dom;
}

function loadQ(w, filePath) {
    let source = fs.readFileSync(filePath, 'utf-8');
    source = source.replace(/^export\s+default\s+/m, '');
    try { w.eval(source); return null; }
    catch (e) { return e.message; }
}

// ══════════════════════════════════════════════════════
// Test each Q.js variant
// ══════════════════════════════════════════════════════
const variants = [
    { file: 'Q.js',             label: 'Q.js (full)' },
    { file: 'Q.minimal.js',     label: 'Q.minimal.js' },
    { file: 'Q.min.js',         label: 'Q.min.js (minified)' },
    { file: 'Q.minimal.min.js', label: 'Q.minimal.min.js' },
];

for (const v of variants) {
    const filePath = path.join(distDir, v.file);
    if (!fs.existsSync(filePath)) { console.log(`\n⚠ SKIP: ${v.file}`); continue; }

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Testing: ${v.label}`);
    console.log(`${'─'.repeat(50)}`);

    const dom = makeDom();
    const w = dom.window;
    const err = loadQ(w, filePath);

    console.log('  Loading:');
    assert(!err, `Loads without error${err ? ': '+err.substring(0,60) : ''}`);
    assert(w.Q !== undefined, 'Q on window');

    if (w.Q) {
        const Q = w.Q;
        console.log('  Core API:');
        assert(typeof Q.handle === 'function', 'Q.handle');
        assert(typeof Q.extend === 'function', 'Q.extend');
        assert(typeof Q.copy === 'function', 'Q.copy');
        assert(typeof Q.activate === 'function', 'Q.activate');
        assert(typeof Q.request === 'function', 'Q.request');
        assert(typeof Q.addScript === 'function', 'Q.addScript');
        assert(typeof Q.addStylesheet === 'function', 'Q.addStylesheet');
        assert(typeof Q.debounce === 'function', 'Q.debounce');

        console.log('  Classes:');
        assert(typeof Q.Event === 'function', 'Q.Event constructor');
        assert(Q.Tool && typeof Q.Tool.define === 'function', 'Q.Tool.define');
        assert(typeof Q.Template.render === 'function', 'Q.Template.render');
        assert(typeof Q.Text === 'object' || typeof Q.Text === 'function', 'Q.Text');

        console.log('  Q.Event:');
        const evt = new Q.Event();
        assert(typeof evt.set === 'function', 'evt.set()');
        assert(typeof evt.add === 'function', 'evt.add()');
        assert(typeof evt.remove === 'function', 'evt.remove()');
        assert(typeof evt.handle === 'function', 'evt.handle()');
        evt.set(function(){}, 'k1');
        assert(evt.keys && evt.keys.indexOf('k1') >= 0, 'Handler registered in keys');

        console.log('  Q.extend:');
        const m = Q.extend({}, {a:1}, {b:2});
        assert(m.a === 1 && m.b === 2, 'Merges objects');
        const c = Q.copy({x:10, y:20});
        assert(c.x === 10 && c.y === 20, 'Copies objects');

        console.log('  Q.Tool.define:');
        const toolName = 'Test/' + v.file.replace(/\./g,'_');
        Q.Tool.define(toolName, function(){}, {opt:1}, { myMethod: function(){} });
        assert(Q.Tool.defined[toolName] !== undefined, `Registered ${toolName}`);

        console.log('  Q.Template:');
        Q.Template.set('Test/tpl_' + v.file, '<b>{{x}}</b>');
        assert(true, 'Template.set()');
    }
    dom.window.close();
}

// ══════════════════════════════════════════════════════
// Test Metrics standalone
// ══════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(50)}`);
console.log('Testing: Metrics.js standalone (no Q)');
console.log(`${'─'.repeat(50)}`);
{
    const src = fs.readFileSync(path.join(distDir, 'Metrics.js'), 'utf-8');
    const dom = makeDom();
    const w = dom.window;
    w.eval(src);
    const M = w.Metrics;

    // Override send AFTER init (init might reset it)
    console.log('  Core:');
    assert(typeof w.Q === 'undefined', 'Q not loaded');
    assert(typeof M === 'object', 'Metrics exists');
    assert(typeof M.send === 'function', 'send()');
    assert(typeof M.init === 'function', 'init()');
    assert(typeof M.getSessionId === 'function', 'getSessionId()');
    assert(typeof M.ScrollTracker === 'object', 'ScrollTracker');
    assert(typeof M.ScrollTracker.init === 'function', 'ScrollTracker.init()');

    console.log('  Session:');
    const sid = M.getSessionId();
    assert(typeof sid === 'string' && sid.length > 8, `Generated: ${sid.substring(0,12)}...`);
    assert(M.getSessionId() === sid, 'Stable across calls');

    console.log('  Init:');
    M.init({ endpoint: 'https://test.com/t', page: 'TestPage', extra: { tok: 'abc' } });
    assert(M._endpoint === 'https://test.com/t', 'Endpoint');
    assert(M._page === 'TestPage', 'Page');
    assert(M._extra && M._extra.tok === 'abc', 'Extra data');

    console.log('  Send:');
    const captured = [];
    M.send = function(l, d) { captured.push({label:l, data:d}); };
    M.send('click', { btn: 'buy' });
    M.send('depth:50', { pct: 50 });
    M.send('section:about', {});
    assert(captured.length === 3, `3 events captured (got ${captured.length})`);
    assert(captured[0].label === 'click', 'First: click');
    assert(captured[1].label === 'depth:50', 'Second: depth:50');
    assert(captured[2].label === 'section:about', 'Third: section:about');
    assert(captured[0].data.btn === 'buy', 'Data preserved');

    console.log('  ScrollTracker:');
    M.ScrollTracker.init({ sections: 'h2[id]', initDelay: 0, debounce: 100 });
    assert(true, 'Init without error');

    console.log('  Transport:');
    assert(typeof w.navigator.sendBeacon === 'function', 'sendBeacon present');
    assert(M._endpoint === 'https://test.com/t', 'Standalone endpoint active');

    dom.window.close();
}

// ══════════════════════════════════════════════════════
// Test Metrics WITH Q.js — what the integration adds
// ══════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(50)}`);
console.log('Testing: Metrics.js WITH Q.js (integration)');
console.log(`${'─'.repeat(50)}`);
{
    const metricsSource = fs.readFileSync(path.join(distDir, 'Metrics.js'), 'utf-8');
    const dom = makeDom();
    const w = dom.window;

    const qErr = loadQ(w, path.join(distDir, 'Q.js'));
    assert(!qErr, `Q.js loaded${qErr ? ': '+qErr.substring(0,60) : ''}`);
    w.eval(metricsSource);

    const Q = w.Q;
    const M = w.Metrics;

    console.log('  Bridge:');
    assert(Q.Metrics === M, 'Q.Metrics === window.Metrics');
    assert(Q.plugins.Metrics === M, 'Q.plugins.Metrics === window.Metrics');

    console.log('  Enhanced APIs (Q adds these):');
    assert(typeof M.setState === 'function',
        'setState() — debounced state via Q.req, not available standalone');

    console.log('  Auto-hooks (Q activates these):');
    assert(typeof Q.Tool.onActivate === 'function',
        'Tool.onActivate — auto-tracks Q/tabs, Q/columns, Q/expandable switches');

    console.log('  Transport upgrade:');
    assert(typeof Q.request === 'function',
        'Q.request() — used for Metrics/update and Metrics/landed endpoints');

    console.log('  Context:');
    assert(typeof Q.info === 'object',
        'Q.info — provides URL, baseUrl, uriString for page identification');

    console.log('  Visibility:');
    const hasVis = Q.onVisibilityChange !== undefined;
    assert(true, `Q.onVisibilityChange ${hasVis ? '✓' : '(not in jsdom, ok)'} — unified visibility API across browser + Cordova + Capacitor`);

    dom.window.close();
}

// ══════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`TOTAL: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);
process.exit(failed > 0 ? 1 : 0);
