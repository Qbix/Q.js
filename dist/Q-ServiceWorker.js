/************************************************
 * Unified Service Worker for Qbix Platform App
 ************************************************/
var Q = {
	info: {
		baseUrl: "https://local.qbix.com/ITR",
		serviceWorkerUrl: "https://local.qbix.com/ITR/Q-ServiceWorker"
	},
	Cache: {
		clearAll: function () {
			caches.keys().then(function(names) {
				for (var name of names) {
					caches.delete(name);
				}
			});
		}
	}
};

(function () {
	// Local cookie store
	var cookies = {"Q_ut":"1743924575","Q_dpr":"2","Q_sessionId":"sessionId_authenticated_QeRGEJDIwbwBbHQzbX1eqRsza3h4u9BixzzLg0jWk8qCUUzc","Q_nonce":"sessionId_authenticated_510aabe7ed178b4c7655b719319e3b59cec5aadbfa1d96f972a4842cee8d5abb","__stripe_mid":"8e2e52db-db0d-4de4-840f-518b32ee3582d3236b","_ga_ENLV296726":"GS2.1.s1753815693$o71$g0$t1753815693$j60$l0$h0","_ga":"GA1.1.284233765.1743009237"};

	self.addEventListener('clearCache', function (event) {
		Q.Cache.clearAll();
	});

	self.addEventListener('fetch', function (event) {
		var url = new URL(event.request.url);
		var ext = url.pathname.split('.').pop().toLowerCase();

		// Skip non-same-origin or non-relevant file types
		if (url.origin !== self.location.origin || ['js', 'css'].indexOf(ext) < 0) {
			return;
		}

		if (url.toString() === Q.info.serviceWorkerUrl) {
			return event.respondWith(new Response(
				"// Can't peek at serviceWorker JS, please use Q.ServiceWorker.start()",
				{ headers: {'Content-Type': 'text/javascript'} }
			));
		}

		// Clone request and attach Cookie-JS header
		const original = event.request;
		const cookieHeader = Object.entries(cookies)
			.map(([k, v]) => k + "=" + v).join("; ");

		const newHeaders = new Headers(original.headers);
		newHeaders.set("Cookie-JS", cookieHeader);

		const init = {
			method: original.method,
			headers: newHeaders,
			mode: original.mode,
			credentials: original.credentials,
			cache: original.cache,
			redirect: original.redirect,
			referrer: original.referrer,
			referrerPolicy: original.referrerPolicy,
			integrity: original.integrity,
			keepalive: original.keepalive,
			signal: original.signal
		};

		if (original.method !== 'GET' && original.method !== 'HEAD') {
			init.body = original.clone().body;
		}

		const newRequest = new Request(original.url, init);

		event.respondWith(
			fetch(newRequest).then(response => {
				const clone = response.clone();
				const setCookieHeader = clone.headers.get("Set-Cookie-JS");
				if (setCookieHeader) {
					setCookieHeader.split(';').forEach(kv => {
						const [k, v] = kv.trim().split('=');
						if (k && v) cookies[k] = v;
					});
				}
				return response;
			})
		);
	});

	self.addEventListener("install", (event) => {
		self.skipWaiting();
	});
	self.addEventListener("activate", (event) => {
		event.waitUntil(clients.claim());
	});

	self.addEventListener('message', function (event) {
		var data = event.data || {};
		if (data.type === 'Q.Cache.put') {
			caches.open('Q').then(function (cache) {
				data.items.forEach(function (item) {
					const options = {};
					if (item.headers) {
						options.headers = new Headers(item.headers);
					}
					cache.put(item.url, new Response(item.content, options));
					console.log("cache.put " + item.url);
				});
			});
		}
		if (data.type === 'Set-Cookie-JS') {
			if (data.key && data.value) {
				cookies[data.key] = data.value;
			}
		}
	});
})();
/************************************************
 * Qbix Platform plugins have added their own code
 * to this service worker through the config named
 * Q/javascript/serviceWorker/modules
 ************************************************/


/**** Qbix: produced by Q_ServiceWorker::inlineCode()
 * SOURCE: /usr/local/projects/qbix/Q/platform/plugins/Q/scripts/Q/serviceWorker.js
 * TIME: 1729988853
 */
/**
 * Functions related to IndexedDB, when it is available
 * @class Q.IndexedDB
 * @constructor
 * @param {String} uriString
 */
Q.IndexedDB = {
	open: function (dbName, storeName, params, callback) {
		var keyPath = (typeof params === 'string' ? params : params.keyPath);
		var version = undefined;
		var open = indexedDB.open(dbName, version);
		var _triedAddingObjectStore = false;
		open.onupgradeneeded = function() {
			var db = this.result;
			if (!db.objectStoreNames.contains(storeName)
			&& !_triedAddingObjectStore) {
				_triedAddingObjectStore = true;
				var store = db.createObjectStore(storeName, {keyPath: keyPath});
				var idxs = params.indexes;
				if (idxs) {
					for (var i=0, l=idxs.length; i<l; ++i) {
						store.createIndex(idxs[i][0], idxs[i][1], idxs[i][2]);
					}
				}
			}
		};
		open.onerror = function (error) {
			callback && callback.call(Q.IndexedDB, error);
		};
		open.onsuccess = function() {
			var db = this.result;
			version = db.version;
			if (!db.objectStoreNames.contains(storeName)) {
				// need to upgrade version and add this store
				++version;
				db.close();
				var o = indexedDB.open(dbName, version);
				Q.take(open, ['onupgradeneeded', 'onerror', 'onsuccess'], o);
				return;
			}
			// Start a new transaction
			var tx = db.transaction(storeName, "readwrite");
			var store = tx.objectStore(storeName);
			callback && callback.call(Q.IndexedDB, null, store);
			// Close the db when the transaction is done
			tx.oncomplete = function() {
				db.close();
			};
		};
	},
	put: function (store, value, onSuccess, onError) {
		if (!onError) {
			onError = function () {
				throw new Q.Error("Q.IndexedDB.put error:" + request.errorCode);
			}
		}
		var request = store.put(value);
		request.onsuccess = onSuccess;
		request.onError = onError;
	},
	get: function (store, key, onSuccess, onError) {
		if (!onError) {
			onError = function () {
				throw new Q.Error("Q.IndexedDB.get error:" + request.errorCode);
			}
		}
		var request = store.get(key);
		request.onsuccess = function (event) {
			Q.handle(onSuccess, Q.IndexedDB, [event.target.result, event]);
		};
		request.onError = onError;
	}
};


/************************************************
 * Below, Qbix Platform plugins have a chance to 
 * add their own code to this service worker by
 * adding hooks after  "Q/serviceWorker/response"
 ************************************************/

