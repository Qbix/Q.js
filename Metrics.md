# Metrics.js

Lightweight, standalone telemetry for any website. Track scroll depth, section engagement, media playback, and SPA navigation — all in one file, no dependencies, no build step.

**2,873 lines unminified. Works with or without Q.js. Drop it in and it runs.**

```html
<script src="https://unpkg.com/@qbix/q/dist/Metrics.js"></script>
<script>
Metrics.init();  // sends to invites.to by default
Metrics.ScrollTracker.init({ sections: 'h2[id]' });
Metrics.MediaTracker.init();
</script>
```

That's it. Telemetry goes to `https://invites.to/metrics` by default — your domain is identified automatically via `location.origin`. Visit [invites.to/metrics](https://invites.to/metrics) to claim your domain and see your dashboard. Or pass `{endpoint: '/your-own'}` to send data to your own server instead.

---

## What It Tracks

### ScrollTracker — Scroll Depth + Section Engagement

Detects which headings are in the viewport, reports scroll depth milestones, and tracks which sections users actually read (not just scroll past).

```javascript
Metrics.ScrollTracker.init({
    sections: 'h2[id], section[id]',  // CSS selector for sections
    debounce: 1000,                    // ms after scroll stops before firing
    depthMilestones: [25, 50, 75, 100] // percentage milestones to report
});
```

Events emitted:
- `depth:25`, `depth:50`, `depth:75`, `depth:100` — scroll milestones
- `section:about-heading` — user stopped on this section
- Anchor click cooldown prevents false positives during smooth scroll

### MediaTracker — Video & Audio Engagement

Auto-discovers and hooks into 9 embed providers. Tracks total seconds played AND unique seconds covered (seeking back and replaying doesn't double-count).

```javascript
Metrics.MediaTracker.init({
    checkpointInterval: 10,  // send position every 10s during playback
    autoDiscover: true,      // scan page for media on init
    observeDom: true         // watch for dynamically added media
});
```

Supported providers (auto-detected):

| Provider | Detection | How it hooks in |
|---|---|---|
| Native `<video>` / `<audio>` | Tag name | `timeupdate`, `play`, `pause`, `ended`, `seeked` events |
| YouTube | `youtube.com/embed` iframe | YT Iframe API, 1s position poll |
| Vimeo | `player.vimeo.com` iframe | Vimeo Player.js, `timeupdate` event |
| SoundCloud | `w.soundcloud.com/player` iframe | Widget API, `PLAY_PROGRESS` event |
| Wistia | `wistia_embed` class | E-v1.js, `secondchange` event |
| JW Player | `.jwplayer` class | `jwplayer()` global, `time` event |
| Dailymotion | `dailymotion.com/embed` iframe | DM SDK, `timeupdate` event |
| Spotify | `open.spotify.com/embed` iframe | postMessage API |
| Twitch | `player.twitch.tv` iframe | Embed v1.js, 1s position poll |
| Muse.ai | `muse.ai/embed` iframe | postMessage API |

Events emitted:
- `media-play:videoId` — playback started
- `media-pause:videoId` — playback paused
- `media-ended:videoId` — reached the end
- `media-seeked:videoId` — user jumped position (includes `from` and `to`)
- `media-checkpoint:videoId` — periodic update during playback

Every media event includes:
```json
{
    "type": "youtube",
    "position": 45,     // current playhead (seconds)
    "duration": 212,    // total length (seconds)
    "watched": 38       // unique seconds covered — no double-counting
}
```

### NavigationTracker — SPA Page Transitions

Tracks `pushState`/`replaceState` navigation, hash changes, and `popstate` events for single-page apps.

```javascript
Metrics.NavigationTracker.init({
    trackHistory: true,    // pushState/replaceState
    trackHash: true        // hashchange events
});
```

### Core — Session, Visitor, Transport

```javascript
Metrics.init({
    endpoint: 'https://your-server.com/telemetry',
    page: document.title,
    extra: { campaign: 'summer' }  // attached to every event
});

// Manual events
Metrics.send('purchase', { value: 49.99, currency: 'USD' });

// Identity
Metrics.getSessionId();   // per-tab, sessionStorage
Metrics.getVisitorId();   // persistent, localStorage → sessionStorage fallback
```

---

## Visitor Identity & ITP

Metrics.js generates two IDs:

| ID | Storage | Lifetime | Purpose |
|---|---|---|---|
| **Session** | `sessionStorage` | Per tab | Group events in one browsing session |
| **Visitor** | `localStorage` (fallback: `sessionStorage`) | Persistent | Recognize returning visitors across sessions |

Both are first-party storage — ITP (Safari's Intelligent Tracking Prevention) won't touch them because they're set by JavaScript running on the page's own domain, not by a third-party script in an iframe.

When Metrics.js is loaded cross-origin (e.g., from a CDN onto your site), `localStorage` is still first-party to YOUR domain. Safari partitions third-party localStorage, but a `<script src="https://cdn.example.com/Metrics.js">` runs in the page's origin, not the CDN's. The visitor ID is scoped to your domain — which is correct for analytics.

Every event payload includes both IDs:
```json
{
    "session": "f93igg86dycr...",
    "visitor": "g6i7vfh5bism...",
    "page": "Pricing",
    "label": "depth:50",
    "t": 1725120000000
}
```

---

## Full Example

```html
<!DOCTYPE html>
<html>
<head><title>My Page</title></head>
<body>

<h2 id="hero">Welcome</h2>
<p>Hero content...</p>

<h2 id="features">Features</h2>
<p>Features content...</p>

<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>

<iframe src="https://w.soundcloud.com/player/?url=https://soundcloud.com/artist/track"></iframe>

<h2 id="pricing">Pricing</h2>
<button id="buy">Buy Now</button>

<script src="https://unpkg.com/@qbix/q/dist/Metrics.js"></script>
<script>
Metrics.init({
    endpoint: '/api/telemetry',
    page: document.title
});

// Track scroll + sections
Metrics.ScrollTracker.init({ sections: 'h2[id]' });

// Auto-discover and track all video/audio
Metrics.MediaTracker.init();

// Manual conversion event
document.getElementById('buy').addEventListener('click', function () {
    Metrics.send('purchase', { plan: 'pro', value: 29 });
});
</script>

</body>
</html>
```

This page will automatically:
- Report scroll depth at 25%, 50%, 75%, 100%
- Report when the user reads the hero, features, or pricing section
- Track YouTube playback (play, pause, seek, checkpoint every 10s)
- Track SoundCloud playback (same events)
- Report unique seconds watched for each (seeking back doesn't inflate numbers)
- Send a `purchase` event on button click
- Flush all playing media stats on tab close via `sendBeacon`

---

## API Reference

### `Metrics.init(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `endpoint` | String | `null` | URL to POST telemetry to |
| `page` | String | `document.title` | Page identifier in every event |
| `extra` | Object | `null` | Extra data attached to every event |
| `sessionKey` | String | `'metrics_sid'` | sessionStorage key |
| `sessionId` | String | auto | Override session ID |

### `Metrics.send(label, data)`

Send a custom event. `label` is a string identifier, `data` is optional extra info.

### `Metrics.getSessionId()` / `Metrics.getVisitorId()`

Get the per-tab session ID or persistent visitor ID.

### `Metrics.ScrollTracker.init(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `sections` | String | `'h2[id], section[id]'` | CSS selector for trackable sections |
| `debounce` | Number | `1000` | ms to wait after scroll stops |
| `initDelay` | Number | `800` | ms to wait on page load |
| `depthMilestones` | Array | `[25, 50, 75, 100]` | Percentage milestones |
| `anchorCooldown` | Number | `1500` | ms to suppress tracking after anchor click |
| `sectionLookback` | Number | `300` | Max px above viewport to consider current |
| `trackClicks` | Boolean | `true` | Track link clicks |
| `trackUnload` | Boolean | `true` | Send beacon on page exit |

### `Metrics.MediaTracker.init(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `checkpointInterval` | Number | `10` | Seconds between checkpoints during playback |
| `autoDiscover` | Boolean | `true` | Scan page for media on init |
| `observeDom` | Boolean | `true` | Watch for dynamically added media |
| `reloadIframes` | Boolean | `false` | Reload YouTube iframes missing `enablejsapi=1` |
| `mediaSelector` | String | `'video, audio'` | CSS selector for native elements |

### `Metrics.MediaTracker.getTracked()`

Returns all tracked media with current state:
```javascript
{
    "dQw4w9WgXcQ": {
        id: "dQw4w9WgXcQ", type: "youtube",
        playing: false, position: 45, duration: 212, watched: 38
    }
}
```

### `Metrics.NavigationTracker.init(options)`

| Option | Type | Default | Description |
|---|---|---|---|
| `trackHistory` | Boolean | `true` | Track pushState/replaceState |
| `trackHash` | Boolean | `true` | Track hashchange |

---

## Server-Side: Where Does the Telemetry Go?

Metrics.js POSTs JSON to your endpoint via `sendBeacon` (preferred) or `fetch` with `keepalive`. Every event has the same shape:

```json
{
    "session": "f93igg86dycr...",
    "visitor": "g6i7vfh5bism...",
    "page": "Pricing",
    "label": "media-pause:dQw4w9WgXcQ",
    "t": 1725120000000,
    "extra": { "campaign": "summer" },
    "data": { "type": "youtube", "position": 45, "duration": 212, "watched": 38 }
}
```

### Option 1: Quick test — log to a file (PHP)

Drop this as `telemetry.php` next to your HTML:

```php
<?php
// telemetry.php — append each event as a TSV line
header('Access-Control-Allow-Origin: *');
$payload = json_decode(file_get_contents('php://input'), true);
if (!$payload || empty($payload['label'])) { http_response_code(400); exit; }
$line = implode("\t", [
    date('c'),
    $payload['visitor'] ?? '',
    $payload['session'] ?? '',
    $payload['page'] ?? '',
    $payload['label'] ?? '',
    json_encode($payload['data'] ?? [])
]);
file_put_contents('telemetry.tsv', $line . "\n", FILE_APPEND | LOCK_EX);
http_response_code(204);
```

Then:
```html
<script src="Metrics.js"></script>
<script>
Metrics.init({ endpoint: 'telemetry.php', page: document.title });
Metrics.ScrollTracker.init({ sections: 'h2[id]' });
Metrics.MediaTracker.init();
</script>
```

Open `telemetry.tsv` to see events arrive in real time. Good for development and quick verification.

### Option 2: Quick test — log to a file (Node.js)

No PHP? Save this as `telemetry.js` and run `node telemetry.js`:

```javascript
const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const p = JSON.parse(body);
            const line = [
                new Date().toISOString(),
                p.visitor || '', p.session || '',
                p.page || '', p.label || '',
                JSON.stringify(p.data || {})
            ].join('\t');
            fs.appendFileSync('telemetry.tsv', line + '\n');
            console.log(p.label, p.data ? JSON.stringify(p.data) : '');
        } catch (e) {}
        res.writeHead(204);
        res.end();
    });
}).listen(3000, () => console.log('Telemetry listening on :3000'));
```

Then point Metrics at `http://localhost:3000`:
```javascript
Metrics.init({ endpoint: 'http://localhost:3000', page: document.title });
```

### Option 3: Production — Qbix Metrics plugin

Install the [Qbix Platform](https://github.com/Qbix/Platform) with the [Metrics plugin](https://github.com/Qbix/Metrics). The plugin provides:

- `Metrics/landed` endpoint — records visits with referral chain attribution
- `Metrics/update` endpoint — debounced state updates
- `Metrics_Visit` — visit tracking with tracker IDs and visit chain walking
- `Metrics_Action` — action recording with canonical URL dedup
- `Metrics_Tracker` — per-campaign tracker with click/conversion counts
- Dashboard tools for visualizing engagement data

When Q.js is loaded alongside Metrics.js, the integration activates automatically — events route through `Q.request()` to the Metrics plugin endpoints with CSRF tokens, session binding, and visit chain propagation. No code changes needed on the client side.

### Option 4: Third-party analytics

Already using another analytics service? Metrics.js can feed into it:

```javascript
// Override Metrics.send to pipe events to your analytics
var _originalSend = Metrics.send;
Metrics.send = function (label, data) {
    // Still send to your endpoint
    _originalSend.call(Metrics, label, data);

    // Also send to Google Analytics 4
    if (window.gtag) {
        gtag('event', label, data || {});
    }

    // Also send to Mixpanel
    if (window.mixpanel) {
        mixpanel.track(label, data || {});
    }

    // Also send to Segment
    if (window.analytics) {
        analytics.track(label, data || {});
    }
};
```

This gives you the detailed scroll/section/media tracking that GA4 and Mixpanel don't offer natively, piped through their existing dashboards.

---

## Upgrading to the Full Qbix Stack

Metrics.js works standalone on any website. But if you load [Q.js](https://github.com/Qbix/Q.js) alongside it, the integration activates automatically — no code changes needed.

| Feature | Standalone | With Q.js |
|---|---|---|
| Transport | `sendBeacon` / `fetch` | Also `Q.request()` with CSRF tokens, retries, batch queueing |
| State updates | Not available | `Metrics.setState()` — debounced server-side state via `Q.req('Metrics/update')` |
| Page context | `document.title` | `Q.info.url`, `Q.info.baseUrl`, `Q.info.uriString` |
| Visibility | `visibilitychange` API | `Q.onVisibilityChange` — unified across browser, Cordova, Capacitor |
| Tool auto-tracking | Manual | Auto-hooks into `Q/tabs`, `Q/columns`, `Q/expandable` — section changes tracked without code |
| Landing beacon | Not available | Auto `Q.req('Metrics/landed')` on page load with visit chain |
| SPA navigation | Manual via NavigationTracker | Auto-tracks `Q.Page` transitions with slot-level granularity |

For the full server-side stack — visit attribution, referral chain walking, conversion tracking, multi-level commissions, real-time WebSocket updates, and per-component Merkle-tree cache invalidation — install the [Qbix Platform](https://github.com/Qbix/Platform) with the [Metrics plugin](https://github.com/Qbix/Metrics).

The Qbix Platform includes a high-performance [webserver](https://github.com/Qbix/webserver) (Cosmopolitan C binary, no PHP needed for serving) that maintains a Merkle tree of component hashes. When a stream changes, `Q_Response::invalidateCacheDeps()` walks the tree and invalidates only the affected components — not the whole page. Combined with `static.php` for CDN-cached pre-rendering and `Streams/check` for per-stream change detection over WebSocket, you get sub-second updates with near-zero server load.

Metrics.js is the lightweight entry point. The Qbix Platform is where it goes when you need the full infrastructure.

---

## License

MIT — same as Q.js and the Qbix Platform.
