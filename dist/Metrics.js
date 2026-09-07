/**
 * Metrics plugin's front end code
 *
 * @module Metrics
 * @class Metrics
 */
"use strict";

// ── Core Metrics object (works with or without Q) ──
(function (root) {

var Metrics = root.Metrics || {};
root.Metrics = Metrics;

// ── Session Management ──

Metrics._sessionKey = 'metrics_sid';
Metrics._visitorKey = 'metrics_vid';
Metrics._sid = null;
Metrics._vid = null;

Metrics.getSessionId = function () {
	if (Metrics._sid) return Metrics._sid;
	try {
		var sid = sessionStorage.getItem(Metrics._sessionKey);
		if (!sid) {
			sid = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
			sessionStorage.setItem(Metrics._sessionKey, sid);
		}
		Metrics._sid = sid;
	} catch (e) {
		Metrics._sid = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
	}
	return Metrics._sid;
};

/**
 * Get or create a persistent visitor ID that survives across sessions.
 * Tries localStorage first (persists until cleared).
 * Falls back to sessionStorage (ITP-safe, but per-tab only).
 * Either way, ITP won't block it — both are first-party storage
 * when the script runs on the page's own domain.
 * When loaded cross-origin (e.g. from invites.to CDN onto
 * summerfest.com), localStorage may be partitioned by Safari's
 * ITP — meaning the same visitor gets different vids on different
 * sites. This is fine: the inv_token from the redirect query
 * string is what links visits across domains, not the vid.
 * @method getVisitorId
 * @return {String}
 */
Metrics.getVisitorId = function () {
	if (Metrics._vid) return Metrics._vid;
	var vid = null;
	// Try localStorage first (persistent)
	try {
		vid = localStorage.getItem(Metrics._visitorKey);
		if (!vid) {
			vid = Math.random().toString(36).slice(2) + Date.now().toString(36)
				+ Math.random().toString(36).slice(2);
			localStorage.setItem(Metrics._visitorKey, vid);
		}
		Metrics._vid = vid;
		return vid;
	} catch (e) { /* localStorage blocked or full */ }
	// Fall back to sessionStorage
	try {
		vid = sessionStorage.getItem(Metrics._visitorKey);
		if (!vid) {
			vid = Math.random().toString(36).slice(2) + Date.now().toString(36)
				+ Math.random().toString(36).slice(2);
			sessionStorage.setItem(Metrics._visitorKey, vid);
		}
		Metrics._vid = vid;
		return vid;
	} catch (e) { /* sessionStorage blocked */ }
	// Last resort: in-memory only (won't survive page reload)
	vid = Math.random().toString(36).slice(2) + Date.now().toString(36)
		+ Math.random().toString(36).slice(2);
	Metrics._vid = vid;
	return vid;
};

// ── Transport (standalone — overridden by Q integration below) ──

Metrics._endpoint = null;
Metrics._page = null;
Metrics._extra = null;
Metrics._unloaded = false;
Metrics._startTime = Date.now();

/**
 * Send a telemetry event. When Q framework is loaded, this is
 * enhanced to also POST via Q.req(). Standalone mode uses
 * sendBeacon / fetch to the configured endpoint.
 * @param {String} label — event label
 * @param {Object} [data] — optional extra data
 */
Metrics.send = function (label, data) {
	if (!Metrics._endpoint || Metrics._unloaded) return;

	var payload = {
		session: Metrics.getSessionId(),
		visitor: Metrics.getVisitorId(),
		page: Metrics._page || document.title,
		label: label,
		t: Date.now()
	};
	if (Metrics._extra) payload.extra = Metrics._extra;
	if (data) payload.data = data;

	var body = JSON.stringify(payload);
	try {
		if (navigator.sendBeacon) {
			navigator.sendBeacon(Metrics._endpoint, new Blob([body], { type: 'text/plain' }));
		} else {
			fetch(Metrics._endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'text/plain' },
				keepalive: true,
				body: body
			});
		}
	} catch (e) { /* silent */ }
};

// ── Visibility Detection ──
// Uses Q.onVisibilityChange when available, otherwise vendor-prefixed
// visibilitychange + mobile lifecycle events (Cordova/Capacitor)

Metrics._visible = true;
Metrics._visibilityCallbacks = [];
Metrics._visibilityBound = false;

/**
 * Whether the page is currently visible
 * @returns {Boolean}
 */
Metrics.isVisible = function () {
	return Metrics._visible;
};

/**
 * Register a callback for visibility changes
 * @param {Function} fn(isVisible) — called when visibility changes
 * @param {String} [key] — optional key for deduplication
 */
Metrics.onVisibilityChange = function (fn, key) {
	if (key) {
		// Replace existing callback with same key
		for (var i = 0; i < Metrics._visibilityCallbacks.length; i++) {
			if (Metrics._visibilityCallbacks[i].key === key) {
				Metrics._visibilityCallbacks[i].fn = fn;
				return;
			}
		}
	}
	Metrics._visibilityCallbacks.push({ fn: fn, key: key || null });
};

function _fireVisibility(isVisible) {
	if (isVisible === Metrics._visible) return; // deduplicate
	Metrics._visible = isVisible;
	for (var i = 0; i < Metrics._visibilityCallbacks.length; i++) {
		try { Metrics._visibilityCallbacks[i].fn(isVisible); } catch (e) {}
	}
}

function _bindVisibility() {
	if (Metrics._visibilityBound) return;
	Metrics._visibilityBound = true;

	// Detect vendor-prefixed visibility API
	var visibilityChange = null;
	var prefixes = ['', 'moz', 'ms', 'webkit', 'o'];
	for (var i = 0; i < prefixes.length; i++) {
		var k = prefixes[i];
		var hidden = k ? k + 'Hidden' : 'hidden';
		if (hidden in document) {
			visibilityChange = k ? k + 'visibilitychange' : 'visibilitychange';
			break;
		}
	}

	function handleVisEvent(event) {
		var isHidden;
		if (event.type === 'pause' || event.type === 'resign') {
			isHidden = true;
		} else if (event.type === 'resume' || event.type === 'active') {
			isHidden = false;
		} else {
			isHidden = document.visibilityState === 'hidden';
		}
		_fireVisibility(!isHidden);
	}

	if (visibilityChange) {
		document.addEventListener(visibilityChange, handleVisEvent, false);
	}
	// Mobile lifecycle (Cordova / Capacitor)
	document.addEventListener('pause', handleVisEvent, false);
	document.addEventListener('resume', handleVisEvent, false);
	document.addEventListener('resign', handleVisEvent, false);
	document.addEventListener('active', handleVisEvent, false);
}

// ── Unload / bfcache ──

Metrics._unloadBound = false;

function _bindUnload() {
	if (Metrics._unloadBound) return;
	Metrics._unloadBound = true;

	// Visibility-based exit (most reliable)
	Metrics.onVisibilityChange(function (isVisible) {
		if (!isVisible) {
			_sendUnload();
		} else {
			Metrics._unloaded = false; // returned to page
		}
	}, 'Metrics.unload');

	// pagehide fallback
	window.addEventListener('pagehide', function () {
		_sendUnload();
	});

	// bfcache restore
	window.addEventListener('pageshow', function (e) {
		if (e.persisted) {
			Metrics._unloaded = false;
		}
	});
}

function _sendUnload() {
	if (Metrics._unloaded) return;
	Metrics._unloaded = true;
	var elapsed = Math.round((Date.now() - Metrics._startTime) / 1000);
	Metrics.send('unload:' + elapsed + 's');
}

/**
 * Initialize standalone page tracking (no Q framework needed)
 * @param {Object} options
 * @param {String} options.endpoint — POST URL for beacons
 * @param {String} [options.page] — page identifier
 * @param {String} [options.sessionKey] — sessionStorage key
 * @param {String} [options.sessionId] — override session ID
 * @param {Object} [options.extra] — extra data with every event
 * @param {Boolean} [options.trackUnload=true] — send unload beacon
 */
Metrics.init = function (options) {
	options = options || {};
	if (options.endpoint) Metrics._endpoint = options.endpoint;
	if (options.page) Metrics._page = options.page;
	if (options.sessionKey) Metrics._sessionKey = options.sessionKey;
	if (options.sessionId) Metrics._sid = options.sessionId;
	if (options.extra) Metrics._extra = options.extra;

	_bindVisibility();
	if (options.trackUnload !== false) {
		_bindUnload();
	}

	Metrics.send('loaded');
	return Metrics;
};

})(typeof window !== 'undefined' ? window : this);


// ── Q Framework Integration (only runs if Q exists) ──
if (typeof Q !== 'undefined') {
(function (Q) {

	// Bridge: make Q.Metrics point to the global Metrics
	Q.Metrics = Q.plugins.Metrics = window.Metrics;
	var Metrics = window.Metrics;

	Metrics.setState = function (state, extra) {
		var url = Q.info.url;
		Metrics.setState.pending[url] = Q.setTimeout(function () {
			if (Metrics.setState.pending[url]) {
				clearTimeout(Metrics.setState.pending[url]);
				delete Metrics.setState.pending[url];
			}
			Q.req('Metrics/update', [], null, {
				method: 'POST',
				fields: {
					navigatorUrl: location.href,
					url: Q.info.url,
					state: state,
					extra: JSON.stringify(extra)
				},
				keepalive: true
			});
		}, 5000);
	};
	Metrics.setState.pending = {};
    
	var dc = Q.extend.dontCopy;
	dc["Q.Users.User"] = true;

	Q.text.Metrics = {};

	function ensureVisitInHash(visitId) {
		var current = location.hash || '#';
		var updated = current.queryField('v', visitId);
		if (updated !== current) {
			history.replaceState(
				history.state,
				document.title,
				updated
			);
		}
	}

	Q.onReady.add(function () {
		// If Q.onVisibilityChange exists, bridge it to Metrics visibility
		if (Q.onVisibilityChange && Q.onVisibilityChange.set) {
			Q.onVisibilityChange.set(function (shown) {
				// Sync Q's visibility detection into Metrics
				if (Metrics._visible !== shown) {
					Metrics._visible = shown;
					for (var i = 0; i < Metrics._visibilityCallbacks.length; i++) {
						try { Metrics._visibilityCallbacks[i].fn(shown); } catch (e) {}
					}
				}
			}, 'Metrics');
		}

		// Initialize NavigationTracker if configured
		var stConfig = Q.getObject('Metrics.navigationTracker', Q.plugins) 
			|| Q.getObject('Metrics.navigationTracker', Q);
		if (stConfig && Metrics.NavigationTracker) {
			stConfig.page = stConfig.page || Q.info.url || document.title;
			Metrics.NavigationTracker.init(stConfig);
		}

		// Initialize MediaTracker if configured
		var mtConfig = Q.getObject('Metrics.mediaTracker', Q.plugins)
			|| Q.getObject('Metrics.mediaTracker', Q);
		if (mtConfig && Metrics.MediaTracker) {
			Metrics.MediaTracker.init(mtConfig);
		}

		// ── Auto-wire into Q tools for navigation tracking ──
		var NT = Metrics.NavigationTracker;
		if (NT) {
			// Q/tabs — track tab switches (debounced to avoid rapid fire)
			var _tabDebounce = null;
			Q.Tool.onActivate('Q/tabs').set(function () {
				var tabsTool = this;
				tabsTool.state.onCurrent.set(function (tab, tabName) {
					clearTimeout(_tabDebounce);
					var _name = tabName;
					_tabDebounce = setTimeout(function () {
						if (_name && NT.state.initialized) {
							NT.opened('tab:' + _name);
						}
					}, 300);
				}, 'Metrics.NavigationTracker');
			}, 'Metrics.NavigationTracker');

			// Q/columns — track column open/close
			Q.Tool.onActivate('Q/columns').set(function () {
				var columnsTool = this;
				columnsTool.state.onActivate.set(function (div, options, index) {
					if (!NT.state.initialized) return;
					var name = (div && div.getAttribute('data-name')) || ('column-' + index);
					NT.opened('column:' + name);
				}, 'Metrics.NavigationTracker');
				columnsTool.state.onClose.set(function (index, div) {
					if (!NT.state.initialized) return;
					var name = (div && div.getAttribute('data-name')) || ('column-' + index);
					NT.closed('column:' + name);
				}, 'Metrics.NavigationTracker');
			}, 'Metrics.NavigationTracker');

			// Q/expandable — track expand/collapse
			Q.Tool.onActivate('Q/expandable').set(function () {
				var expTool = this;
				var expId = expTool.element.id
					|| expTool.element.getAttribute('data-name')
					|| expTool.id;
				expTool.state.onExpand.set(function () {
					if (!NT.state.initialized) return;
					NT.opened('expandable:' + expId);
				}, 'Metrics.NavigationTracker');
				expTool.state.onCollapse.set(function () {
					if (!NT.state.initialized) return;
					NT.closed('expandable:' + expId);
				}, 'Metrics.NavigationTracker');
			}, 'Metrics.NavigationTracker');

			// Q.Contextual — track contextual menu show/hide/item selection
			if (Q.Contextual) {
				Q.Contextual.onShow.set(function (contextual) {
					if (!NT.state.initialized) return;
					var $ctx = $(contextual);
					var $trigger = $ctx.data('Q/contextual trigger');
					var ctxId = ($trigger && $trigger.attr('data-name'))
						|| ($trigger && $trigger.attr('id'))
						|| 'contextual-' + Q.Contextual.current;
					NT.opened('contextual:' + ctxId);

					// Track links/items scrolling into view inside the contextual
					var listing = contextual.querySelector
						? contextual.querySelector('.Q_listing_wrapper, .Q_listing')
						: null;
					if (listing) {
						NT.observeNavContainer(listing);
					}
				}, 'Metrics.NavigationTracker');

				Q.Contextual.onHide.set(function (contextual) {
					if (!NT.state.initialized) return;
					if (NT.state.activeSection
					&& NT.state.activeSection.indexOf('contextual:') === 0) {
						NT.closed(NT.state.activeSection);
					}
				}, 'Metrics.NavigationTracker');

				// Intercept contextual item selection
				var _origItemHandler = Q.Contextual.itemSelectHandler;
				if (_origItemHandler) {
					Q.Contextual.itemSelectHandler = function (element, event) {
						if (NT.state.initialized) {
							var action = element.getAttribute('data-action')
								|| element.getAttribute('data-name')
								|| (element.textContent || '').trim().slice(0, 40);
							Metrics.send('contextual-item:' + action);
						}
						return _origItemHandler.apply(this, arguments);
					};
				}
			}
		}

		// Visit chaining — look for a parent visitId in the hash
		var parentVisitId = location.hash.queryField('v');
		if (!parentVisitId) {
			return;
		}
		ensureVisitInHash(parentVisitId);

		Q.req('Metrics/landed', {
			method: 'POST',
			fields: { trackerId: 'visitId:' + parentVisitId }
		}, function (err, res) {
			if (err) {
				if (window.console) {
					console.error('Metrics landed request failed', err);
				}
				return;
			}
			if (res && res.slots && res.slots.visitId) {
				ensureVisitInHash(res.slots.visitId);
			}
		});
	}, 'Metrics');

	// Error telemetry
	(function () {
		function sendErrorTelemetry(errorInfo) {
			var payload = JSON.stringify({ error: errorInfo });
			Q.req('Metrics/update', [], null, {
				method: 'POST',
				fields: {
					navigatorUrl: location.href,
					url: Q.info && Q.info.url,
					state: 'error',
					extra: payload
				},
				keepalive: true
			});
		}

		function formatErrorPayload(message, stack, details) {
			var payload = {
				message: message || '',
				stack: stack || '',
				url: location.href,
				userAgent: navigator.userAgent,
				timestamp: Date.now(),
				performanceNow: performance.now()
			};
			if (details) {
				payload.details = details;
			}
			return payload;
		}

		function handleError(reason, isRejection) {
			var message = '';
			var stack = '';
			var details;

			if (reason instanceof Error) {
				message = reason.message;
				stack = reason.stack;
			} else if (typeof reason === 'string') {
				message = reason;
			} else if (reason && typeof reason === 'object') {
				try {
					details = JSON.stringify(reason);
				} catch (e) {
					details = '[unserializable reason]';
				}
			}

			var errorInfo = formatErrorPayload(message, stack, details);
			sendErrorTelemetry(errorInfo);
			console.warn(isRejection ? 'Unhandled rejection:' : 'Unhandled error:', reason);

			if (message && /indexedDB/i.test(message)) {
				console.warn('[Recovery] Error suggests IndexedDB corruption. Triggering recovery...');
			}
		}

		window.addEventListener('unhandledrejection', function (event) {
			handleError(event.reason, true);
		});

		window.addEventListener('error', function (event) {
			handleError(event.error || event.message, false);
		});
	})();

})(Q);
}

/**
 * Metrics.ScrollTracker — Section-aware scroll telemetry
 * 
 * Tracks which sections a user reads, how far they scroll,
 * and what they click. Delegates transport, session, visibility,
 * and unload handling to the core Metrics object.
 * 
 * Usage (standalone):
 *   Metrics.init({ endpoint: '/telemetry.php', page: 'My Page' });
 *   Metrics.ScrollTracker.init({
 *     sections: 'h2[id], h3[id]',
 *     debounce: 1000
 *   });
 * 
 * Usage (with Q framework):
 *   // Auto-initializes from config if endpoint is set
 * 
 * @module Metrics
 * @class Metrics.ScrollTracker
 */
"use strict";
(function (root) {

var Metrics = root.Metrics;
if (!Metrics) {
	console.warn('Metrics.ScrollTracker: Metrics core not loaded');
	return;
}

var defaults = {
	// CSS selector for sections to track
	sections: 'h2[id], h3[id], section[id], [data-section]',

	// Minimum pixel height for auto-detected containers
	minSectionHeight: 100,

	// Milliseconds to wait after scroll stops before firing
	debounce: 1000,

	// Milliseconds to wait on page load (ignores scroll restoration)
	initDelay: 800,

	// Milliseconds to suppress tracking after anchor click
	anchorCooldown: 1500,

	// Scroll depth milestones (percentage)
	depthMilestones: [25, 50, 75, 100],

	// Max px above viewport top to consider a section "current"
	sectionLookback: 300,

	// Scroll considered settled if moved less than this (px)
	settleTolerance: 2,

	// Recheck interval when not settled (ms)
	recheckInterval: 500,

	// Track link/anchor clicks
	trackClicks: true,

	// Visual TOC highlighting selector (real-time, not debounced)
	tocSelector: null,
	tocActiveClass: 'active',
	tocSectionSelector: 'h2[id]'
};

// ── State ──
var state = {
	initialized: false,
	options: null,
	sections: [],
	tocSections: [],
	seen: {},
	depthHit: {},
	scrollTimer: null,
	anchorCooling: false,
	_prevY: -1
};

// ── Section Discovery ──

function discoverSections(selector) {
	var elements = document.querySelectorAll(selector);
	var result = [];
	var ordinal = 0;
	var minH = (state.options && state.options.minSectionHeight) || 0;

	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		if (el.offsetHeight < minH) continue;

		if (!el.id) {
			var text = (el.textContent || '').trim().slice(0, 60);
			var slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
			el.id = slug || ('section-' + ordinal);
		}

		result.push({
			el: el,
			id: el.id,
			tag: el.tagName.toLowerCase(),
			ordinal: ordinal++,
			snippet: (el.textContent || '').trim().slice(0, 80)
		});
	}
	return result;
}

// ── Find Current Section ──

function findCurrentSection() {
	var scrollY = window.scrollY || window.pageYOffset;
	var opts = state.options;
	var best = null;
	var bestDist = Infinity;

	for (var i = 0; i < state.sections.length; i++) {
		var sec = state.sections[i];
		var top = sec.el.offsetTop;
		if (top <= scrollY + opts.sectionLookback) {
			var dist = Math.abs(top - scrollY - 180);
			if (dist < bestDist) {
				bestDist = dist;
				best = sec;
			}
		}
	}
	return best;
}

// ── Scroll Settle Detection ──

function onScrollSettle() {
	var opts = state.options;
	var curY = window.scrollY || window.pageYOffset;

	if (Math.abs(curY - state._prevY) > opts.settleTolerance) {
		state._prevY = curY;
		state.scrollTimer = setTimeout(onScrollSettle, opts.recheckInterval);
		return;
	}

	// Settled — report section
	var current = findCurrentSection();
	if (current && !state.seen[current.id]) {
		state.seen[current.id] = true;
		Metrics.send('section:' + current.id, {
			tag: current.tag,
			ordinal: current.ordinal,
			snippet: current.snippet
		});
	}

	// Report depth
	var docH = document.documentElement.scrollHeight - window.innerHeight;
	if (docH > 0) {
		var pct = Math.round((curY / docH) * 100);
		for (var j = 0; j < opts.depthMilestones.length; j++) {
			var m = opts.depthMilestones[j];
			if (pct >= m && !state.depthHit[m]) {
				state.depthHit[m] = true;
				Metrics.send('depth:' + m + '%');
			}
		}
	}
}

function onScroll() {
	if (state.anchorCooling) return;
	clearTimeout(state.scrollTimer);
	state._prevY = window.scrollY || window.pageYOffset;
	state.scrollTimer = setTimeout(onScrollSettle, state.options.debounce);
}

// ── TOC Highlighting (real-time) ──

function updateTocHighlight() {
	var opts = state.options;
	if (!opts.tocSelector) return;

	var scrollY = window.scrollY || window.pageYOffset;
	var currentId = '';

	for (var i = 0; i < state.tocSections.length; i++) {
		if (scrollY >= state.tocSections[i].el.offsetTop - 160) {
			currentId = state.tocSections[i].id;
		}
	}

	var links = document.querySelectorAll(opts.tocSelector);
	for (var j = 0; j < links.length; j++) {
		links[j].classList.remove(opts.tocActiveClass);
		if (links[j].getAttribute('href') === '#' + currentId) {
			links[j].classList.add(opts.tocActiveClass);
		}
	}
}

// ── Click Tracking ──

function onDocumentClick(e) {
	var a = e.target.closest('a[href]');
	if (!a) return;

	var href = a.getAttribute('href') || '';

	if (href.charAt(0) === '#') {
		// Anchor click — cooldown to suppress scroll tracking
		state.anchorCooling = true;
		setTimeout(function () { state.anchorCooling = false; },
			state.options.anchorCooldown);
		Metrics.send('anchor:' + href.slice(1));
		return;
	}

	// External link
	var label = a.dataset.track || 'link:' + href;
	Metrics.send(label);
}

// ── Pre-mark Initial State ──

function premarkInitialState() {
	var scrollY = window.scrollY || window.pageYOffset;

	for (var i = 0; i < state.sections.length; i++) {
		var rect = state.sections[i].el.getBoundingClientRect();
		if (rect.top >= -100 && rect.top < window.innerHeight) {
			state.seen[state.sections[i].id] = true;
		}
	}

	var docH = document.documentElement.scrollHeight - window.innerHeight;
	if (docH > 0) {
		var pct = Math.round((scrollY / docH) * 100);
		for (var j = 0; j < state.options.depthMilestones.length; j++) {
			var m = state.options.depthMilestones[j];
			if (pct >= m) state.depthHit[m] = true;
		}
	}
}

// ── Public API ──

Metrics.ScrollTracker = {

	init: function (options) {
		if (state.initialized) {
			console.warn('Metrics.ScrollTracker already initialized');
			return this;
		}

		var opts = {};
		var k;
		for (k in defaults) { if (defaults.hasOwnProperty(k)) opts[k] = defaults[k]; }
		for (k in (options || {})) { if (options.hasOwnProperty(k) && options[k] !== undefined) opts[k] = options[k]; }
		state.options = opts;
		state.initialized = true;

		// If Metrics core hasn't been initialized yet with an endpoint,
		// initialize it now from our options
		if (!Metrics._endpoint && options && options.endpoint) {
			Metrics.init({
				endpoint: options.endpoint,
				page: options.page,
				sessionKey: options.sessionKey,
				sessionId: options.sessionId,
				extra: options.extra,
				trackUnload: options.trackUnload
			});
		}

		// Delayed init — let scroll restoration settle
		setTimeout(function () {
			state.sections = discoverSections(opts.sections);

			if (opts.tocSelector && opts.tocSectionSelector) {
				state.tocSections = discoverSections(opts.tocSectionSelector);
			}

			premarkInitialState();

			window.addEventListener('scroll', onScroll, { passive: true });

			if (opts.tocSelector) {
				window.addEventListener('scroll', updateTocHighlight, { passive: true });
				updateTocHighlight();
			}
		}, opts.initDelay);

		if (opts.trackClicks) {
			document.addEventListener('click', onDocumentClick);
		}

		return this;
	},

	send: function (label, data) { Metrics.send(label, data); },
	markSeen: function (id) { state.seen[id] = true; },
	getSessionId: function () { return Metrics.getSessionId(); },
	getSections: function () {
		return state.sections.map(function (s) {
			return { id: s.id, tag: s.tag, ordinal: s.ordinal, snippet: s.snippet };
		});
	},
	getSeen: function () {
		var copy = {};
		for (var k in state.seen) copy[k] = true;
		return copy;
	},
	reset: function () {
		state.seen = {};
		state.depthHit = {};
		state.anchorCooling = false;
		clearTimeout(state.scrollTimer);
		state.sections = discoverSections(state.options.sections);
		premarkInitialState();
	},
	destroy: function () {
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('scroll', updateTocHighlight);
		document.removeEventListener('click', onDocumentClick);
		clearTimeout(state.scrollTimer);
		state.initialized = false;
	},

	defaults: defaults,
	state: state
};

})(typeof window !== 'undefined' ? window : this);

/**
 * Metrics.ScrollTracker — Section-aware scroll telemetry
 * 
 * Tracks which sections a user reads, how far they scroll,
 * and what they click. Delegates transport, session, visibility,
 * and unload handling to the core Metrics object.
 * 
 * Usage (standalone):
 *   Metrics.init({ endpoint: '/telemetry.php', page: 'My Page' });
 *   Metrics.ScrollTracker.init({
 *     sections: 'h2[id], h3[id]',
 *     debounce: 1000
 *   });
 * 
 * Usage (with Q framework):
 *   // Auto-initializes from config if endpoint is set
 * 
 * @module Metrics
 * @class Metrics.ScrollTracker
 */
"use strict";
(function (root) {

var Metrics = root.Metrics;
if (!Metrics) {
	console.warn('Metrics.ScrollTracker: Metrics core not loaded');
	return;
}

var defaults = {
	// CSS selector for sections to track
	sections: 'h2[id], h3[id], section[id], [data-section]',

	// Minimum pixel height for auto-detected containers
	minSectionHeight: 100,

	// Milliseconds to wait after scroll stops before firing
	debounce: 1000,

	// Milliseconds to wait on page load (ignores scroll restoration)
	initDelay: 800,

	// Milliseconds to suppress tracking after anchor click
	anchorCooldown: 1500,

	// Scroll depth milestones (percentage)
	depthMilestones: [25, 50, 75, 100],

	// Max px above viewport top to consider a section "current"
	sectionLookback: 300,

	// Scroll considered settled if moved less than this (px)
	settleTolerance: 2,

	// Recheck interval when not settled (ms)
	recheckInterval: 500,

	// Track link/anchor clicks
	trackClicks: true,

	// Visual TOC highlighting selector (real-time, not debounced)
	tocSelector: null,
	tocActiveClass: 'active',
	tocSectionSelector: 'h2[id]'
};

// ── State ──
var state = {
	initialized: false,
	options: null,
	sections: [],
	tocSections: [],
	seen: {},
	depthHit: {},
	scrollTimer: null,
	anchorCooling: false,
	_prevY: -1
};

// ── Section Discovery ──

function discoverSections(selector) {
	var elements = document.querySelectorAll(selector);
	var result = [];
	var ordinal = 0;
	var minH = (state.options && state.options.minSectionHeight) || 0;

	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		if (el.offsetHeight < minH) continue;

		if (!el.id) {
			var text = (el.textContent || '').trim().slice(0, 60);
			var slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
			el.id = slug || ('section-' + ordinal);
		}

		result.push({
			el: el,
			id: el.id,
			tag: el.tagName.toLowerCase(),
			ordinal: ordinal++,
			snippet: (el.textContent || '').trim().slice(0, 80)
		});
	}
	return result;
}

// ── Find Current Section ──

function findCurrentSection() {
	var scrollY = window.scrollY || window.pageYOffset;
	var opts = state.options;
	var best = null;
	var bestDist = Infinity;

	for (var i = 0; i < state.sections.length; i++) {
		var sec = state.sections[i];
		var top = sec.el.offsetTop;
		if (top <= scrollY + opts.sectionLookback) {
			var dist = Math.abs(top - scrollY - 180);
			if (dist < bestDist) {
				bestDist = dist;
				best = sec;
			}
		}
	}
	return best;
}

// ── Scroll Settle Detection ──

function onScrollSettle() {
	var opts = state.options;
	var curY = window.scrollY || window.pageYOffset;

	if (Math.abs(curY - state._prevY) > opts.settleTolerance) {
		state._prevY = curY;
		state.scrollTimer = setTimeout(onScrollSettle, opts.recheckInterval);
		return;
	}

	// Settled — report section
	var current = findCurrentSection();
	if (current && !state.seen[current.id]) {
		state.seen[current.id] = true;
		Metrics.send('section:' + current.id, {
			tag: current.tag,
			ordinal: current.ordinal,
			snippet: current.snippet
		});
	}

	// Report depth
	var docH = document.documentElement.scrollHeight - window.innerHeight;
	if (docH > 0) {
		var pct = Math.round((curY / docH) * 100);
		for (var j = 0; j < opts.depthMilestones.length; j++) {
			var m = opts.depthMilestones[j];
			if (pct >= m && !state.depthHit[m]) {
				state.depthHit[m] = true;
				Metrics.send('depth:' + m + '%');
			}
		}
	}
}

function onScroll() {
	if (state.anchorCooling) return;
	clearTimeout(state.scrollTimer);
	state._prevY = window.scrollY || window.pageYOffset;
	state.scrollTimer = setTimeout(onScrollSettle, state.options.debounce);
}

// ── TOC Highlighting (real-time) ──

function updateTocHighlight() {
	var opts = state.options;
	if (!opts.tocSelector) return;

	var scrollY = window.scrollY || window.pageYOffset;
	var currentId = '';

	for (var i = 0; i < state.tocSections.length; i++) {
		if (scrollY >= state.tocSections[i].el.offsetTop - 160) {
			currentId = state.tocSections[i].id;
		}
	}

	var links = document.querySelectorAll(opts.tocSelector);
	for (var j = 0; j < links.length; j++) {
		links[j].classList.remove(opts.tocActiveClass);
		if (links[j].getAttribute('href') === '#' + currentId) {
			links[j].classList.add(opts.tocActiveClass);
		}
	}
}

// ── Click Tracking ──

function onDocumentClick(e) {
	var a = e.target.closest('a[href]');
	if (!a) return;

	var href = a.getAttribute('href') || '';

	if (href.charAt(0) === '#') {
		// Anchor click — cooldown to suppress scroll tracking
		state.anchorCooling = true;
		setTimeout(function () { state.anchorCooling = false; },
			state.options.anchorCooldown);
		Metrics.send('anchor:' + href.slice(1));
		return;
	}

	// External link
	var label = a.dataset.track || 'link:' + href;
	Metrics.send(label);
}

// ── Pre-mark Initial State ──

function premarkInitialState() {
	var scrollY = window.scrollY || window.pageYOffset;

	for (var i = 0; i < state.sections.length; i++) {
		var rect = state.sections[i].el.getBoundingClientRect();
		if (rect.top >= -100 && rect.top < window.innerHeight) {
			state.seen[state.sections[i].id] = true;
		}
	}

	var docH = document.documentElement.scrollHeight - window.innerHeight;
	if (docH > 0) {
		var pct = Math.round((scrollY / docH) * 100);
		for (var j = 0; j < state.options.depthMilestones.length; j++) {
			var m = state.options.depthMilestones[j];
			if (pct >= m) state.depthHit[m] = true;
		}
	}
}

// ── Public API ──

Metrics.ScrollTracker = {

	init: function (options) {
		if (state.initialized) {
			console.warn('Metrics.ScrollTracker already initialized');
			return this;
		}

		var opts = {};
		var k;
		for (k in defaults) { if (defaults.hasOwnProperty(k)) opts[k] = defaults[k]; }
		for (k in (options || {})) { if (options.hasOwnProperty(k) && options[k] !== undefined) opts[k] = options[k]; }
		state.options = opts;
		state.initialized = true;

		// If Metrics core hasn't been initialized yet with an endpoint,
		// initialize it now from our options
		if (!Metrics._endpoint && options && options.endpoint) {
			Metrics.init({
				endpoint: options.endpoint,
				page: options.page,
				sessionKey: options.sessionKey,
				sessionId: options.sessionId,
				extra: options.extra,
				trackUnload: options.trackUnload
			});
		}

		// Delayed init — let scroll restoration settle
		setTimeout(function () {
			state.sections = discoverSections(opts.sections);

			if (opts.tocSelector && opts.tocSectionSelector) {
				state.tocSections = discoverSections(opts.tocSectionSelector);
			}

			premarkInitialState();

			window.addEventListener('scroll', onScroll, { passive: true });

			if (opts.tocSelector) {
				window.addEventListener('scroll', updateTocHighlight, { passive: true });
				updateTocHighlight();
			}
		}, opts.initDelay);

		if (opts.trackClicks) {
			document.addEventListener('click', onDocumentClick);
		}

		return this;
	},

	send: function (label, data) { Metrics.send(label, data); },
	markSeen: function (id) { state.seen[id] = true; },
	getSessionId: function () { return Metrics.getSessionId(); },
	getSections: function () {
		return state.sections.map(function (s) {
			return { id: s.id, tag: s.tag, ordinal: s.ordinal, snippet: s.snippet };
		});
	},
	getSeen: function () {
		var copy = {};
		for (var k in state.seen) copy[k] = true;
		return copy;
	},
	reset: function () {
		state.seen = {};
		state.depthHit = {};
		state.anchorCooling = false;
		clearTimeout(state.scrollTimer);
		state.sections = discoverSections(state.options.sections);
		premarkInitialState();
	},
	destroy: function () {
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('scroll', updateTocHighlight);
		document.removeEventListener('click', onDocumentClick);
		clearTimeout(state.scrollTimer);
		state.initialized = false;
	},

	defaults: defaults,
	state: state
};

})(typeof window !== 'undefined' ? window : this);

/**
 * Metrics.NavigationTracker — Track how users navigate and explore content
 * 
 * Tracks scroll-based sections, dynamic panels (tabs, columns, expandables,
 * contextual menus), and links that scroll into view in navigation containers.
 * Delegates transport, session, visibility, and unload to Metrics core.
 * 
 * Event prefixes:
 *   section:id       — scroll-based section reached viewport
 *   depth:N%         — scroll depth milestone
 *   anchor:id        — clicked an anchor link
 *   link:url         — clicked an external link
 *   tab:name         — tab switched to
 *   column:name      — column opened/closed
 *   expandable:id    — expandable opened/closed
 *   contextual:id    — contextual menu shown/hidden
 *   contextual-item:action — item selected from contextual menu
 *   nav-link:id      — link scrolled into view in a nav container
 *   opened:prefix:id — first time viewing a dynamic section
 *   switched:prefix:id — returned to previously viewed section
 *   dwell:prefix:id  — time spent in a dynamic section
 * 
 * @module Metrics
 * @class Metrics.NavigationTracker
 */
"use strict";
(function (root) {

var Metrics = root.Metrics;
if (!Metrics) {
	console.warn('Metrics.NavigationTracker: Metrics core not loaded');
	return;
}

var defaults = {
	// ── Scroll-based section tracking ──
	sections: 'h2[id], h3[id], section[id], [data-section]',
	minSectionHeight: 100,
	debounce: 1000,
	initDelay: 800,
	anchorCooldown: 1500,
	depthMilestones: [25, 50, 75, 100],
	sectionLookback: 300,
	settleTolerance: 2,
	recheckInterval: 500,

	// ── Dynamic section tracking ──
	observeDom: false,
	observeRoot: null,
	observeSelector: '[data-section], [data-track-section]',
	trackDwell: true,

	// ── Navigation container link tracking ──
	// CSS selector for scrollable nav containers whose links should be
	// tracked as they scroll into view
	navContainers: null, // e.g. '.Q_listing_wrapper, .sidebar-nav'

	// ── Contextual menu tracking ──
	trackContextuals: true,

	// ── Click & TOC ──
	trackClicks: true,
	tocSelector: null,
	tocActiveClass: 'active',
	tocSectionSelector: 'h2[id]'
};

// ── State ──
var state = {
	initialized: false,
	options: null,
	sections: [],
	tocSections: [],
	seen: {},
	depthHit: {},
	scrollTimer: null,
	anchorCooling: false,
	_prevY: -1,
	// Dynamic sections
	dynamicSections: {},
	activeSection: null,
	activeSince: null,
	// DOM observer
	_mutationObserver: null,
	// Nav container observers
	_navObservers: [],
	_navLinksSeen: {}
};

// ── Utilities ──

function slugify(text) {
	return text.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 60);
}

function snippet(el) {
	return (el.textContent || '').trim().slice(0, 80);
}

function now() { return Date.now(); }

// ── Section Discovery ──

function discoverSections(selector) {
	var elements = document.querySelectorAll(selector);
	var result = [];
	var ordinal = 0;
	var minH = (state.options && state.options.minSectionHeight) || 0;
	for (var i = 0; i < elements.length; i++) {
		var el = elements[i];
		if (el.offsetHeight < minH) continue;
		if (!el.id) {
			el.id = slugify(el.textContent || '') || ('section-' + ordinal);
		}
		result.push({
			el: el, id: el.id,
			tag: el.tagName.toLowerCase(),
			ordinal: ordinal++,
			snippet: snippet(el)
		});
	}
	return result;
}

// ── Find Current Section ──

function findCurrentSection() {
	var scrollY = window.scrollY || window.pageYOffset;
	var opts = state.options;
	var best = null, bestDist = Infinity;
	for (var i = 0; i < state.sections.length; i++) {
		var sec = state.sections[i];
		var top = sec.el.offsetTop;
		if (top <= scrollY + opts.sectionLookback) {
			var dist = Math.abs(top - scrollY - 180);
			if (dist < bestDist) { bestDist = dist; best = sec; }
		}
	}
	return best;
}

// ── Scroll Settle ──

function onScrollSettle() {
	var opts = state.options;
	var curY = window.scrollY || window.pageYOffset;
	if (Math.abs(curY - state._prevY) > opts.settleTolerance) {
		state._prevY = curY;
		state.scrollTimer = setTimeout(onScrollSettle, opts.recheckInterval);
		return;
	}
	var current = findCurrentSection();
	if (current && !state.seen[current.id]) {
		state.seen[current.id] = true;
		Metrics.send('section:' + current.id, {
			tag: current.tag, ordinal: current.ordinal, snippet: current.snippet
		});
	}
	var docH = document.documentElement.scrollHeight - window.innerHeight;
	if (docH > 0) {
		var pct = Math.round((curY / docH) * 100);
		for (var j = 0; j < opts.depthMilestones.length; j++) {
			var m = opts.depthMilestones[j];
			if (pct >= m && !state.depthHit[m]) {
				state.depthHit[m] = true;
				Metrics.send('depth:' + m + '%');
			}
		}
	}
}

function onScroll() {
	if (state.anchorCooling) return;
	clearTimeout(state.scrollTimer);
	state._prevY = window.scrollY || window.pageYOffset;
	state.scrollTimer = setTimeout(onScrollSettle, state.options.debounce);
}

// ── TOC Highlighting ──

function updateTocHighlight() {
	var opts = state.options;
	if (!opts.tocSelector) return;
	var scrollY = window.scrollY || window.pageYOffset;
	var currentId = '';
	for (var i = 0; i < state.tocSections.length; i++) {
		if (scrollY >= state.tocSections[i].el.offsetTop - 160) {
			currentId = state.tocSections[i].id;
		}
	}
	var links = document.querySelectorAll(opts.tocSelector);
	for (var j = 0; j < links.length; j++) {
		links[j].classList.remove(opts.tocActiveClass);
		if (links[j].getAttribute('href') === '#' + currentId) {
			links[j].classList.add(opts.tocActiveClass);
		}
	}
}

// ── Click Tracking ──

function onDocumentClick(e) {
	var a = e.target.closest('a[href]');
	if (!a) return;
	var href = a.getAttribute('href') || '';
	if (href.charAt(0) === '#') {
		state.anchorCooling = true;
		setTimeout(function () { state.anchorCooling = false; },
			state.options.anchorCooldown);
		Metrics.send('anchor:' + href.slice(1));
		return;
	}
	var label = a.dataset.track || 'link:' + href;
	Metrics.send(label);
}

// ── Dynamic Section Tracking ──

function _closeCurrent() {
	if (!state.activeSection || !state.options.trackDwell) return;
	var elapsed = Math.round((now() - state.activeSince) / 1000);
	if (elapsed > 0) {
		var sec = state.dynamicSections[state.activeSection];
		Metrics.send('dwell:' + state.activeSection, {
			seconds: elapsed,
			name: sec ? sec.name : state.activeSection
		});
	}
	state.activeSection = null;
	state.activeSince = null;
}

function _observeElement(el, opts) {
	var id = opts.id || el.id || el.getAttribute('data-section')
		|| el.getAttribute('data-track-section')
		|| slugify(el.textContent || '') || ('dyn-' + Object.keys(state.dynamicSections).length);
	if (!el.id) el.id = id;
	state.dynamicSections[id] = {
		el: el, id: id,
		name: opts.name || el.getAttribute('data-section-name') || el.getAttribute('title') || id,
		snippet: snippet(el), observedAt: now()
	};
	if (window.IntersectionObserver && opts.autoTrack !== false) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
					NT.opened(id);
				} else if (!entry.isIntersecting && state.activeSection === id) {
					NT.closed(id);
				}
			});
		}, { threshold: [0, 0.3] });
		io.observe(el);
		state.dynamicSections[id]._io = io;
	}
	return id;
}

// ── Nav Container Link Tracking ──
// Watches scrollable navigation containers and fires 'nav-link:' events
// when links scroll into view (like contextual menu items, sidebar nav, etc.)

function _setupNavContainerTracking() {
	var selector = state.options.navContainers;
	if (!selector || !window.IntersectionObserver) return;

	var containers = document.querySelectorAll(selector);
	for (var c = 0; c < containers.length; c++) {
		_observeNavContainer(containers[c]);
	}
}

function _observeNavContainer(container) {
	var links = container.querySelectorAll('a[href], li[data-action], li[data-name]');
	if (!links.length) return;

	var io = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (!entry.isIntersecting) return;
			var el = entry.target;
			var linkId = el.getAttribute('data-name')
				|| el.getAttribute('data-action')
				|| el.getAttribute('href')
				|| el.textContent.trim().slice(0, 40);
			var key = 'nav-link:' + linkId;
			if (!state._navLinksSeen[key]) {
				state._navLinksSeen[key] = true;
				Metrics.send(key, { text: el.textContent.trim().slice(0, 60) });
			}
		});
	}, {
		root: container,
		threshold: 0.5
	});

	for (var i = 0; i < links.length; i++) {
		io.observe(links[i]);
	}
	state._navObservers.push(io);
}

// ── DOM Mutation Observer ──

function _startMutationObserver() {
	if (!window.MutationObserver || !state.options.observeDom) return;
	var root = state.options.observeRoot || document.body;
	var selector = state.options.observeSelector;
	state._mutationObserver = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			mutation.addedNodes.forEach(function (node) {
				if (node.nodeType !== 1) return;
				if (node.matches && node.matches(selector)) {
					_observeElement(node, {});
				}
				if (node.querySelectorAll) {
					var matches = node.querySelectorAll(selector);
					for (var i = 0; i < matches.length; i++) {
						_observeElement(matches[i], {});
					}
				}
			});
		});
	});
	state._mutationObserver.observe(root, { childList: true, subtree: true });
}

// ── Pre-mark Initial State ──

function premarkInitialState() {
	var scrollY = window.scrollY || window.pageYOffset;
	for (var i = 0; i < state.sections.length; i++) {
		var rect = state.sections[i].el.getBoundingClientRect();
		if (rect.top >= -100 && rect.top < window.innerHeight) {
			state.seen[state.sections[i].id] = true;
		}
	}
	var docH = document.documentElement.scrollHeight - window.innerHeight;
	if (docH > 0) {
		var pct = Math.round((scrollY / docH) * 100);
		for (var j = 0; j < state.options.depthMilestones.length; j++) {
			var m = state.options.depthMilestones[j];
			if (pct >= m) state.depthHit[m] = true;
		}
	}
}

// ── Public API ──

var NT = {

	init: function (options) {
		if (state.initialized) {
			console.warn('Metrics.NavigationTracker already initialized');
			return this;
		}
		var opts = {};
		var k;
		for (k in defaults) { if (defaults.hasOwnProperty(k)) opts[k] = defaults[k]; }
		for (k in (options || {})) { if (options.hasOwnProperty(k) && options[k] !== undefined) opts[k] = options[k]; }
		state.options = opts;
		state.initialized = true;

		if (!Metrics._endpoint && options && options.endpoint) {
			Metrics.init({
				endpoint: options.endpoint, page: options.page,
				sessionKey: options.sessionKey, sessionId: options.sessionId,
				extra: options.extra, trackUnload: options.trackUnload
			});
		}

		// Delayed init
		setTimeout(function () {
			state.sections = discoverSections(opts.sections);
			if (opts.tocSelector && opts.tocSectionSelector) {
				state.tocSections = discoverSections(opts.tocSectionSelector);
			}
			premarkInitialState();
			window.addEventListener('scroll', onScroll, { passive: true });
			if (opts.tocSelector) {
				window.addEventListener('scroll', updateTocHighlight, { passive: true });
				updateTocHighlight();
			}
			if (opts.observeDom) _startMutationObserver();
			if (opts.navContainers) _setupNavContainerTracking();
		}, opts.initDelay);

		if (opts.trackClicks) {
			document.addEventListener('click', onDocumentClick);
		}

		if (opts.trackDwell) {
			Metrics.onVisibilityChange(function (visible) {
				if (!visible) _closeCurrent();
			}, 'NavigationTracker.dwell');
		}

		return this;
	},

	/**
	 * Observe a dynamic element as a trackable section
	 */
	observe: function (el, opts) {
		return _observeElement(el, opts || {});
	},

	/**
	 * Signal a section/panel/tab/contextual was opened or switched to
	 */
	opened: function (id) {
		if (state.activeSection === id) return;
		_closeCurrent();
		state.activeSection = id;
		state.activeSince = now();
		if (!state.seen[id]) {
			state.seen[id] = true;
			var sec = state.dynamicSections[id];
			Metrics.send('opened:' + id, {
				name: sec ? sec.name : id,
				snippet: sec ? sec.snippet : ''
			});
		} else {
			Metrics.send('switched:' + id, {
				name: (state.dynamicSections[id] || {}).name || id
			});
		}
	},

	/**
	 * Signal a section/panel/tab/contextual was closed
	 */
	closed: function (id) {
		if (state.activeSection !== id) return;
		_closeCurrent();
	},

	/**
	 * Track a navigation container — observe its links scrolling into view
	 */
	observeNavContainer: function (container) {
		_observeNavContainer(container);
	},

	send: function (label, data) { Metrics.send(label, data); },
	markSeen: function (id) { state.seen[id] = true; },
	getSessionId: function () { return Metrics.getSessionId(); },
	getSections: function () {
		return state.sections.map(function (s) {
			return { id: s.id, tag: s.tag, ordinal: s.ordinal, snippet: s.snippet };
		});
	},
	getDynamicSections: function () {
		var result = {};
		for (var id in state.dynamicSections) {
			var s = state.dynamicSections[id];
			result[id] = { id: s.id, name: s.name, snippet: s.snippet };
		}
		return result;
	},
	getSeen: function () {
		var copy = {};
		for (var k in state.seen) copy[k] = true;
		return copy;
	},
	getActive: function () {
		if (!state.activeSection) return null;
		return {
			id: state.activeSection,
			since: state.activeSince,
			elapsed: Math.round((now() - state.activeSince) / 1000)
		};
	},
	reset: function () {
		_closeCurrent();
		state.seen = {};
		state.depthHit = {};
		state.anchorCooling = false;
		state._navLinksSeen = {};
		clearTimeout(state.scrollTimer);
		for (var id in state.dynamicSections) {
			if (state.dynamicSections[id]._io) state.dynamicSections[id]._io.disconnect();
		}
		state.dynamicSections = {};
		state.activeSection = null;
		state.activeSince = null;
		state.sections = discoverSections(state.options.sections);
		premarkInitialState();
	},
	destroy: function () {
		_closeCurrent();
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('scroll', updateTocHighlight);
		document.removeEventListener('click', onDocumentClick);
		clearTimeout(state.scrollTimer);
		if (state._mutationObserver) {
			state._mutationObserver.disconnect();
			state._mutationObserver = null;
		}
		for (var id in state.dynamicSections) {
			if (state.dynamicSections[id]._io) state.dynamicSections[id]._io.disconnect();
		}
		for (var n = 0; n < state._navObservers.length; n++) {
			state._navObservers[n].disconnect();
		}
		state._navObservers = [];
		state.initialized = false;
	},

	defaults: defaults,
	state: state
};

Metrics.NavigationTracker = NT;
// Backward compat aliases
Metrics.SectionTracker = NT;
Metrics.ScrollTracker = NT;

})(typeof window !== 'undefined' ? window : this);

/**
 * Metrics.MediaTracker — Track video/audio engagement
 * 
 * Auto-discovers native <video>/<audio> elements and YouTube/Vimeo
 * iframes. Hooks into play/pause/seek/ended events and sends
 * periodic checkpoints during playback.
 * 
 * Events:
 *   media-play:id       — playback started
 *   media-pause:id      — playback paused
 *   media-checkpoint:id — periodic position update during playback
 *   media-ended:id      — reached the end
 *   media-seeked:id     — user jumped to a position
 * 
 * Usage:
 *   Metrics.init({ endpoint: '/telemetry.php' });
 *   Metrics.MediaTracker.init({
 *     checkpointInterval: 10,  // seconds
 *     reloadIframes: false     // don't reload to inject API params
 *   });
 * 
 * @module Metrics
 * @class Metrics.MediaTracker
 */
"use strict";
(function (root) {

var Metrics = root.Metrics;
if (!Metrics) {
	console.warn('Metrics.MediaTracker: Metrics core not loaded');
	return;
}

var defaults = {
	// Seconds between checkpoint events during playback
	checkpointInterval: 10,

	// Auto-discover media elements on init
	autoDiscover: true,

	// CSS selector for native media elements
	mediaSelector: 'video, audio',

	// Whether to reload YouTube/Vimeo iframes to inject API params
	// Default false: logs a warning instead of disrupting playback
	reloadIframes: false,

	// Observe DOM for dynamically added media
	observeDom: true,

	// Root element to watch for mutations
	observeRoot: null,

	// Debounce checkpoint sends (ms) — prevents burst on rapid seeks
	checkpointDebounce: 1000
};

// ── State ──
var state = {
	initialized: false,
	options: null,
	tracked: {},       // id → tracker object
	_counter: 0,       // for generating IDs
	_mutationObserver: null,
	_ytApiLoaded: false,
	_ytApiLoading: false,
	_ytPendingPlayers: [], // iframes waiting for API
	_vimeoApiLoaded: false,
	_vimeoApiLoading: false
};

// ── Utilities ──

function genId(el) {
	if (el.id) return el.id;
	var src = el.src || el.currentSrc || '';
	if (src) {
		// Extract meaningful part of URL
		var match = src.match(/(?:youtu\.be\/|youtube\.com\/embed\/|vimeo\.com\/video\/|vimeo\.com\/)([^?&#]+)/);
		if (match) return match[1];
		// Use filename
		var parts = src.split('/').pop().split('?')[0];
		if (parts && parts.length < 60) return parts;
	}
	return 'media-' + (state._counter++);
}

function now() { return Date.now(); }

// ── Watched Seconds Tracker ──
// Tracks unique seconds viewed (handles seeking/rewatching)

function WatchedTracker() {
	this.ranges = []; // [{start, end}] sorted, non-overlapping
}

WatchedTracker.prototype.add = function (from, to) {
	if (to <= from) return;
	var newRange = { start: Math.floor(from), end: Math.ceil(to) };
	var merged = [];
	var inserted = false;
	for (var i = 0; i < this.ranges.length; i++) {
		var r = this.ranges[i];
		if (r.end < newRange.start) {
			merged.push(r);
		} else if (r.start > newRange.end) {
			if (!inserted) { merged.push(newRange); inserted = true; }
			merged.push(r);
		} else {
			newRange.start = Math.min(newRange.start, r.start);
			newRange.end = Math.max(newRange.end, r.end);
		}
	}
	if (!inserted) merged.push(newRange);
	this.ranges = merged;
};

WatchedTracker.prototype.total = function () {
	var t = 0;
	for (var i = 0; i < this.ranges.length; i++) {
		t += this.ranges[i].end - this.ranges[i].start;
	}
	return t;
};

// ── Core Tracker Object (per media element) ──

function createTracker(id, type, el, duration) {
	return {
		id: id,
		type: type,           // 'native', 'youtube', 'vimeo'
		el: el,
		duration: duration || 0,
		playing: false,
		lastPosition: 0,
		lastCheckpointAt: 0,  // timestamp of last checkpoint send
		watched: new WatchedTracker(),
		checkpointTimer: null,
		_lastTimeUpdate: 0    // position at last timeupdate
	};
}

function sendEvent(tracker, event, extra) {
	var data = {
		type: tracker.type,
		position: Math.round(tracker.lastPosition),
		duration: Math.round(tracker.duration),
		watched: tracker.watched.total()
	};
	if (extra) {
		for (var k in extra) data[k] = extra[k];
	}
	Metrics.send(event + ':' + tracker.id, data);
}

// ── Checkpoint Timer ──

function startCheckpoints(tracker) {
	stopCheckpoints(tracker);
	var interval = state.options.checkpointInterval * 1000;
	tracker.checkpointTimer = setInterval(function () {
		if (tracker.playing) {
			sendEvent(tracker, 'media-checkpoint');
		}
	}, interval);
}

function stopCheckpoints(tracker) {
	if (tracker.checkpointTimer) {
		clearInterval(tracker.checkpointTimer);
		tracker.checkpointTimer = null;
	}
}

// ── Native <video> / <audio> ──

function trackNative(el) {
	var id = genId(el);
	if (state.tracked[id]) return; // already tracking

	var tracker = createTracker(id, 'native', el, el.duration || 0);
	state.tracked[id] = tracker;

	el.addEventListener('loadedmetadata', function () {
		tracker.duration = el.duration || 0;
	});

	el.addEventListener('play', function () {
		tracker.playing = true;
		tracker.lastPosition = el.currentTime;
		tracker._lastTimeUpdate = el.currentTime;
		sendEvent(tracker, 'media-play');
		startCheckpoints(tracker);
	});

	el.addEventListener('pause', function () {
		if (!tracker.playing) return;
		tracker.playing = false;
		tracker.watched.add(tracker._lastTimeUpdate, el.currentTime);
		tracker.lastPosition = el.currentTime;
		stopCheckpoints(tracker);
		sendEvent(tracker, 'media-pause');
	});

	el.addEventListener('ended', function () {
		tracker.playing = false;
		tracker.watched.add(tracker._lastTimeUpdate, el.currentTime);
		tracker.lastPosition = el.currentTime;
		stopCheckpoints(tracker);
		sendEvent(tracker, 'media-ended');
	});

	el.addEventListener('seeked', function () {
		var from = tracker.lastPosition;
		tracker.lastPosition = el.currentTime;
		tracker._lastTimeUpdate = el.currentTime;
		sendEvent(tracker, 'media-seeked', {
			from: Math.round(from),
			to: Math.round(el.currentTime)
		});
	});

	el.addEventListener('timeupdate', function () {
		// Track watched range
		if (tracker.playing && el.currentTime > tracker._lastTimeUpdate) {
			tracker.watched.add(tracker._lastTimeUpdate, el.currentTime);
		}
		tracker._lastTimeUpdate = el.currentTime;
		tracker.lastPosition = el.currentTime;
	});
}

// ── YouTube Iframe ──

function loadYouTubeAPI(callback) {
	if (state._ytApiLoaded) { callback(); return; }
	if (state._ytApiLoading) {
		state._ytPendingPlayers.push(callback);
		return;
	}
	state._ytApiLoading = true;

	var prev = root.onYouTubeIframeAPIReady;
	root.onYouTubeIframeAPIReady = function () {
		state._ytApiLoaded = true;
		state._ytApiLoading = false;
		if (prev) prev();
		callback();
		for (var i = 0; i < state._ytPendingPlayers.length; i++) {
			state._ytPendingPlayers[i]();
		}
		state._ytPendingPlayers = [];
	};

	var script = document.createElement('script');
	script.src = 'https://www.youtube.com/iframe_api';
	document.head.appendChild(script);
}

function trackYouTube(iframe) {
	var src = iframe.src || '';
	var id = genId(iframe);
	if (state.tracked[id]) return;

	// Check for enablejsapi=1
	if (src.indexOf('enablejsapi') === -1) {
		if (state.options.reloadIframes) {
			var separator = src.indexOf('?') === -1 ? '?' : '&';
			iframe.src = src + separator + 'enablejsapi=1&origin=' + encodeURIComponent(location.origin);
			// iframe will reload, we'll catch it again via mutation observer or re-scan
		} else {
			console.warn('Metrics.MediaTracker: YouTube iframe missing enablejsapi=1, '
				+ 'set reloadIframes:true to auto-fix. iframe:', iframe);
			return;
		}
	}

	// Ensure iframe has an id for the YT API
	if (!iframe.id) iframe.id = 'yt-' + id;

	loadYouTubeAPI(function () {
		if (state.tracked[id]) return;
		var tracker = createTracker(id, 'youtube', iframe, 0);
		state.tracked[id] = tracker;

		var player = new YT.Player(iframe.id, {
			events: {
				onReady: function (e) {
					tracker.duration = player.getDuration() || 0;
				},
				onStateChange: function (e) {
					var pos = player.getCurrentTime() || 0;
					tracker.lastPosition = pos;

					switch (e.data) {
						case YT.PlayerState.PLAYING:
							tracker.playing = true;
							tracker._lastTimeUpdate = pos;
							tracker.duration = player.getDuration() || tracker.duration;
							sendEvent(tracker, 'media-play');
							startCheckpoints(tracker);
							// Poll position since YT has no timeupdate
							tracker._pollTimer = setInterval(function () {
								var p = player.getCurrentTime() || 0;
								if (tracker.playing && p > tracker._lastTimeUpdate) {
									tracker.watched.add(tracker._lastTimeUpdate, p);
								}
								tracker._lastTimeUpdate = p;
								tracker.lastPosition = p;
							}, 1000);
							break;

						case YT.PlayerState.PAUSED:
							if (!tracker.playing) break;
							tracker.playing = false;
							tracker.watched.add(tracker._lastTimeUpdate, pos);
							stopCheckpoints(tracker);
							clearInterval(tracker._pollTimer);
							sendEvent(tracker, 'media-pause');
							break;

						case YT.PlayerState.ENDED:
							tracker.playing = false;
							tracker.watched.add(tracker._lastTimeUpdate, pos);
							stopCheckpoints(tracker);
							clearInterval(tracker._pollTimer);
							sendEvent(tracker, 'media-ended');
							break;
					}
				}
			}
		});
		tracker._player = player;
	});
}

// ── Vimeo Iframe ──

function loadVimeoAPI(callback) {
	if (state._vimeoApiLoaded) { callback(); return; }
	if (state._vimeoApiLoading) {
		setTimeout(function () { loadVimeoAPI(callback); }, 200);
		return;
	}
	state._vimeoApiLoading = true;

	var script = document.createElement('script');
	script.src = 'https://player.vimeo.com/api/player.js';
	script.onload = function () {
		state._vimeoApiLoaded = true;
		state._vimeoApiLoading = false;
		callback();
	};
	document.head.appendChild(script);
}

function trackVimeo(iframe) {
	var src = iframe.src || '';
	var id = genId(iframe);
	if (state.tracked[id]) return;

	loadVimeoAPI(function () {
		if (state.tracked[id]) return;
		var tracker = createTracker(id, 'vimeo', iframe, 0);
		state.tracked[id] = tracker;

		var player = new Vimeo.Player(iframe);
		tracker._player = player;

		player.getDuration().then(function (d) { tracker.duration = d || 0; });

		player.on('play', function (data) {
			tracker.playing = true;
			tracker.lastPosition = data.seconds || 0;
			tracker._lastTimeUpdate = tracker.lastPosition;
			tracker.duration = data.duration || tracker.duration;
			sendEvent(tracker, 'media-play');
			startCheckpoints(tracker);
		});

		player.on('pause', function (data) {
			if (!tracker.playing) return;
			tracker.playing = false;
			var pos = data.seconds || 0;
			tracker.watched.add(tracker._lastTimeUpdate, pos);
			tracker.lastPosition = pos;
			stopCheckpoints(tracker);
			sendEvent(tracker, 'media-pause');
		});

		player.on('ended', function (data) {
			tracker.playing = false;
			var pos = data.seconds || tracker.duration;
			tracker.watched.add(tracker._lastTimeUpdate, pos);
			tracker.lastPosition = pos;
			stopCheckpoints(tracker);
			sendEvent(tracker, 'media-ended');
		});

		player.on('seeked', function (data) {
			var from = tracker.lastPosition;
			tracker.lastPosition = data.seconds || 0;
			tracker._lastTimeUpdate = tracker.lastPosition;
			sendEvent(tracker, 'media-seeked', {
				from: Math.round(from),
				to: Math.round(tracker.lastPosition)
			});
		});

		player.on('timeupdate', function (data) {
			var pos = data.seconds || 0;
			if (tracker.playing && pos > tracker._lastTimeUpdate) {
				tracker.watched.add(tracker._lastTimeUpdate, pos);
			}
			tracker._lastTimeUpdate = pos;
			tracker.lastPosition = pos;
		});
	});
}

// ── Auto-Discovery ──

function discoverMedia() {
	// Native elements
	var natives = document.querySelectorAll(state.options.mediaSelector);
	for (var i = 0; i < natives.length; i++) {
		trackNative(natives[i]);
	}

	// Iframes — detect by src URL
	var iframes = document.querySelectorAll('iframe[src]');
	for (var j = 0; j < iframes.length; j++) {
		var src = iframes[j].src || '';
		if (/youtube\.com\/embed|youtube-nocookie\.com\/embed/.test(src)) {
			trackYouTube(iframes[j]);
		} else if (/player\.vimeo\.com/.test(src)) {
			trackVimeo(iframes[j]);
		} else if (/w\.soundcloud\.com\/player/.test(src)) {
			trackSoundCloud(iframes[j]);
		} else if (/dailymotion\.com\/embed/.test(src)) {
			trackDailymotion(iframes[j]);
		} else if (/open\.spotify\.com\/embed/.test(src)) {
			trackSpotify(iframes[j]);
		} else if (/player\.twitch\.tv/.test(src)) {
			trackTwitch(iframes[j]);
		} else if (/muse\.ai\/embed/.test(src)) {
			trackMuseAi(iframes[j]);
		}
	}

	// Wistia — detected by class name, not iframe
	var wistias = document.querySelectorAll('[class*="wistia_embed"], [class*="wistia_async_"]');
	for (var k = 0; k < wistias.length; k++) {
		trackWistia(wistias[k]);
	}

	// JW Player — detected by container class or data attribute
	var jwContainers = document.querySelectorAll('.jwplayer, [data-jw-id]');
	for (var l = 0; l < jwContainers.length; l++) {
		trackJWPlayer(jwContainers[l]);
	}
}

// ── DOM Mutation Observer ──

function _startMutationObserver() {
	if (!window.MutationObserver || !state.options.observeDom) return;
	var root = state.options.observeRoot || document.body;

	state._mutationObserver = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			mutation.addedNodes.forEach(function (node) {
				if (node.nodeType !== 1) return;
				// Check the node itself
				if (node.matches && node.matches('video, audio')) {
					trackNative(node);
				}
				if (node.tagName === 'IFRAME' && node.src) {
					var s = node.src;
					if (/youtube\.com\/embed/.test(s)) trackYouTube(node);
					else if (/player\.vimeo\.com/.test(s)) trackVimeo(node);
					else if (/w\.soundcloud\.com\/player/.test(s)) trackSoundCloud(node);
					else if (/dailymotion\.com\/embed/.test(s)) trackDailymotion(node);
					else if (/open\.spotify\.com\/embed/.test(s)) trackSpotify(node);
					else if (/player\.twitch\.tv/.test(s)) trackTwitch(node);
					else if (/muse\.ai\/embed/.test(s)) trackMuseAi(node);
				}
				// Wistia containers
				if (node.className && /wistia_embed|wistia_async_/.test(node.className)) {
					trackWistia(node);
				}
				// JW Player containers
				if (node.className && /jwplayer/.test(node.className)) {
					trackJWPlayer(node);
				}
				// Check descendants
				if (node.querySelectorAll) {
					var natives = node.querySelectorAll('video, audio');
					for (var i = 0; i < natives.length; i++) trackNative(natives[i]);
					var iframes = node.querySelectorAll('iframe[src]');
					for (var j = 0; j < iframes.length; j++) {
						var s = iframes[j].src || '';
						if (/youtube\.com\/embed/.test(s)) trackYouTube(iframes[j]);
						else if (/player\.vimeo\.com/.test(s)) trackVimeo(iframes[j]);
						else if (/w\.soundcloud\.com\/player/.test(s)) trackSoundCloud(iframes[j]);
						else if (/dailymotion\.com\/embed/.test(s)) trackDailymotion(iframes[j]);
						else if (/open\.spotify\.com\/embed/.test(s)) trackSpotify(iframes[j]);
						else if (/player\.twitch\.tv/.test(s)) trackTwitch(iframes[j]);
						else if (/muse\.ai\/embed/.test(s)) trackMuseAi(iframes[j]);
					}
					var wistias = node.querySelectorAll('[class*="wistia_embed"], [class*="wistia_async_"]');
					for (var k = 0; k < wistias.length; k++) trackWistia(wistias[k]);
					var jws = node.querySelectorAll('.jwplayer, [data-jw-id]');
					for (var l = 0; l < jws.length; l++) trackJWPlayer(jws[l]);
				}
			});
		});
	});

	state._mutationObserver.observe(root, { childList: true, subtree: true });
}

// ── Flush All Playing Media ──

function flushAll() {
	for (var id in state.tracked) {
		var tracker = state.tracked[id];
		if (tracker.playing) {
			// Update watched range one last time
			if (tracker.type === 'native' && tracker.el) {
				tracker.watched.add(tracker._lastTimeUpdate, tracker.el.currentTime || tracker.lastPosition);
				tracker.lastPosition = tracker.el.currentTime || tracker.lastPosition;
			}
			sendEvent(tracker, 'media-checkpoint');
		}
	}
}

// ── Pre-mark Initial State ──

function premarkInitialState() {
	// Nothing to pre-mark for media — we want to track all plays
}

// ── Public API ──

var MT = {

	/**
	 * Initialize media tracking
	 */
	init: function (options) {
		if (state.initialized) {
			console.warn('Metrics.MediaTracker already initialized');
			return this;
		}

		var opts = {};
		var k;
		for (k in defaults) { if (defaults.hasOwnProperty(k)) opts[k] = defaults[k]; }
		for (k in (options || {})) { if (options.hasOwnProperty(k) && options[k] !== undefined) opts[k] = options[k]; }
		state.options = opts;
		state.initialized = true;

		// Auto-init Metrics core if needed
		if (!Metrics._endpoint && options && options.endpoint) {
			Metrics.init({
				endpoint: options.endpoint, page: options.page,
				trackUnload: options.trackUnload
			});
		}

		// Discover existing media
		if (opts.autoDiscover) {
			// Slight delay to let page render
			setTimeout(function () {
				discoverMedia();
			}, 500);
		}

		// Watch for dynamically added media
		if (opts.observeDom) {
			_startMutationObserver();
		}

		// Flush on page exit
		Metrics.onVisibilityChange(function (visible) {
			if (!visible) flushAll();
		}, 'MediaTracker.flush');

		return this;
	},

	/**
	 * Manually track a native video/audio element
	 * @param {Element} el — the <video> or <audio> element
	 * @param {String} [id] — optional custom ID
	 */
	trackNative: function (el, id) {
		if (id) el.id = id;
		trackNative(el);
	},

	/**
	 * Manually track a YouTube iframe
	 * @param {Element} iframe
	 * @param {String} [id]
	 */
	trackYouTube: function (iframe, id) {
		if (id) iframe.id = id;
		trackYouTube(iframe);
	},

	/**
	 * Manually track a Vimeo iframe
	 * @param {Element} iframe
	 * @param {String} [id]
	 */
	trackVimeo: function (iframe, id) {
		if (id) iframe.id = id;
		trackVimeo(iframe);
	},

	trackSoundCloud: function (iframe, id) {
		if (id) iframe.id = id;
		trackSoundCloud(iframe);
	},

	trackWistia: function (container, id) {
		if (id) container.id = id;
		trackWistia(container);
	},

	trackJWPlayer: function (container, id) {
		if (id) container.id = id;
		trackJWPlayer(container);
	},

	trackDailymotion: function (iframe, id) {
		if (id) iframe.id = id;
		trackDailymotion(iframe);
	},

	trackSpotify: function (iframe, id) {
		if (id) iframe.id = id;
		trackSpotify(iframe);
	},

	trackTwitch: function (iframe, id) {
		if (id) iframe.id = id;
		trackTwitch(iframe);
	},

	trackMuseAi: function (iframe, id) {
		if (id) iframe.id = id;
		trackMuseAi(iframe);
	},

	/**
	 * Get all tracked media and their current state
	 */
	getTracked: function () {
		var result = {};
		for (var id in state.tracked) {
			var t = state.tracked[id];
			result[id] = {
				id: t.id, type: t.type,
				playing: t.playing,
				position: Math.round(t.lastPosition),
				duration: Math.round(t.duration),
				watched: t.watched.total()
			};
		}
		return result;
	},

	/**
	 * Flush checkpoint for all currently playing media
	 */
	flush: flushAll,

	/**
	 * Re-scan the page for new media elements
	 */
	rescan: discoverMedia,

	/**
	 * Destroy — stop all tracking and remove observers
	 */
	destroy: function () {
		for (var id in state.tracked) {
			var t = state.tracked[id];
			stopCheckpoints(t);
			if (t._pollTimer) clearInterval(t._pollTimer);
		}
		state.tracked = {};
		if (state._mutationObserver) {
			state._mutationObserver.disconnect();
			state._mutationObserver = null;
		}
		state.initialized = false;
	},

	defaults: defaults,
	state: state
};

Metrics.MediaTracker = MT;

})(typeof window !== 'undefined' ? window : this);

// ── SoundCloud Widget ──

function loadSoundCloudAPI(callback) {
	if (root.SC && root.SC.Widget) { callback(); return; }
	var script = document.createElement('script');
	script.src = 'https://w.soundcloud.com/player/api.js';
	script.onload = callback;
	document.head.appendChild(script);
}

function trackSoundCloud(iframe) {
	var id = genId(iframe);
	if (state.tracked[id]) return;

	loadSoundCloudAPI(function () {
		if (state.tracked[id]) return;
		var widget = SC.Widget(iframe);
		var tracker = createTracker(id, 'soundcloud', iframe, 0);
		state.tracked[id] = tracker;

		widget.bind(SC.Widget.Events.READY, function () {
			widget.getDuration(function (d) { tracker.duration = (d || 0) / 1000; });
		});
		widget.bind(SC.Widget.Events.PLAY, function () {
			tracker.playing = true;
			widget.getPosition(function (p) {
				tracker.lastPosition = (p || 0) / 1000;
				tracker._lastTimeUpdate = tracker.lastPosition;
				sendEvent(tracker, 'media-play');
				startCheckpoints(tracker);
			});
		});
		widget.bind(SC.Widget.Events.PAUSE, function () {
			if (!tracker.playing) return;
			tracker.playing = false;
			widget.getPosition(function (p) {
				var pos = (p || 0) / 1000;
				tracker.watched.add(tracker._lastTimeUpdate, pos);
				tracker.lastPosition = pos;
				stopCheckpoints(tracker);
				sendEvent(tracker, 'media-pause');
			});
		});
		widget.bind(SC.Widget.Events.FINISH, function () {
			tracker.playing = false;
			tracker.watched.add(tracker._lastTimeUpdate, tracker.duration);
			tracker.lastPosition = tracker.duration;
			stopCheckpoints(tracker);
			sendEvent(tracker, 'media-ended');
		});
		widget.bind(SC.Widget.Events.SEEK, function (e) {
			var from = tracker.lastPosition;
			tracker.lastPosition = (e.currentPosition || 0) / 1000;
			tracker._lastTimeUpdate = tracker.lastPosition;
			sendEvent(tracker, 'media-seeked', {
				from: Math.round(from), to: Math.round(tracker.lastPosition)
			});
		});
		widget.bind(SC.Widget.Events.PLAY_PROGRESS, function (e) {
			var pos = (e.currentPosition || 0) / 1000;
			if (tracker.playing && pos > tracker._lastTimeUpdate) {
				tracker.watched.add(tracker._lastTimeUpdate, pos);
			}
			tracker._lastTimeUpdate = pos;
			tracker.lastPosition = pos;
		});
	});
}

// ── Wistia ──

function trackWistia(container) {
	var id = genId(container);
	if (state.tracked[id]) return;

	var handleId = container.getAttribute('data-wistia-id')
		|| (container.className.match(/wistia_async_(\w+)/) || [])[1]
		|| id;

	root._wq = root._wq || [];
	root._wq.push({
		id: handleId,
		onReady: function (video) {
			if (state.tracked[id]) return;
			var tracker = createTracker(id, 'wistia', container, video.duration() || 0);
			state.tracked[id] = tracker;
			tracker._player = video;

			video.bind('play', function () {
				tracker.playing = true;
				tracker.lastPosition = video.time();
				tracker._lastTimeUpdate = tracker.lastPosition;
				tracker.duration = video.duration() || tracker.duration;
				sendEvent(tracker, 'media-play');
				startCheckpoints(tracker);
			});
			video.bind('pause', function () {
				if (!tracker.playing) return;
				tracker.playing = false;
				var pos = video.time();
				tracker.watched.add(tracker._lastTimeUpdate, pos);
				tracker.lastPosition = pos;
				stopCheckpoints(tracker);
				sendEvent(tracker, 'media-pause');
			});
			video.bind('end', function () {
				tracker.playing = false;
				tracker.watched.add(tracker._lastTimeUpdate, tracker.duration);
				tracker.lastPosition = tracker.duration;
				stopCheckpoints(tracker);
				sendEvent(tracker, 'media-ended');
			});
			video.bind('seek', function (currentTime, lastTime) {
				tracker.lastPosition = currentTime;
				tracker._lastTimeUpdate = currentTime;
				sendEvent(tracker, 'media-seeked', {
					from: Math.round(lastTime), to: Math.round(currentTime)
				});
			});
			video.bind('secondchange', function (s) {
				var pos = s;
				if (tracker.playing && pos > tracker._lastTimeUpdate) {
					tracker.watched.add(tracker._lastTimeUpdate, pos);
				}
				tracker._lastTimeUpdate = pos;
				tracker.lastPosition = pos;
			});
		}
	});

	// Load Wistia E-v1 if not present
	if (!root.Wistia) {
		var script = document.createElement('script');
		script.src = 'https://fast.wistia.com/assets/external/E-v1.js';
		script.async = true;
		document.head.appendChild(script);
	}
}

// ── JW Player ──

function trackJWPlayer(container) {
	var id = genId(container);
	if (state.tracked[id]) return;

	// JW Player instance might already exist
	var playerId = container.id || id;
	function _bind() {
		if (!root.jwplayer || typeof root.jwplayer !== 'function') return false;
		var player;
		try { player = jwplayer(playerId); } catch (e) { return false; }
		if (!player || !player.getState) return false;

		var tracker = createTracker(id, 'jwplayer', container, player.getDuration() || 0);
		state.tracked[id] = tracker;
		tracker._player = player;

		player.on('play', function () {
			tracker.playing = true;
			tracker.lastPosition = player.getPosition();
			tracker._lastTimeUpdate = tracker.lastPosition;
			tracker.duration = player.getDuration() || tracker.duration;
			sendEvent(tracker, 'media-play');
			startCheckpoints(tracker);
		});
		player.on('pause', function () {
			if (!tracker.playing) return;
			tracker.playing = false;
			var pos = player.getPosition();
			tracker.watched.add(tracker._lastTimeUpdate, pos);
			tracker.lastPosition = pos;
			stopCheckpoints(tracker);
			sendEvent(tracker, 'media-pause');
		});
		player.on('complete', function () {
			tracker.playing = false;
			tracker.watched.add(tracker._lastTimeUpdate, tracker.duration);
			tracker.lastPosition = tracker.duration;
			stopCheckpoints(tracker);
			sendEvent(tracker, 'media-ended');
		});
		player.on('seek', function (e) {
			tracker.lastPosition = e.offset;
			tracker._lastTimeUpdate = e.offset;
			sendEvent(tracker, 'media-seeked', {
				from: Math.round(e.position), to: Math.round(e.offset)
			});
		});
		player.on('time', function (e) {
			var pos = e.position;
			if (tracker.playing && pos > tracker._lastTimeUpdate) {
				tracker.watched.add(tracker._lastTimeUpdate, pos);
			}
			tracker._lastTimeUpdate = pos;
			tracker.lastPosition = pos;
			tracker.duration = e.duration || tracker.duration;
		});
		return true;
	}

	// Try immediately, retry after a delay if JW hasn't initialized yet
	if (!_bind()) {
		setTimeout(function () { _bind(); }, 2000);
	}
}

// ── Dailymotion ──

function trackDailymotion(iframe) {
	var id = genId(iframe);
	if (state.tracked[id]) return;

	function _loadAndBind() {
		if (!root.DM || !root.DM.player) {
			var script = document.createElement('script');
			script.src = 'https://api.dmcdn.net/all.js';
			script.onload = function () { _createPlayer(); };
			document.head.appendChild(script);
		} else {
			_createPlayer();
		}
	}

	function _createPlayer() {
		if (state.tracked[id]) return;
		var tracker = createTracker(id, 'dailymotion', iframe, 0);
		state.tracked[id] = tracker;

		var player = DM.player(iframe, { events: {
			playing: function () {
				tracker.playing = true;
				tracker.lastPosition = player.currentTime || 0;
				tracker._lastTimeUpdate = tracker.lastPosition;
				tracker.duration = player.duration || tracker.duration;
				sendEvent(tracker, 'media-play');
				startCheckpoints(tracker);
			},
			pause: function () {
				if (!tracker.playing) return;
				tracker.playing = false;
				var pos = player.currentTime || 0;
				tracker.watched.add(tracker._lastTimeUpdate, pos);
				tracker.lastPosition = pos;
				stopCheckpoints(tracker);
				sendEvent(tracker, 'media-pause');
			},
			end: function () {
				tracker.playing = false;
				tracker.watched.add(tracker._lastTimeUpdate, tracker.duration);
				tracker.lastPosition = tracker.duration;
				stopCheckpoints(tracker);
				sendEvent(tracker, 'media-ended');
			},
			seeking: function () {
				var from = tracker.lastPosition;
				tracker.lastPosition = player.currentTime || 0;
				tracker._lastTimeUpdate = tracker.lastPosition;
				sendEvent(tracker, 'media-seeked', {
					from: Math.round(from), to: Math.round(tracker.lastPosition)
				});
			},
			timeupdate: function () {
				var pos = player.currentTime || 0;
				if (tracker.playing && pos > tracker._lastTimeUpdate) {
					tracker.watched.add(tracker._lastTimeUpdate, pos);
				}
				tracker._lastTimeUpdate = pos;
				tracker.lastPosition = pos;
				tracker.duration = player.duration || tracker.duration;
			}
		}});
		tracker._player = player;
	}

	_loadAndBind();
}

// ── Spotify Embed (limited — position only via playbackUpdate) ──

function trackSpotify(iframe) {
	var id = genId(iframe);
	if (state.tracked[id]) return;

	var tracker = createTracker(id, 'spotify', iframe, 0);
	state.tracked[id] = tracker;

	// Spotify Embed API uses window.onSpotifyIframeApiReady + postMessage
	window.addEventListener('message', function (e) {
		if (!e.data || e.source !== iframe.contentWindow) return;
		var data;
		try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; }
		catch (err) { return; }
		if (!data.type) return;

		if (data.type === 'playback_update') {
			var pos = (data.payload && data.payload.position) || 0;
			pos = pos / 1000; // ms to seconds
			var dur = (data.payload && data.payload.duration) || 0;
			dur = dur / 1000;
			var isPaused = data.payload && data.payload.isPaused;

			tracker.duration = dur || tracker.duration;

			if (!isPaused && !tracker.playing) {
				tracker.playing = true;
				tracker.lastPosition = pos;
				tracker._lastTimeUpdate = pos;
				sendEvent(tracker, 'media-play');
				startCheckpoints(tracker);
			} else if (isPaused && tracker.playing) {
				tracker.playing = false;
				tracker.watched.add(tracker._lastTimeUpdate, pos);
				tracker.lastPosition = pos;
				stopCheckpoints(tracker);
				sendEvent(tracker, 'media-pause');
			} else if (!isPaused && tracker.playing && pos > tracker._lastTimeUpdate) {
				tracker.watched.add(tracker._lastTimeUpdate, pos);
				tracker._lastTimeUpdate = pos;
				tracker.lastPosition = pos;
			}
		}
	});
}

// ── Twitch Player ──

function trackTwitch(iframe) {
	var id = genId(iframe);
	if (state.tracked[id]) return;

	function _loadAndBind() {
		if (!root.Twitch || !root.Twitch.Player) {
			var script = document.createElement('script');
			script.src = 'https://player.twitch.tv/js/embed/v1.js';
			script.onload = function () { _createPlayer(); };
			document.head.appendChild(script);
		} else {
			_createPlayer();
		}
	}

	function _createPlayer() {
		if (state.tracked[id]) return;
		if (!iframe.id) iframe.id = 'twitch-' + id;
		var tracker = createTracker(id, 'twitch', iframe, 0);
		state.tracked[id] = tracker;

		var player = new Twitch.Player(iframe.id, {});
		tracker._player = player;

		player.addEventListener(Twitch.Player.PLAY, function () {
			tracker.playing = true;
			tracker.lastPosition = player.getCurrentTime() || 0;
			tracker._lastTimeUpdate = tracker.lastPosition;
			tracker.duration = player.getDuration() || tracker.duration;
			sendEvent(tracker, 'media-play');
			startCheckpoints(tracker);
			tracker._pollTimer = setInterval(function () {
				var p = player.getCurrentTime() || 0;
				if (tracker.playing && p > tracker._lastTimeUpdate) {
					tracker.watched.add(tracker._lastTimeUpdate, p);
				}
				tracker._lastTimeUpdate = p;
				tracker.lastPosition = p;
			}, 1000);
		});
		player.addEventListener(Twitch.Player.PAUSE, function () {
			if (!tracker.playing) return;
			tracker.playing = false;
			var pos = player.getCurrentTime() || 0;
			tracker.watched.add(tracker._lastTimeUpdate, pos);
			tracker.lastPosition = pos;
			stopCheckpoints(tracker);
			clearInterval(tracker._pollTimer);
			sendEvent(tracker, 'media-pause');
		});
		player.addEventListener(Twitch.Player.ENDED, function () {
			tracker.playing = false;
			var pos = player.getCurrentTime() || tracker.duration;
			tracker.watched.add(tracker._lastTimeUpdate, pos);
			tracker.lastPosition = pos;
			stopCheckpoints(tracker);
			clearInterval(tracker._pollTimer);
			sendEvent(tracker, 'media-ended');
		});
	}

	_loadAndBind();
}

// ── Muse.ai (postMessage API) ──

function trackMuseAi(iframe) {
	var id = genId(iframe);
	if (state.tracked[id]) return;

	var tracker = createTracker(id, 'museai', iframe, 0);
	state.tracked[id] = tracker;

	window.addEventListener('message', function (e) {
		if (!e.data || e.source !== iframe.contentWindow) return;
		var data;
		try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; }
		catch (err) { return; }

		if (data.event === 'play') {
			tracker.playing = true;
			tracker.lastPosition = data.currentTime || 0;
			tracker._lastTimeUpdate = tracker.lastPosition;
			tracker.duration = data.duration || tracker.duration;
			sendEvent(tracker, 'media-play');
			startCheckpoints(tracker);
		} else if (data.event === 'pause') {
			if (!tracker.playing) return;
			tracker.playing = false;
			var pos = data.currentTime || 0;
			tracker.watched.add(tracker._lastTimeUpdate, pos);
			tracker.lastPosition = pos;
			stopCheckpoints(tracker);
			sendEvent(tracker, 'media-pause');
		} else if (data.event === 'ended') {
			tracker.playing = false;
			tracker.watched.add(tracker._lastTimeUpdate, tracker.duration);
			tracker.lastPosition = tracker.duration;
			stopCheckpoints(tracker);
			sendEvent(tracker, 'media-ended');
		} else if (data.event === 'timeupdate') {
			var pos = data.currentTime || 0;
			tracker.duration = data.duration || tracker.duration;
			if (tracker.playing && pos > tracker._lastTimeUpdate) {
				tracker.watched.add(tracker._lastTimeUpdate, pos);
			}
			tracker._lastTimeUpdate = pos;
			tracker.lastPosition = pos;
		}
	});

	// Request the iframe to emit events
	try { iframe.contentWindow.postMessage({ method: 'addEventListener', value: 'play' }, '*'); } catch(e){}
	try { iframe.contentWindow.postMessage({ method: 'addEventListener', value: 'pause' }, '*'); } catch(e){}
	try { iframe.contentWindow.postMessage({ method: 'addEventListener', value: 'ended' }, '*'); } catch(e){}
	try { iframe.contentWindow.postMessage({ method: 'addEventListener', value: 'timeupdate' }, '*'); } catch(e){}
}
