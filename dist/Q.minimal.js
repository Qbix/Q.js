/**
 * You'll find all your mininmal Q related functionality right here.
 *
 * @module Q
 * @main Q
 */
"use strict";

/* jshint -W014 */
export default (function _Q_setup(undefined, dontSetGlobals) {

var root = this;
var $ = Q.jQuery = root.jQuery || root.$;

// private properties
var _isReady = false;
var _isOnline = null;
var _documentIsUnloading = null;

/**
 * @class Q
 * @constructor
 */
function Q () {
	// explore the docs at http://qbix.com/platform/client
}

/**
 * @module Q
 */

// public properties:
Q.plugins = {};

/**
 * Store and customize your text strings under Q.text
 * @property {Object} text
 */
Q.text = {
	Q: {
		"request": {
			"error": "Error {{status}} during request",
			"canceled": 'Request canceled',
			"500": "Internal server error",
			"404": "Not found: {{url}}",
			"0": "Request interrupted"
		},
		"words": {
			"tap": "tap",
			"click": "click",
			"yes": "yes",
			"no": "no",
			"Tap": "Tap",
			"Click": "Click",
			"Yes": "Yes",
			"No": "No",
			"OK": "OK",
			"Alert": "Alert",
			"Confirm": "Confirm",
			"Prompt": "Prompt"
		},
		"browser": {
			"insecureContext": "You need to browse in a secure context for this to work"
		}
	}
}; // put all your text strings here e.g. Q.text.Users.foo

/**
 * By default this is set to the root Promise object, which may be undefined
 * in browsers such as Internet Explorer.
 * You can load a Promises library and set Q.Promise to the Promise constructor
 * before including Q.js, to ensure Promises are used by Q.getter and other functions.
 * @property {Function} Promise
 */
Q.Promise = root.Promise;

/*
 * Extend some built-in prototypes
 */

/**
 * @class Q.Error
 * @description Throw this when throwing errors in Javascript
 */
Q.Error = Error;

/**
 * @class JSON
 * @description Q extended methods for JSON
 */

/**
 * Returns whether the JSON is valid or not
 * @method isValid
 * @static
 * @param {String} str 
 */
JSON.isValid = function (str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
};

/**
 * @class Array
 * @description Q extended methods for Arrays
 */
Object.defineProperty(Array.prototype, "toHex", {
	enumerable: false,
	value: function () {
		return this.map(function (x) { 
			return x.toString(16).padStart(2, '0');
		}).join('');
	}
});

/**
 * @class String
 * @description Q extended methods for Strings
 */

var Sp = String.prototype;

/**
 * Returns a copy of the string with Every Word Capitalized
 * @method toCapitalized
 * @return {String}
 */
Sp.toCapitalized = function _String_prototype_toCapitalized() {
	return this.replace(/^([a-z])|\s+([a-z])/g, function (found) {
		return found.toUpperCase();
	});
};

/**
 * Determins whether the string's contents are a URL
 * @method isUrl
 * @return {boolean}
 */
Sp.isUrl = function _String_prototype_isUrl () {
    try {
        new URL(this);
        return true;
    } catch (_) {
        return false;  
    }
};

/**
 * Determins whether the string's contents are an IP address
 * @method isUrl
 * @return {boolean}
 */
Sp.isIPAddress = function _String_prototype_isIPAddress () {
	return !!this.match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);
};

/**
 * Returns a copy of the string with special HTML characters escaped
 * @method encodeHTML
 * @param {Array} [convert] Array of characters to convert. Can include
 *   '&', '<', '>', '"', "'", "\n"
 * @return {String}
 */
Sp.encodeHTML = function _String_prototype_encodeHTML(convert) {
	var conversions = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;',
		"\n": '<br>'
	};
	if (convert) {
		conversions = Q.take(conversions, convert);
	}
	return this.replaceAll(conversions);
};

/**
 * Reverses what encodeHTML does
 * @method decodeHTML
 * @return {String}
 */
Sp.decodeHTML = function _String_prototype_decodeHTML() {
	var e = document.createElement('textarea');
	e.innerHTML = this;
	// handle case of empty input
	return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
};

/**
 * Interpolates some fields into the string wherever "{{fieldName}}" appears
 * or {{index}} appears.
 * @method interpolate
 * @param {Object|Array} fields Can be an object with field names and values,
 *   or an array corresponding to {{0}}, {{1}}, etc. If the string is missing
 *   {{0}} then {{1}} is mapped to the first element of the array.
 * @return {String}
 */
Sp.interpolate = function _String_prototype_interpolate(fields) {
	if (Q.isArrayLike(fields)) {
		var result = this;
		var b = (this.indexOf('{{0}}') < 0) ? 1 : 0;
		for (var i=0, l=fields.length; i<l; ++i) {
			result = result.replace('{{'+(i+b)+'}}', fields[i]);
		}
		return result;
	}
	return this.replace(/\{\{([^{}]*)\}\}/g, function (a, b) {
		var r = Q.getObject(b, fields);

		if (Q.typeOf(r) === 'function') {
			var context = Q.getObject(b.split('.').slice(0, -1), fields);
			r = r.apply(context);
		}

		return (typeof r === 'string' || typeof r === 'number') ? r : a;
	});
};

/**
 * Similar to String.prototype.replace, but replaces globally
 * @method replaceAll
 * @return {String}
 */
Sp.replaceAll = function _String_prototype_replaceAll(pairs) {
	var result = this;
	for (var k in pairs) {
		result = result.split(k).join(pairs[k]);
	}
	return result;
};

/**
 * Get or set querystring fields from a string, usually from location.search or location.hash
 * @method queryField
 * @param {String|Array|Object} name The name of the field. If it's an array, returns an object of {name: value} pairs. If it's an object, then they are added onto the querystring and the result is returned. If it's a string, it's the name of the field to get. And if it's an empty string, then we get the array of field names with no value, e.g. ?123&456&a=b returns [123,456]
 * @param {String} [value] Optional, provide a value to set in the querystring, or null to delete any fields that match name as a RegExp
 * @return {String|Object} the value of the field in the string, or if value was not undefined, the resulting querystring.
 */
Sp.queryField = function Q_queryField(name, value) {
	var what = this;
	var prefixes = ['#!', '#', '?', '!'];
	var count = prefixes.length;
	var prefix = '';
	var i, k, l, p, keys, parsed, ret, result;
	for (i=0; i<count; ++i) {
		l = prefixes[i].length;
		p = this.substring(0, l);
		if (p == prefixes[i]) {
			prefix = p;
			what = this.substring(l);
			break;
		}
	}
	if (!name) {
		ret = [];
		parsed = Q.parseQueryString(what, keys);
		for (k in parsed) {
			if (parsed[k] == null || parsed[k] === '') {
				ret.push(k);
			}
		}
		return ret;
	} if (Q.isArrayLike(name)) {
		ret = {}, keys = [];
		parsed = Q.parseQueryString(what, keys);
		for (i=0, l=name.length; i<l; ++i) {
			if (name[i] in parsed) {
				ret[name[i]] = parsed[name[i]];
			}
		}
		return ret;
	} else if (Q.isPlainObject(name)) {
		result = what;
		Q.each(name, function (key, value) {
			result = result.queryField(key, value);
		});
		return result;
	} else if (value === undefined) {
		return Q.parseQueryString(what) [ name ];
	} else if (value === null) {
		keys = [];
		parsed = Q.parseQueryString(what, keys);
		var reg = new RegExp(name);
		for (k in parsed) {
			if (reg.test(k)) {
				delete parsed[k];
			}
		}
		return prefix + Q.queryString(parsed, keys);
	} else {
		keys = [];
		parsed = Q.parseQueryString(what, keys);
		if (!(name in parsed)) {
			keys.push(name);
		}
		parsed[name] = value;
		return prefix + Q.queryString(parsed, keys);
	}
};

/**
 * Obtain some unique hash from a string, analogous to Q_Utils::hashCode
 * @method hashCode
 * @return {number}
 */
Sp.hashCode = function() {
	var hash = 5381;
	if (!this.length) return hash;
	for (var i = 0; i < this.length; i++) {
		var c = this.charCodeAt(i);
		hash = hash % 16777216;
		hash = ((hash<<5)-hash)*c+c;
		hash = hash & 0xffffffff; // Convert to 32bit integer
	}
	return Math.abs(hash);
};

/**
 * Analogous to PHP's parse_url function
 * @method parseUrl
 * @param {String} component Optional name of component to return
 * @return {Object}
 */
Sp.parseUrl = function _String_prototype_parseUrl (component) {
	// http://kevin.vanzonneveld.net
	// modified by N.I for 'php' parse mode
	var key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'],
		parser = /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;
	var m = parser.exec(this), uri = {}, i = 14;
	while (i--) {
		if (m[i]) uri[key[i]] = m[i];
	}
	if (component) {
		return uri[component.replace('PHP_URL_', '').toLowerCase()];
	}
	delete uri.source;
	return uri;
};

/**
 * @method sameDomain
 * @param {String} url2 The url to compare against
 * @param {Object} options can include the following:
 * @param {boolean} [options.compareScheme] boolean for whether the url scheme should be compared also
 * @return {boolean}
 * @private
 */
Sp.sameDomain = function _String_prototype_sameDomain (url2, options) {
	var parsed1 = this.parseUrl(),
		parsed2 = url2.parseUrl();
	var same = (parsed1.host === parsed2.host)
		&& (parsed1.user === parsed2.user)
		&& (parsed1.pass === parsed2.pass)
		&& (parsed1.port === parsed2.port);
	return options && options.compareScheme
		? same && (parsed1.scheme === parsed2.scheme)
		: same;
};

if (root.Element) { // only IE7 and lower, which we don't support, wouldn't have this

if (!document.getElementsByClassName) {
	document.getElementsByClassName = function(className) {
		return Array.prototype.slice.call(this.querySelectorAll("." + className));
	};
}

var Elp = Element.prototype;

/**
 * @class Element
 * @description Q extended methods for DOM Elements
 */

if (!Elp.Q)
/**
* Call this on an element to access tools attached to it.
* The tools are like "view models".
* this method is overridden by the tool constructor on specific elements
* @method Q
* @param {String} toolName
* @return {Q.Tool|null}
*/
Elp.Q = function (toolName) {
	// this method is overridden by the tool constructor on specific elements
	return undefined;
};

/**
 * Returns a snapshot of the computed style of an element.
 * @method computedStyle
 * @param {String} [name] If provided, the value of a property is returned instead of the whole style object.
 * @param {String} [pseudoElement] Optionally indicate the pseudo-element ("::before", "::placeholder" etc.) to get the style of
 * @return {Object|String}
 */
Elp.computedStyle = function(name, pseudoElement) {
	var computedStyle = root.getComputedStyle
		? root.getComputedStyle(this, pseudoElement)
		: this.currentStyle;
	var result = {};
	for (var k in computedStyle) {
		var k2 = root.getComputedStyle ? k : k.replace(/-(\w)/gi, function (word, letter) {
			return letter.toUpperCase();
		});
		result[k2] = computedStyle[k];
	}
	return name ? result[name.replace(/-(\w)/gi, function (word, letter) {
		return letter.toUpperCase();
	})] : result;
};

/**
 * Returns the first element in the chain of parent elements which supports scrolling
 * @method scrollingParent
 * @param {Boolean} [skipIfNotOverflowed=false] If element is not overflowed, continue search
 * @param {String} [direction="all"] Can also be "vertical" or "horizontal"
 * @param {Boolean} [includeSelf=false] Whether the element itself can be returned if it matches
 * @return {Element|null} Returns the first parent encountered that matches, otherwise null
 */
Elp.scrollingParent = function(skipIfNotOverflowed, direction, includeSelf) {
	var p = this;
	while (includeSelf ? 1 : (p = p.parentElement)) {
		includeSelf = false;
		if (typeof p.computedStyle !== 'function') {
			continue;
		}
		var pcs = p.computedStyle();
		var overflow;
		if (direction === 'vertical') {
			overflow = pcs.overflowY || p.style.overflowY;
		} else if (direction === 'horizontal') {
			overflow = pcs.overflowX || p.style.overflowX;
		} else {
			overflow = pcs.overflow || p.style.overflow
				|| pcs.overflowY || p.style.overflowY
				|| pcs.overflowX || p.style.overflowX;
		}
		if (overflow && overflow !== 'hidden' && (
			(p === document.documentElement || overflow !== 'visible')
		)) {
			if (!skipIfNotOverflowed || p.clientHeight < p.scrollHeight) {
				return p;
			}
		}
	}
	return p || null;
};

/**
 * Check whether this element has a given CSS class
 * @method hasClass
 * @param {String} className
 * @return {boolean}
 */
Elp.hasClass = function (className) {
	if (this.classList) {
		return this.classList.contains(className);
	} else {
		return new RegExp('(^| )' + className + '( |$)', 'gi').test(this.className);
	}
};

/**
 * Remove a CSS class from the element
 * @method removeClass
 * @chainable
 * @param {String} className
 * @return {Element} returns this, for chaining
 */
Elp.removeClass = function (className) {
	if (this.classList) {
		this.classList.remove(className);
	} else {
		this.className = this.className.replace(new RegExp('(^| )' 
			+ className.split(' ').join('|') + '( |$)', 'gi'), ' ');
	}
	return this;
};

/**
 * Add a CSS class to an element.
 * Can be string of CSS classes separated by spaces.
 * @method addClass
 * @chainable
 * @param {String} className
 * @return {Element} returns this, for chaining
 */
Elp.addClass = function (className) {
	if (Q.typeOf(className) !== 'string') {
		className = '';
	}

	var classNames = className.split(' ');
	var l = classNames.length;
	for (var i=0; i<l; ++i) {
		var c = classNames[i];
		if (!c) continue;
		if (this.classList) {
			this.classList.add(c);
		} else {
			this.removeClass(c);
			this.className += ' ' + c;
		}
	}
	return this;
};

/**
 * Adds or removes an element according to whether a condition is truthy
 * @method setClassIf
 * @chainable
 * @param {Boolean} condition
 * @param {String} [classNameIfTrue]
 * @param {String} [classNameIfFalse]
 * @return {Element} returns this, for chaining
 */
Elp.setClassIf = function (condition, classNameIfTrue, classNameIfFalse) {
	if (condition) {
		classNameIfTrue && this.addClass(classNameIfTrue);
		classNameIfFalse && this.removeClass(classNameIfFalse);
	} else {
		classNameIfFalse && this.addClass(classNameIfFalse);
		classNameIfTrue && this.removeClass(classNameIfTrue);
	}
	return this;
};

/**
 * Returns whether the element's content has overflowed the element's bounds.
 * Does not work in IE8 and below for elements with {text-overflow: ellipsis}.
 * @method isOverflowed
 * @return {boolean}
 */
Elp.isOverflowed = function() {
	return (this.offsetWidth < this.scrollWidth)
	    || (this.offsetHeight < this.scrollHeight);
};

/**
 * Returns whether the element is visible
 * @method isVisible
 * @return {boolean}
 */
Elp.isVisible = function () {
	return this.offsetWidth > 0 || this.offsetHeight > 0;
};

/**
 * Gets activated and future tools inside some html element.
 * @method forEachTool
 * @param {String} [name=""] Filter by name of the child tools, such as "Q/inplace"
 * @param {Function} callback The callback to execute at the right time
 * @param {String} [key] Optional, to be used for the onActivate handler that gets added
 */
Elp.forEachTool = function _Q_Tool_prototype_forEachTool(name, callback, key) {
	var element = this;
	if (typeof name !== 'string') {
		callback = name;
		name = "";
	}
	// check already activated tools
	Q.each(element.getElementsByClassName("Q_tool"), function () {
		var tool = Q.Tool.from(this, name);
		tool && Q.handle(callback, tool);
	});
	Q.Tool.onActivate(name).set(function () {
		try {
			if (element.contains(this.element)) {
				Q.handle(callback, this);
			}
		} catch (e) {
			console.warn(e);
		}
	}, key);
};

/**
 * Return element if it's in the DOM, otherwise return
 * the element of the DOM with the same ID as this element
 * @method elementById
 * @param {Element} element
 * @return {Element|null}
 */
Q.elementById = function (element) {
	if (!element) {
		return null;
	}
	return element.isConnected
		? element 
		: (element.id ? document.getElementById(element.id) : null) || null;
};

if (!Elp.getElementsByClassName) {
	Elp.getElementsByClassName = document.getElementsByClassName;
}

}

// public methods:

/**
 * @class Q
 */

/**
 * Returns the number of milliseconds since the
 * first call to this function (i.e. since script started).
 * @static
 * @method milliseconds
 * @param {boolean} sinceEpoch
 *  Defaults to false. If true, just returns the number of milliseconds in the UNIX timestamp.
 * @return {float}
 *  The number of milliseconds, with fractional part
 */
Q.milliseconds = function (sinceEpoch) {
	var result = Date.now();
	if (sinceEpoch) return result;
	return result - Q.milliseconds.start;
};
Q.milliseconds.start = Date.now();

/**
 * Creates a copied object which you can extend, using existing object as prototype
 * @static
 * @method objectWithPrototype
 * @param {Derived} original
 * @return {Derived}
*/
Q.objectWithPrototype = function _Q_objectWithPrototype(original) {
	if (!original) {
		return {};
	}
	function Copied() {}
	Copied.prototype = original;
	return new Copied();
};

/**
 * Returns the type of a value
 * @static
 * @method typeOf
 * @param {Mixed} value
 * @return {String}
 */
Q.typeOf = function _Q_typeOf(value) {
	var s = typeof value, x, l;
	if (s === 'function' && !(value instanceof Function)) {
		// older webkit workaround https://bugs.webkit.org/show_bug.cgi?id=33716
		s = 'object';
	}
	if (s === 'object') {
		if (value === null) {
			return 'null';
		}
		var t = Object.prototype.toString.apply(value);
		if (value instanceof root.Element) {
			return 'Element';
		} else if (value instanceof Array
		|| (value.constructor && value.constructor.name === 'Array')
		|| t === '[object Array]') {
			s = 'array';
		} else if (t === '[object Window]') {
			s = 'window';
		} else if (typeof value.typename != 'undefined' ) {
			return value.typename;
		} else if (value[Symbol.iterator] === 'function'
		|| (typeof (l=value.length) == 'number' && (l%1==0)
		&& (l > 0 && ((l-1) in value)))) {
			return 'array';
		} else if (typeof value.constructor != 'undefined'
		&& typeof value.constructor.name != 'undefined') {
			if (value.constructor.name == 'Object') {
				return 'object';
			}
			return value.constructor.name;
		} else if ((x = Object.prototype.toString.apply(value)).substring(0, 8) === "[object ") {
			return x.substring(8, x.length-1).toLowerCase();
		} else {
			return 'object';
		}
	}
	return s;
};

/**
 * Iterates over elements in a container, and calls the callback.
 * Use this if you want to avoid problems with loops and closures.
 * @static
 * @method each
 * @param {Array|Object|String|Number} container, which can be an array, object or string.
 *  You can also pass up to three numbers here: from, to and optional step
 * @param {Function|String} callback
 *  A function which will receive two parameters
 *	index: the index of the current item
 *	value: the value of the current item
 *  Also can be a string, which would be the name of a method to invoke on each item, if possible.
 *  In this case the callback should be followed by an array of arguments to pass to the method calls.
 *  You can still pass the options afterwards.
 * @param {Object} options Can include the following:
 * @param {boolean} [options.ascending=false] pass true here to traverse in ascending key order, false in descending.
 * @param {boolean} [options.numeric=false] used together with ascending. Pass true to use numeric sort instead of string sort.
 * @param {Function} [options.sort] pass a comparator Function here to be used when sorting object keys before traversal. Also can pass a String naming the property on which to sort.
 * @param {boolean} [options.hasOwnProperty=false] set to true to skip properties found on the prototype chain.
 * @throws {Q.Error} If container is not array, object or string
 */
Q.each = function _Q_each(container, callback, options) {
	function _byKeys(a, b) { 
		return a > b ? 1 : (a < b ? -1 : 0); 
	}
	function _byFields(a, b) { 
		return container[a][s] > container[b][s] ? 1
			: (container[a][s] < container[b][s] ? -1 : 0); 
	}
	function _byKeysNumeric(a, b) { 
		return Number(a) - Number(b); 
	}
	function _byFieldsNumeric(a, b) { 
		return Number(container[a][s]) - Number(container[b][s]); 
	}
	var i, k, c, length, r, t, args;
	if (typeof callback === 'string' && Q.isArrayLike(arguments[2])) {
		args = arguments[2];
		options = arguments[3];
	}
	switch (t = Q.typeOf(container)) {
		case 'array':
		default:
			// Assume it is an array-like structure.
			// Make a copy in case it changes during iteration. Then iterate.
			c = Array.prototype.slice.call(container, 0);
			if (('0' in container) && !('0' in c)) {
				// we are probably dealing with IE < 9
				c = [];
				for (i=0; r = container[i]; ++i) {
					c.push(r);
				}
			}
			length = c.length;
			if (!c || !length || !callback) return;
			if (options && options.ascending === false) {
				for (i=length-1; i>=0; --i) {
					r = Q.handle(callback, c[i], args || [i, c[i], c]);
					if (r === false) return false;
				}
			} else {
				for (i=0; i<length; ++i) {
					r = Q.handle(callback, c[i], args || [i, c[i]], c);
					if (r === false) return false;
				}
			}
			break;
		case 'object':
		case 'function':
			if (!container || !callback) return;
			if (options && ('ascending' in options || 'sort' in options)) {
				var keys = [], key;
				for (k in container) {
					if (options.hasOwnProperty && !Q.has(container, k)) {
						continue;
					}
					if (container.hasOwnProperty && container.hasOwnProperty(k)) {
						keys.push(options.numeric ? Number(k) : k);
					}
				}
				var s = options.sort;
				var t2 = typeof(s);
				var compare = (t2 === 'function') ? s : (t2 === 'string'
					? (options.numeric ? _byFieldsNumeric : _byFields)
					: (options.numeric ? _byKeysNumeric : _byKeys));
				keys.sort(compare);
				if (options.ascending === false) {
					for (i=keys.length-1; i>=0; --i) {
						key = keys[i];
						r = Q.handle(callback, container[key], args || [key, container[key], container]);
						if (r === false) return false;
					}
				} else {
					for (i=0; i<keys.length; ++i) {
						key = keys[i];
						r = Q.handle(callback, container[key], args || [key, container[key], container]);
						if (r === false) return false;
					}
				}
			} else {
				for (k in container) {
					if (container.hasOwnProperty && container.hasOwnProperty(k)) {
						r = Q.handle(callback, container[k], args || [k, container[k], container]);
						if (r === false) return false;
					}
				}
			}
			break;
		case 'string':
			if (!container || !callback) return;
			if (options && options.ascending === false) {
				for (i=0; i<container.length; ++i) {
					c = container.charAt(i);
					r = Q.handle(callback, c, args || [i, c, container]);
					if (r === false) return false;
				}
			} else {
				for (i=container.length-1; i>=0; --i) {
					c = container.charAt(i);
					r = Q.handle(callback, c, args || [i, c, container]);
					if (r === false) return false;
				}
			}
			break;
		case 'number':
			var from = 0, to=container, step;
			if (typeof arguments[1] === 'number') {
				from = arguments[0];
				to = arguments[1];
				if (typeof arguments[2] === 'number') {
					step = arguments[2];
					callback = arguments[3];
					options = arguments[4];
				} else {
					callback = arguments[2];
					options = arguments[3];
				}
			}
			if (!callback) return;
			if (step === undefined) {
				step = (from <= to ? 1 : -1);
			}
			if (!step || (to-from)*step<0) {
				return 0;
			}
			if (from <= to) {
				for (i=from; i<=to; i+=step) {
					r = Q.handle(callback, this, args || [i], container);
					if (r === false) return false;
					if (step < 0) return 0;
				}
			} else {
				for (i=from; i>=to; i+=step) {
					r = Q.handle(callback, this, args || [i], container);
					if (r === false) return false;
					if (step > 0) return 0;
				}
			}
			break;
		case 'boolean':
			if (container === false) break;
			throw new Q.Error("Q.each: does not support iterating a " + t);
		case 'null':
		case 'undefined':
			break;
	}
};

/**
 * Returns the first non-undefined value found in a container
 * Note: do not rely on object key ordering, it can vary in some browsers
 * @static
 * @method first
 * @param {Array|Object|String} container
 * @param {Object} options
 * @param {boolean} [options.nonEmptyKey] return the first non-empty key
 * @return {mixed} the value in the container, or undefined
 * @throws {Q.Error} If container is not array, object or string
 */
Q.first = function _Q_first(container, options) {
	var fk = Q.firstKey(container, options);
	return fk != null ? container[fk] : undefined;
};

/**
 * Returns the first key or index found in a container with a value that's not undefined
 * Note: do not rely on object key ordering, it can vary in some browsers
 * @static
 * @method firstKey
 * @param {Array|Object|String} container
 * @param {Object} options
 * @param {boolean} [options.nonEmptyKey] return the first non-empty key
 * @return {Number|String} the index in the container, or null
 * @throws {Q.Error} If container is not array, object or string
 */
Q.firstKey = function _Q_firstKey(container, options) {
	if (!container) {
		return undefined;
	}
	switch (typeof container) {
		case 'array':
			for (var i=0; i<container.length; ++i) {
				if (container[i] !== undefined) {
					return i;
				}
			}
			break;
		case 'object':
			for (var k in container) {
				if (container.hasOwnProperty(k)
				&& container[k] !== undefined) {
					if (k || !options || !options.nonEmptyKey) {
						return k;
					}
				}
			}
			break;
		case 'string':
			return 0;
		default:
			throw new Q.Error("Q.first: container has to be an array, object or string");
	}
	return undefined;
};

/**
 * Tests whether a variable contains a falsy value,
 * or an empty object or array.
 * @static
 * @method isEmpty
 * @param {object} o
 *  The object to test.
 *  @return {boolean}
 */
Q.isEmpty = function _Q_isEmpty(o) {
	if (!o) {
		return true;
	}
	var i, v, t;
	t = Q.typeOf(o);
	if (t === 'array') {
		return (o.length === 0);
	}
	if (t === 'object') {
		for (i in o) {
			v = o[i];
			if (v !== undefined) {
				return false;
			}
		}
		return true;
	}
	return false;
};

/**
 * Tests if the value is an integer
 * @static
 * @method isInteger
 * @param {mixed} value 
 *  The value to test
 * @param {boolean} [strictComparison=true]
 *  Whether to test strictly for a number
 * @return {boolean}
 *	Whether it is an integer
 */
Q.isInteger = function _Q_isInteger(value, strictComparison) {
	if (strictComparison) {
		return Number.isInteger(value);
	}
	return value > 0 ? Math.floor(value) == value : Math.ceil(value) == value;
};

/**
 * Tests if the value is an array
 * @static
 * @method isArray
 * @param value {mixed}
 *  The value to test
 * @return {boolean}
 *	Whether it is an array
 */
Q.isArrayLike = function _Q_isArrayLike(value) {
	return (Q.typeOf(value) === 'array') || (root.$ && root.$.prototype && value instanceof root.$);
};

/**
 * Determines whether something is a plain object created within Javascript,
 * or something else, like a DOMElement or Number
 * @static
 * @method isPlainObject
 * @param {Mixed} x
 * @return {boolean}
 *  Returns true only for a non-null plain object
 */
Q.isPlainObject = function (x) {
	if (x === null || typeof x !== 'object') {
		return false;
	}
	if (Object.prototype.toString.apply(x) !== "[object Object]") {
		return false;
	}
	if (root.attachEvent && !root.addEventListener) {
		// This is just for old browsers
		if (x && x.constructor !== Object) {
			return false;
		}
	}
	return true;
};

/**
 * Use this instead of instanceof, it works with Q.mixin, even in IE
 * @static
 * @method instanceOf
 * @param {mixed} testing
 * @param {Function} Constructor
 */
Q.instanceOf = function (testing, Constructor) {
	if (!testing || typeof testing !== 'object') {
		return false;
	}
	if (testing instanceof Constructor) {
		return true;
	}
	if (Constructor.__mixins) {
		for (var mixin in Constructor.__mixins) {
			if (testing instanceof mixin) {
				return true;
			}
		}
	}
	return false;
};

/**
 * Makes a shallow copy of an object. But, if any property is an object with a "copy" method,
 * or levels > 0, it recursively calls that method to copy the property.
 * @static
 * @method copy
 * @param {Object} x The object to copy
 * @param {Array} [fields=null]
 *  Optional array of fields to copy. Otherwise copy all that we can.
 * @param levels {number}
 *  Optional. Copy this many additional levels inside x if it is a plain object.
 * @return {Object}
 *  Returns the shallow copy where some properties may have deepened the copy
 */
Q.copy = function _Q_copy(x, fields, levels) {
	if (root.ArrayBuffer && (x instanceof ArrayBuffer)) {
		var result = ArrayBuffer.prototype.slice.call(x, 0);
	}
	if (Q.isArrayLike(x)) {
		var result = Array.prototype.slice.call(x, 0);
		var keys = Object.keys(x);
		for (var i=0, l=keys.length; i<l; ++i) {
			result[keys[i]] = x[keys[i]];
		}
		return result;
	}
	if (x && typeof x.copy === 'function') {
		return x.copy();
	}
	if (x === null || !Q.isPlainObject(x)) {
		return x;
	}
	var result = Q.objectWithPrototype(Object.getPrototypeOf(x)), i, k, l;
	if (fields) {
		for (i = 0, l = fields.length; i < l; ++i) {
			var path = fields[i].split('.');
			var value = x;
			for (var j = 0; j < path.length; ++j) {
				if (value && typeof value === 'object') {
					value = value[path[j]];
				} else {
					value = undefined;
					break;
				}
			}
			if (typeof value !== 'undefined') {
				result[fields[i]] = levels ? Q.copy(value, null, levels - 1) : value;
			}
		}
	} else {
		for (k in x) {
			if (!Q.has(x, k)) {
				continue;
			}
			result[k] = levels ? Q.copy(x[k], null, levels-1) : x[k];
		}
	}
	return result;
};

/**
 * Extends an object by merging other objects on top. Among other things,
 *  Q.Events can be extended with Q.Events or objects of {key: handler} pairs,
 *  Arrays can be extended by other arrays or objects.
 *  (If an array is being extended by an object with a "replace" property,
 *   the array is replaced by the value of that property.)
 *  Arrays can also handle {add, remove, updates} objects for keyed diffs.
 *  You can also extend recursively, see the levels parameter.
 * @static
 * @method extend
 */
Q.extend = function _Q_extend(target /* [[deep,] [levels,] anotherObject], ... [, namespace] */ ) {
	var length = arguments.length;
	var namespace = undefined;
	if (typeof arguments[length-1] === 'string') {
		namespace = arguments[length-1];
		--length;
	}
	if (length === 0) {
		return {};
	}
	var deep = false, levels = 0;
	var type = Q.typeOf(target);
	var targetIsEvent = (type === 'Q.Event');
	var i, arg, k, argk, m, ttk, tak;

	for (i=1; i<length; ++i) {
		arg = arguments[i];
		if (!arg) continue;
		if (arg === true) { deep = true; continue; }
		if (typeof arg === 'number' && arg) { levels = arg; continue; }

		if (target === undefined) {
			if (Q.isArrayLike(arg)) { target=[]; type='array'; }
			else { target={}; type='object'; }
		}

		if (targetIsEvent) {
			if (arg && arg.constructor === Object) {
				for (m in arg) target.set(arg[m], m);
			} else {
				target.set(arg, namespace);
			}
			continue;
		}

		// --- array extension handling ---
		if (type === 'array') {
			if (Q.isArrayLike(arg)) {
				target = Array.prototype.concat.call(target, arg)
					.filter(function (item, i, ar) {
						return ar.indexOf(item) === i;
					});
			} else if (Q.isPlainObject(arg)) {
				// keyed diff semantics
				if (arg.replace) {
					target = Q.copy(arg.replace);
				} else {
					if (arg.updates) {
						var keyField = arg.updates[0];
						var updates = arg.updates.slice(1);
						updates.forEach(function (upd) {
							for (var j=0;j<target.length;j++) {
								if (target[j][keyField] === upd[keyField]) {
									target[j] = Q.extend(target[j], true, levels-1, upd);
								}
							}
						});
					}
					if (arg.add) {
						target = target.concat(arg.add);
					}
					if (arg.remove) {
						var keyField = (arg.updates && arg.updates[0]) || null;
						if (keyField) {
							target = target.filter(function (item) {
								return !arg.remove.some(function (r) {
									return item[keyField] === r[keyField];
								});
							});
						} else {
							// remove by value if no keyField
							target = target.filter(function (item) {
								return arg.remove.indexOf(item) === -1;
							});
						}
					}
				}
			}
		} else {
			// --- object extension handling ---
			for (k in arg) {
				if (deep !== true 
				&& (!arg.hasOwnProperty || !arg.hasOwnProperty(k))
				&& (arg.hasOwnProperty && (k in arg))) {
					continue;
				}
				argk = arg[k];
				ttk = (k in target) && Q.typeOf(target[k]);
				tak = Q.typeOf(argk);

				if (ttk === 'Q.Event') {
					if (argk && argk.typename === 'Q.Event') {
						argk = argk.handlers;
					}
					if (argk && argk.constructor === Object) {
						for (m in argk) target[k].set(argk[m], m);
					} else if (tak === 'Q.Event') {
						for (m in argk.handlers) target[k].set(argk.handlers[m], m);
					} else {
						target[k].set(argk, namespace);
					}
				} else if (levels 
				&& target[k]
				&& (typeof target[k] === 'object' || typeof target[k] === 'function') 
				&& tak !== 'Q.Event'
				&& (Q.isPlainObject(argk) || (ttk === 'array' && tak === 'array'))) {
					target[k] = (ttk === 'array' && ('replace' in argk))
						? Q.copy(argk.replace)
						: Q.extend(target[k], deep, levels-1, argk);
				} else {
					target[k] = Q.extend.dontCopy[Q.typeOf(argk)]
						? argk
						: Q.copy(argk, null, levels);
				}
				if (argk === undefined) delete target[k];
			}
		}

		deep = false; levels = 0;
	}
	return target;
};

Q.extend.dontCopy = {
	"Q.Tool": true,
	"Q.Cache": true
};

/**
 * Returns whether an object contains a property directly
 * @static
 * @method has
 * @param  {Object} obj
 * @param {String} key
 * @return {boolean}
 */
Q.has = function _Q_has(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * Copies a subset of the fields in an object
 * @static
 * @method take
 * @param {Object} source
 *  An Object from which to take things
 * @param  {Array|Object} fields
 *  An array of fields to take
 *  Or an Object of fieldname: default pairs
 * @param {Object} [result]
 *  Optionally pass an object here as a destination
 * @return {Object}
 */
Q.take = function _Q_take(source, fields, result) {
	result = result || {};
	if (!source) return result;
	if (Q.isArrayLike(fields)) {
		for (var i = 0; i < fields.length; ++i) {
			if (fields[i] in source) {
				result [ fields[i] ] = source [ fields[i] ];
			}
		}
	} else {
		for (var k in fields) {
			result[k] = (k in source) ? source[k] : fields[k];
		}
	}
	return result;
};

/**
 * Shuffles an array
 * @static
 * @method shuffle
 * @param {Array} arr
 *  The array that gets passed here is shuffled in place
 * @return {Array} returns the array
 */
Q.shuffle = function _Q_shuffle( arr ) {
	var i = arr.length;
	if ( !i ) return arr;
	while ( --i ) {
		var j = Math.floor( Math.random() * ( i + 1 ) );
		var tempi = arr[i];
		var tempj = arr[j];
		arr[i] = tempj;
		arr[j] = tempi;
	}
	return arr;
};

/**
 * Mixes in one or more classes. Useful for inheritance and multiple inheritance.
 * @static
 * @method mixin
 * @param {Function} A
 *  The constructor corresponding to the "class" we are mixing functionality into
 *  This function will get the following members set:
 *  __mixins: an array of [B, C, ...]
 *  constructors(subject, params): a method to call the constructor of all mixin classes, in order. Pass "this" as the first argument.
 *  staticProperty(property): a method for getting a property name
 * @param {Function} B
 *  One or more constructors representing "classes" to mix functionality from
 *  They will be tried in the order they are provided, meaning methods from earlier ones
 *  override methods from later ones.
 */
Q.mixin = function _Q_mixin(A /*, B, ... */) {
	var __mixins = (A.__mixins || (A.__mixins = []));
	var mixin, i, k, l;
	for (i = 1, l = arguments.length; i < l; ++i) {
		mixin = arguments[i];
		if (typeof mixin !== 'function') {
			throw new Q.Error("Q.mixin: argument " + i + " is not a function");
		}
		var p = mixin.prototype, Ap = A.prototype;
		for (k in p) {
			if (!(k in Ap)) {
				Ap[k] = p[k];
			}
		}
		for (k in mixin) {
			if (!(k in A)) {
				A[k] = mixin[k];
			}
		}
		__mixins.push(arguments[i]);
	}

	A.staticProperty = function _staticProperty(propName) {
		for (var i=0; i<A.__mixins.length; ++i) {
			if (propName in A.__mixins[i]) {
				return A.__mixins[i][propName];
			}
		}
		return undefined;
	};
	
	A.constructors = function _constructors() {
		var mixins = A.__mixins;
		var i;
		for (i = mixins.length - 1; i >= 0; --i) {
			mixins[i].apply(this, arguments);
		}
	};

	A.prototype.constructors = function _prototype_constructors() {
		A.constructors.apply(this, arguments);
	};
};

/**
 * Normalizes text by converting it to lower case, and
 * replacing all non-accepted characters with underscores.
 * @static
 * @method normalize
 * @param {String} text
 *  The text to normalize
 * @param {String} [replacement='_']
 *  Defaults to '_'. A string to replace one or more unacceptable characters.
 *  You can also change this default using the config Db/normalize/replacement
 * @param {RegExp|Boolean} [characters=null] Defaults to alphanumerics across most languages /[^\p{L}0-9]+/gu. 
 *  You can pass true here to allow only ASCII alphanumerics, i.e. /[^A-Za-z0-9]+/g.
 *  Or pass a RegExp identifying regexp characters that are not acceptable.
 * @param {number} numChars
 *  The maximum length of a normalized string. Default is 200.
 * @param {boolean} [keepCaseIntact=false] If true, doesn't convert to lowercase
 * @return {String} the normalized string
 */
Q.normalize = function _Q_normalize(text, replacement, characters, numChars, keepCaseIntact) {
	if (text === undefined || typeof text !== 'string') {
		debugger;
		return text;
	}
	if (!numChars) numChars = 200;
	if (replacement === undefined) replacement = '_';
	if (characters === true) characters = Q.normalize.regexpASCII;
	else if (!characters) characters = Q.normalize.regexpUNICODE;
	if (!keepCaseIntact) {
		text = text.toLowerCase();
	}
	var result = text.replace(characters, replacement);
	if (result.length > numChars) {
		result = result.substring(0, numChars - 11) + '_' +
			Math.abs(result.substring(numChars - 11).hashCode());
	}
	return result;
};

Q.normalize.regexpASCII = new RegExp("[^A-Za-z0-9]+", "g");
Q.normalize.regexpUNICODE = new RegExp("[^\\p{L}0-9]+", "gu");

/**
 * A simplified version of Q.normalize that remembers results, to avoid
 * doing the same operation multiple times.
 * @static
 * @method normalize.memoized
 * @param {String} text
 * @return {String}
 */
Q.normalize.memoized = function _Q_normalize_memoized (text) {
	if (!(text in Q.normalize.memoized.collection)) {
		Q.normalize.memoized.collection[text] = Q.normalize(text);
	}
	return Q.normalize.memoized.collection[text]
};
Q.normalize.memoized.collection = {};

function _getProp (/*Array*/parts, /*Boolean*/create, /*Object*/context){
	var p, i = 0;
	if (context === null) return undefined;
	context = context || root;
	if (!parts.length) return context;
	while(context && (p = parts[i++]) !== undefined){
		try {
			if (p === '*') {
				p = Q.firstKey(context);
			}
			context = (context[p] !== undefined) ? context[p] : (create ? context[p] = {} : undefined);
		} catch (e) {
			if (create) {
				throw new Q.Error("Q.setObject cannot set property of " + typeof(context) + " " + JSON.stringify(context));
			}
		}
	}
	return context; // mixed
}

/**
 * Set an object from a delimiter-separated string, such as "A.B.C"
 * Useful for longer api chains where you have to test each object in
 * the chain, or when you have an object reference in string format.
 * Objects are created as needed along `path`.
 * Another way to call this function is to pass an object of {name: value} pairs as the first parameter
 * and context as an optional second parameter. Then the return value is an object of the usual return values.
 * @static
 * @method setObject
 * @param {String|Array} name Path to a property, in the form "A.B.C" or ["A", "B", "C"]
 * @param {anything} value value or object to place at location given by name
 * @param {Object} [context=window]  Optional. Object to use as root of path.
 * @param {String} [delimiter='.']  The delimiter to use in the name
 * @return {Object|undefined} Returns the resulting value if setting is successful or `undefined` if not.
 */
Q.setObject = function _Q_setObject(name, value, context, delimiter) {
	if (Q.isPlainObject(name)) {
		context = value;
		var result = {};
		for (var k in name) {
			result[k] = Q.setObject(k, name[k], context);
		}
		return result;
	}
	if (typeof name === 'string') {
		name = name.split(delimiter || '.');
	}
	var p = name.pop();
	var obj = _getProp(name, true, context);
	return obj && (p !== undefined) ? (obj[p] = value) : undefined;
};

/**
 * Get a property from a delimiter-separated string, such as "A.B.C"
 * Useful for longer api chains where you have to test each object in
 * the chain, or when you have an object reference in string format.
 * You can also use it to resolve an object where it might be a string or array or something else.
 * @static
 * @method getObject
 * @param {String|Array} name Path to a property, in the form "A.B.C" or ["A", "B", "C"] . If not a string or an array, it is simply returned.
 * @param {Object} [context=window] Optional. Object to use as root of path. Null may be passed.
 * @param {String} [delimiter='.'] The delimiter to use in the name
 * @param {Mixed} [create=undefined] Pass a value here to set with Q.setObject if nothing was there
 * @return {Object|undefined} Returns the originally stored value, or `undefined` if nothing is there
 */
Q.getObject = function _Q_getObject(name, context, delimiter, create) {
	delimiter = delimiter || '.';
	if (typeof name === 'string') {
		name = name.split(delimiter);
	} else if (!(name instanceof Array)) {
		return name;
	}
	var result = _getProp(name, false, context);
	if (result === undefined && create !== undefined) {
		result = Q.setObject(name, create, context, delimiter);
	}
	return result;
};

/**
 * Used to prevent overwriting the latest results on the client with older ones.
 * Typically, you would call this function before making some sort of request,
 * save the ordinal in a variable, and then pass it to the function again inside
 * a closure. For example:
 * @example
 * var ordinal = Q.latest(tool);
 * requestSomeResults(function (err, results) {
 *   if (!Q.latest(tool, ordinal)) return;
 *   // otherwise, show the latest results on the client
 * });
 * @static
 * @method latest
 * @param key {String|Q.Tool}
 *  Requests under the same key share the same incrementing ordinal
 * @param ordinal {Number|Boolean}
 *  Pass an ordinal that you obtained from a previous call to the function
 *  Pass true here to get the latest ordinal that has been passed so far
 *  to the method under this key, corresponding to the latest results seen.
 * @return {Number|Boolean}
 *  If only key is provided, returns an ordinal to use.
 *  If ordinal is provided, then returns whether this is still the latest ordinal.
 */
Q.latest = function (key, ordinal) {
	key = Q.calculateKey(key);
	if (ordinal === undefined) {
		return Q.latest.issued[key]
			= ((Q.latest.issued[key] || 0) % Q.latest.max) + 1;
	}
	var seen = Q.latest.seen[key] || 0;
	if (ordinal === true) {
		return seen;
	}
	if (ordinal > seen || ordinal < seen - Q.latest.max * 9/10) {
		Q.latest.seen[key] = ordinal;
		return true;
	}
	return false;
};
Q.latest.issued = {};
Q.latest.seen = {};
Q.latest.max = 10000;

/**
 * Calculates a string key by considering the parameter that was passed,
 * the tool being activated, and the page being activated.
 * These keys can be used in methods of Q.Event, etc.
 * @static
 * @method calculateKey
 * @param {String|Q.Tool|true} key
 * @param {Object} container in which the key will be used
 * @param {number} number at which to start the loop for the default key generation
 * @return {String}
 */
Q.calculateKey = function _Q_calculateKey(key, container, start) {
	if (key === true) {
		return "PAGE: CURRENT";
	}
	if (key === undefined) {
		key = Q.Tool.beingActivated; // by default, use the current tool as the key, if any
	}
	if (Q.typeOf(key) === 'Q.Tool')	{
		key = "TOOL: " + key.id + " (" + key.name + ")";
	} else if (container && key == undefined) { // key is undefined or null
		var i = (start === undefined) ? 1 : start;
		key = 'AUTOKEY_' + i;
		while (container[key]) {
			key = 'AUTOKEY_' + (++i);
		}
	} else if (key !== undefined && typeof key !== 'string') {
		throw new Q.Error("Q.calculateKey: key must be a String, Q.Tool, true, null, or undefined");
	}
	return key;
};
Q.calculateKey.keys = [];

/**
 * Chains an array of callbacks together into a function that can be called with arguments
 * 
 * @static
 * @method chain
 * @param {Array} callbacks An array of callbacks, each taking another callback at the end
 * @param {Function} [callback] The final callback, if any, to call after the chain is done
 * @return {Function} The wrapper function
 */
Q.chain = function (callbacks) {
	var result = (callbacks && callbacks.pop()) || function () {
		var args = Array.prototype.slice.call(arguments);
		var cb = args.pop();
		if (typeof cb === 'function') {
			cb.apply(this, arguments);
		}
	};
	Q.each(callbacks, function (i, cb) {
		if (Q.typeOf(cb) !== 'function') {
			return;
		}
		var prevResult = result;
		result = function () {
			var args = Array.prototype.slice.call(arguments, 0);
			args.push(prevResult);
			return cb.apply(this, arguments);
		};
	}, {ascending: false, numeric: true});
	return result;
};

/**
 * Takes a function and returns a version that returns a promise
 * @method promisify
 * @static
 * @param  {Function} getter A function that takes arguments that include a callback and passes err as the first parameter to that callback, and the value as the second argument.
 * @param {Boolean|string} useThis whether to resolve the promise with the "this" instead of the second argument.
 * @param {Number|Array} callbackIndex Which argument the getter is expecting the callback, if any.
 * @return {Function} a wrapper around the function that returns a promise, extended with the original function's return value if it's an object
 */
Q.promisify = function (getter, useThis, callbackIndex) {
	function _promisifier() {
		if (!Q.Promise) {
			return getter.apply(this, arguments);
		}
		var args = [], resolve, reject, found = false;
		var promise = new Q.Promise(function (r1, r2) {
			resolve = r1;
			reject = r2;
		});
		Q.each(arguments, function (i, ai) {
			if (callbackIndex instanceof Array
			&& callbackIndex[0] == i) {
				found = true;
				args.push(function _onResolve(value) {
					if (ai instanceof Function) {
						try {
							return ai.apply(this, arguments);
						} catch (e) {
							return;
						}
					}
					return resolve(value);
				});
			} else if (callbackIndex instanceof Array
			&& callbackIndex[1] == i) {
				found = true;
				args.push(function _onReject(value) {
					if (ai instanceof Function) {
						try {
							return ai.apply(this, arguments);
						} catch (e) {
							return;
						}
						return;
					}
					return reject(value);
				});
			} else if (!(ai instanceof Function)) {
				args.push(ai);
			} else {
				function _promisified(err, second) {
					if (ai instanceof Function) {
						return ai.apply(this, arguments);
					}
					if (err) {
						return reject(err);
					}
					resolve(useThis ? this : second);
				}
				found = true;
				args.push(_promisified);
			}
		});
		if (callbackIndex instanceof Array) {
			if (callbackIndex[0] && args.length <= callbackIndex[0]) {
				args[callbackIndex[0]] = resolve;
			}
			if (callbackIndex[1] && args.length <= callbackIndex[1]) {
				args[callbackIndex[1]] = reject;
			}
		} else if (!found) {
			var ci = (callbackIndex === undefined) ? args.length : callbackIndex;
			args.splice(ci, 0, function _defaultCallback(err, second) {
				if (err) {
					return reject(err);
				}
				resolve(useThis ? this : second);
			});
		}
		try {
			return Q.extend(promise, getter.apply(this, args));
		} catch (e) {
			reject(e);
			return promise;
		}
	}
	return Q.extend(_promisifier, getter);
};

/**
 * Wraps a function and returns a wrapper that will call the function
 * at most once every given milliseconds.
 * @static
 * @method throttle
 * @param {Function} original The function to wrap
 * @param {Number} milliseconds The number of milliseconds
 * @param {Boolean} delayedFinal Whether the wrapper should execute the latest function call
 *  after throttle opens again, useful for e.g. following a mouse pointer that stopped.
 * @param {Mixed} defaultValue Value to return whenever original function isn't called
 * @return {Function} The wrapper function
 */
Q.throttle = function (original, milliseconds, delayedFinal, defaultValue) {
	var _lastCalled;
	var _timeout = null;
	return function _Q_throttle_wrapper(e) {
		var t = this, a = arguments;
		var ms = Date.now() - _lastCalled;
		if (ms < milliseconds) {
			if (delayedFinal) {
				if (_timeout) {
					clearTimeout(_timeout);
				}
				_timeout = setTimeout(function () {
					_lastCalled = Date.now();
					original.apply(t, a);
				}, milliseconds - ms);
			}
			return defaultValue;
		}
		_lastCalled = Date.now();
		return original.apply(this, arguments);
	};
};

/**
 * Wraps a function and returns a wrapper that adds the function to a queue
 * of functions to be called one by one at most once every given milliseconds.
 * @static
 * @method queue
 * @param {Function} original The function to wrap
 * @param {number} milliseconds The number of milliseconds, defaults to 0
 * @return {Function} The wrapper function
 */
Q.queue = function (original, milliseconds) {
	var _queue = [];
	var _timeout = null;
	milliseconds = milliseconds || 0;
	function _Q_queue_next() {
		if (!_queue.length) {
			_timeout = null;
			return 0;
		}
		var p = _queue.shift();
		var ret = original.apply(p[0], p[1]);
		if (ret === false) {
			_timeout = null;
			_queue = [];
		} else {
			_timeout = setTimeout(_Q_queue_next, milliseconds);
		}
	};
	return function _Q_queue_wrapper() {
		var args = Array.prototype.slice.call(arguments, 0);
		var len = _queue.push([this, args]);
		if (!_timeout) {
			_timeout = setTimeout(_Q_queue_next, 0);
		}
		return len;
	};
};

/**
 * Wraps a function and returns a wrapper that will call the function
 * after calls stopped coming in for a given number of milliseconds.
 * If the immediate param is true, the wrapper lets the function be called the first time
 * without waiting if it hasn't been called for the given number of milliseconds.
 * @static
 * @method debounce
 * @param {Function} original The function to wrap
 * @param {number} milliseconds The number of milliseconds
 * @param {Boolean} [immediate=false] if true, the wrapper also lets the function be called
 *   the first time without waiting if it hasn't been called for the given number of milliseconds.
 * @param {Mixed} defaultValue Value to return whenever original function isn't called
 * @return {Function} The wrapper function
 */
Q.debounce = function (original, milliseconds, immediate, defaultValue) {
	var _timeout = null;
	return function _Q_debounce_wrapper() {
		var t = this, a = arguments;
		if (_timeout) {
			clearTimeout(_timeout);
		} else if (immediate) {
			original.apply(t, a);
		}
		_timeout = setTimeout(function _Q_debounce_handler() {
			if (!immediate) {
				original.apply(t, a);
			}
			_timeout = null;
		}, milliseconds);
		return defaultValue;
	};
};

/**
 * Shorthand for creating a new element
 * @param {String} tagName The tag name of the element
 * @param {Object} [attributes] Pair of attributeName: attributeValue.
 *  Names like "class" should be in quotation marks since they're JS keywords.
 * @param {Array|String} [elementsToAppend] either an HTML string or an array of elements to append, if any
 * @return {Element}
 */
Q.element = function (tagName, attributes, elementsToAppend) {
	var element = document.createElement(tagName);
	if (attributes) {
		for (var k in attributes) {
			element.setAttribute(k, attributes[k]);
		}
	}
	if (elementsToAppend) {
		if (typeof elementsToAppend === 'string') {
			element.innerHTML = elementsToAppend
		} else {
			for (var i=0, l=elementsToAppend.length; i<l; ++i) {
				var e = elementsToAppend[i];
				if (e) {
					if (typeof(e) === 'string') {
						element.innerHTML += e; // append as HTML, not text
					} else {
						element.append(e);
					}
				}
			}
		}
	}
	return element;
};

/**
 * Return querySelectorAll entries() iterator for use in for loops
 * @method $
 * @static
 * @param {String} selector Any selector passed to querySelectorAll
 * @param {Element} [container=document] defaults to the entire document
 * @param {Boolean} [toArray] whether to convert NodeList to a static array instead.
 *   Note: in that case, the result won't be live anymore.
 * @return {Iterator|Array}
 */
Q.$ = function (selector, container, toArray) {
	var list = (container || document).querySelectorAll(selector);
	return toArray ? Array.prototype.slice.call(list) : list.values();
};

/**
 * Functionality related to regular expressions
 * @class RegExp
 */
Q.RegExp = {
	/**
     * Returns RegExp to match letters in almost all languages
     * @method letters
     * @static
     * @return {RegExp}
     */
	letters: function () {
		return RegExp(/^\p{L}/,'u');
	}
};

/**
 * Wraps a callable in a Q.Event object
 * @class Q.Event
 * @namespace Q
 * @constructor
 * @param {callable} callable
 *  Optional. If not provided, the chain of handlers will start out empty.
 *  Any kind of callable which Q.handle can invoke
 * @param {String} [key=null]
 *  Optional key under which to add this, so you can remove it later if needed
 * @param {boolean} [prepend=false]
 *  If true, then prepends the callable to the chain of handlers
 */
Q.Event = function _Q_Event(callable, key, prepend) {
	if (this === Q) {
		throw new Q.Error("Q.Event: Missing new keyword");
	}
	var event = this;
	this.handlers = {};
	this.keys = [];
	this.typename = "Q.Event";
	if (callable) {
		this.set(callable, key, prepend);
	}
	/**
	 * Shorthand closure for emitting events
	 * Pass any arguments to the event here.
	 * You can pass this closure anywhere a callback function is expected.
	 * @method handle
	 * @return {mixed}
	 */
	this.handle = function _Q_Event_instance_handle() {
		var i, count = 0, oldOccurring = event.occurring, result;
		if (event.stopped) return 0;
		event.occurring = true;
		event.lastContext = this;
		event.lastArgs = arguments;
		var keys = Q.copy(event.keys); // in case event.remove is called during loop
		for (i=0; i<keys.length; ++i) {
			result = Q.handle(event.handlers[ keys[i] ], this, arguments);
			if (result === false) return false;
			count += result;
		}
		event.occurring = oldOccurring;
		event.occurred = true; // unless an exception was thrown
		return count;
	};
};

Q.Event.forTool = {};
Q.Event.forPage = [];
Q.Event.jQueryForTool = {};
Q.Event.jQueryForPage = [];

/**
 * Define an event on a target, and give it a type
 * @param {Object} target 
 * @param {String} type 
 * @return Q.Event
 */
Q.Event.define = function (target, type) {
	var event = new Q.Event();
	target[type] = event;
	event.type = type;
	return event;
};

/**
 * Returns a Q.Event that will fire given an DOM object and an event name.
 * Add and remove event handlers on this event. When the last handler is
 * removed, then Q.removeEventListener() is called on the target DOM element.
 * @static
 * @method from
 * @param {Object} target
 * @param {String} eventName
 * @return {Q.Event}
 */
Q.Event.from = function _Q_Event_from(target, eventName) {
	var event = new Q.Event();
	Q.addEventListener(target, eventName, event.handle);
	event.onEmpty().set(function () {
		Q.removeEventListener(target, eventName, event.handle);
	});
	return event;
};

var Evp = Q.Event.prototype;
Evp.occurred = false;
Evp.occurring = false;

/**
 * Adds a handler to an event, or overwrites an existing one
 * @method set
 * @param {Mixed} handler Any kind of callable which Q.handle can invoke
 * @param {String|Boolean|Q.Tool} key Optional key to associate with the handler.
 *  Used to replace handlers previously added under the same key.
 *  Also used for removing handlers with .remove(key).
 *  Pass true here to associate the handler to the current page,
 *  and it will be automatically removed when the current page is removed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 *  But note that passing the same tool on same event again will overwrite the previous handler.
 *  If the key is undefined, a unique one is computed.
 *  However, if this function is being called while activating a tool or page,
 *  then the key will be automatically derived from that tool, or page.
 *  Pass null (instead of leaving key undefined) to avoid this.
 * @param {boolean} prepend If true, then prepends the handler to the chain
 * @return {String|null} The key under which the handler was set, or null if handler and key were both empty
 */
Evp.set = function _Q_Event_prototype_set(handler, key, prepend) {
	if (!handler) {
		if (key) {
			handler = null;
		} else {
			return null;
		}
	}
	if (key === true || (key === undefined
	&& Q.Page && Q.Page.beingActivated)) {
		Q.Event.forPage.push(this);
	} else if (key === undefined) {
		key = Q.Tool.beingActivated;
	}
	var isTool = (Q.typeOf(key) === 'Q.Tool');
	key = Q.calculateKey(key, this.handlers, this.keys.length);
	this.handlers[key] = handler; // can be a function, string, Q.Event, etc.
	if (this.keys.indexOf(key) < 0) {
		if (prepend) {
			this.keys.unshift(key);
		} else {
			this.keys.push(key);
		}
	}
	if (isTool) {
		Q.Event.forTool[key] = Q.Event.forTool[key] || [];
		Q.Event.forTool[key].push(this);
	}
	if (this.keys.length === 1 && this._onFirst) {
		this._onFirst.handle.call(this, handler, key, prepend);
	}
	if (this._onSet) {
		this._onSet.handle.call(this, handler, key, prepend);
	}
	return key;
};

/**
 * Like the "set" method, adds a handler to an event, or overwrites an existing one.
 * But in addition, immediately handles the handler if the event has already occurred at least once, or is currently occuring,
 * passing it the same subject and arguments as were passed to the event the last time it occurred.
 * @method add
 * @param {mixed} handler Any kind of callable which Q.handle can invoke
 * @param {String|Boolean|Q.Tool} Optional key to associate with the handler.
 *  Used to replace handlers previously added under the same key.
 *  Also used for removing handlers with .remove(key).
 *  Pass true here to associate the handler to the current page,
 *  and it will be automatically removed when the current page is removed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 *  But note that passing the same tool on same event again will overwrite the previous handler.
 *  If the key is undefined, a unique one is computed.
 *  However, if this function is being called while activating a tool or page,
 *  then the key will be automatically derived from that tool, or page.
 *  Pass null (instead of leaving key undefined) to avoid this.
 * @param {boolean} prepend If true, then prepends the handler to the chain
 * @return {String|null} The key under which the handler was set, or null if handler is empty
 */
Evp.add = function _Q_Event_prototype_add(handler, key, prepend) {
	var ret = this.set(handler, key, prepend);
	if (this.occurred || this.occurring) {
		Q.handle(handler, this.lastContext, this.lastArgs);
	}
	return ret;
};

/**
 * Like "set" method, but removes the handler right after it has executed.
 * @method setOnce
 * @param {mixed} handler Any kind of callable which Q.handle can invoke
 * @param {String|Boolean|Q.Tool} Optional key to associate with the handler.
 *  Used to replace handlers previously added under the same key.
 *  If the key is not provided, a unique one is computed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 * @param {boolean} prepend If true, then prepends the handler to the chain
 * @return {String} The key under which the handler was set
 */
Evp.setOnce = function _Q_Event_prototype_setOnce(handler, key, prepend) {
	if (!handler) return undefined;
	var event = this;
	return key = event.set(function _setOnce() {
		handler.apply(this, arguments);
		event.remove(key);
	}, key === undefined ? null : key, prepend);
};

/**
 * Use this method to defer a function until an event has occurred.
 * Like "add" method, but removes the handler right after it has executed.
 * @method addOnce
 * @param {mixed} handler Any kind of callable which Q.handle can invoke
 * @param {String|Boolean|Q.Tool} key optional key to associate with the handler.
 *  Used to replace handlers previously added under the same key.
 *  If the key is not provided, a unique one is computed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 * @param {boolean} prepend If true, then prepends the handler to the chain
 * @return {String|boolean} The key under which the handler was set,
 *  or true the handler was synchronously executed during this function call.
 */
Evp.addOnce = function _Q_Event_prototype_addOnce(handler, key, prepend) {
	if (!handler) return undefined;
	if (this.occurred || this.occurring) {
		Q.handle(handler, this.lastContext, this.lastArgs);
		return true;
	}
	var event = this;
	return key = event.add(function _addOnce() {
		handler.apply(this, arguments);
		event.remove(key);
	}, key, prepend);
};

/**
 * Removes an event handler
 * @method remove
 * @param {String} key
 *  The key of the handler to remove.
 *  Pass a Q.Tool object here to remove the handlers, if any, associated with this tool.
 */
Evp.remove = function _Q_Event_prototype_remove(key) {
	// Only available in the front-end Q.js: {
	var key2 = Q.calculateKey(key);
	if (key === true) {
		l = Q.Event.forPage.length;
		for (i=0; i<l; ++i) {
			if (Q.Event.forPage[i] === this) {
				Q.Event.forPage.splice(i, 1);
				break;
			}
		}
	} else if (Q.Event.forTool[key2]) {
		l = Q.Event.forTool[key2].length;
		for (i=0; i<l; ++i) {
			if (Q.Event.forTool[key2][i] === this) {
				Q.Event.forTool[key2].splice(i, 1);
				break;
			}
		}
	}
	// }
	var l, i = this.keys.indexOf(key2);
	if (i < 0) {
		return 0;
	}
	this.keys.splice(i, 1);
	if (this._onRemove) {
		this._onRemove.handle.call(this, key2);
	}
	if (!this.keys.length && this._onEmpty) {
		this._onEmpty.handle.call(this, key2);
	}
	delete this.handlers[key2];
	return 1;
};

/**
 * Removes all handlers for this event
 * @method removeAllHandlers
 */
Evp.removeAllHandlers = function _Q_Event_prototype_removeAllHandlers() {
	this.handlers = {};
	this.keys = [];
	if (this._onEmpty) {
		this._onEmpty.handle.call(this);
	}
};

/**
 * Indicates that the event won't be firing anymore
 * @method stop
 * @param {boolean} removeAllHandlers
 *  If true, then also removes all the handlers added to this event
 */
Evp.stop = function _Q_Event_prototype_stop(removeAllHandlers) {
	this.stopped = true;
	if (this._onStop) {
		this._onStop.handle.call(this);
	}
	if (removeAllHandlers) {
		this.removeAllHandlers.call(this);
	}
};

/**
 * Make a copy of this event, with all current keys and handlers.
 * If you instead want to chain events, consider doing
 * event.add(otherEvent.handle).
 * @method copy
 * @return {Q.Event}
 */
Evp.copy = function _Q_Event_prototype_copy() {
	var result = new Q.Event();
	for (var i=0; i<this.keys.length; ++i) {
		result.handlers[this.keys[i]] = this.handlers[this.keys[i]];
		result.keys.push(this.keys[i]);
	}
	result.type = this.type;
	return result;
};

/**
 * Returns a new Q.Event that occurs whenever either this or anotherEvent occurs
 * @method or
 * @param {Q.Event} anotherEvent
 *  The other event to check
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to this event.add (see docs for that method).
 * @param {String|Boolean|Q.Tool} [anotherKey] Optional key to pass to anotherEvent.add (see docs for that method).
 * @return {Q.Event}
 */
Evp.or = function _Q_Event_prototype_or(anotherEvent, key, anotherKey) {
	var newEvent = new Q.Event();
	this.add(newEvent.handle, key);
	if (anotherEvent) {
		anotherEvent.add(newEvent.handle, anotherKey);
	}
	return newEvent;
};

/**
 * Return a new Q.Event that occurs whenever either this or anotherEvent occurs
 * as long as both have occurred.
 * @method and
 * @param {Q.Event} anotherEvent
 *  The other event to check
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to this.add (see docs for that method).
 * @param {String|Boolean|Q.Tool} [anotherKey] Optional key to pass to anotherEvent.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.and = function _Q_Event_prototype_and(anotherEvent, key, anotherKey) {
	var newEvent = new Q.Event();
	if (!anotherEvent) {
		return Q.copy(this);
	}
	var event = this;
	newEvent.occurred = event.occurred && anotherEvent.occurred;
	newEvent.occurring = event.occurring || anotherEvent.occurring;
	function _Q_Event_and_wrapper() {
		if ((event.occurred || event.occurring)
		 && (anotherEvent.occurred || anotherEvent.occurring)) {
			 return newEvent.handle.apply(this, arguments);
		}
	}
	event.add(_Q_Event_and_wrapper, key);
	anotherKey = anotherEvent.add(_Q_Event_and_wrapper, anotherKey);
	return newEvent;
};

/**
 * Return a new Q.Event object that is handled whenever this event is handled,
 * until anotherEvent occurs, in which case this event occurs one final time.
 * @method until
 * @param {Q.Event} anotherEvent
 *  An event whose occurrence will stop the returned event
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to this.add (see docs for that method).
 * @param {String|Boolean|Q.Tool} [anotherKey] Optional key to pass to anotherEvent.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.until = function _Q_Event_prototype_until(anotherEvent, key, anotherKey) {
	var newEvent = new Q.Event();
	var event = this;
	key = event.add(newEvent.handle, key);
	anotherKey = anotherEvent.add(function _Q_Event_until_wrapper() {
		event.remove(key);
		anotherEvent.remove(anotherKey);
		event.stop();
	}, anotherKey);
	return newEvent;
};

/**
 * Return a new Q.Event object that waits until this event is stopped,
 * then processes all the pending calls to .handle(), continuing normally after that.
 * @method then
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.onStop().add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.then = function _Q_Event_prototype_then(key) {
	var newEvent = new Q.Event();
	var handle = newEvent.handle;
	var _waiting = true;
	var _pending = [];
	newEvent.handle = function _Q_Event_then_wrapper() {
		if (_waiting) {
			_pending.push([this, arguments]);
			return 0;
		}
		return handle.apply(this, arguments);
	};
	var key2 = this.onStop().add(function () {
		for (var i=0; i<_pending.length; ++i) {
			handle.apply(_pending[i][0], _pending[i][1]);
		}
		_waiting = false;
		this.onStop().remove(key2);
	}, key);
	return newEvent;
};

/**
 * Return a new Q.Event object that waits until after this event's handle() stops
 * being called for a given number of milliseconds, before processing the last call.
 * If the immediate param is true, the wrapper lets the function be called
 * without waiting if it hasn't been called for the given number of milliseconds.
 * @method debounce
 * @param {number} milliseconds The number of milliseconds
 * @param {Boolean} [immediate=false] if true, the wrapper lets the function be called
 *   without waiting if it hasn't been called for the given number of milliseconds.
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.debounce = function _Q_Event_prototype_debounce(milliseconds, immediate, key) {
	var newEvent = new Q.Event();
	this.add(Q.debounce(newEvent.handle, milliseconds, immediate, 0), key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will call handle() when this event's handle()
 * is called, but only at most every given milliseconds.
 * @method throttle
 * @param {Number} milliseconds The number of milliseconds
 * @param {Boolean} delayedFinal Whether the wrapper should execute the latest function call
 *  after throttle opens again, useful for e.g. following a mouse pointer that stopped.
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.throttle = function _Q_Event_prototype_throttle(milliseconds, delayedFinal, key) {
	var newEvent = new Q.Event();
	this.add(Q.throttle(newEvent.handle, milliseconds, delayedFinal, 0), key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will queue calls to this event's handle()
 * method, to occur once every given milliseconds
 * @method queue
 * @param {number} milliseconds The number of milliseconds, can be 0
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.queue = function _Q_Event_prototype_queue(milliseconds, key) {
	var newEvent = new Q.Event();
	this.add(Q.queue(newEvent.handle, milliseconds), key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will call handle() when this event's handle()
 * is called, but only if the test function returns true
 * @method filter
 * @param {Function} test Function to test the arguments and return a Boolean
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.filter = function _Q_Event_prototype_filter(test, key) {
	var newEvent = new Q.Event();
	this.add(function () {
		if (!test.apply(this, arguments)) return 0;
		return newEvent.handle.apply(this, arguments);
	}, key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will call handle() when this event's handle()
 * is called, but with the arguments returned by the transform function
 * @method map
 * @param {Function} transform Function to transform the arguments and return
 *   an array of two items for the new call: [this, arguments].
 *   Whenever the transform function returns false, the returned event isn't triggered.
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.map = function _Q_Event_prototype_map(transform, key) {
	var newEvent = new Q.Event();
	this.add(function () {
		var parts = transform.apply(this, arguments);
		if (parts === false) {
			return false;
		}
		return newEvent.handle.apply(parts[0], parts[1]);
	}, key);
	return newEvent;
};

Evp.onFirst = function () {
   return this._onFirst || (this._onFirst = new Q.Event());
};

Evp.onSet = function () {
   return this._onSet || (this._onSet = new Q.Event());
};

Evp.onRemove = function () {
   return this._onRemove || (this._onRemove = new Q.Event());
};

Evp.onEmpty = function () {
   return this._onEmpty || (this._onEmpty = new Q.Event());
};

Evp.onStop = function () {
   return this._onStop || (this._onStop = new Q.Event());
};

Evp.toJSON = function () {
	var e = Q.copy(this);
	// remove potentially circular references:
	delete e.lastArgs;
	delete e.lastContext;
	return e;
};

/**
 * Make an event factory
 * @static
 * @method factory
 * @param {Object} [collection]
 *  The object that will store all the events. Pass null here to auto-create one.
 * @param {Array} [defaults]
 *  You can pass an array of defaults for the fields in the returned function
 *  The last element of this array can be a function that further processes the arguments,
 *  returning an array of the resulting arguments
 * @param {Function} [callback]
 *  An optional callback that gets called when a new event is created.
 *  The "this" object is the Q.Event, and the parameters are the processed parameters
 *  passed to the returned factory function. The callback should return the
 *  event to be added to the collection (could just return this).
 * @param {Function} [removeOnEmpty=false]
 *  Pass true here to remove events from the factory after their last handler is removed.
 *  They might be created again by the factory.
 * @return {Function}
 *  Returns a function that can take one or more index fields and return a Q.Event
 *  that was either already stored under those index fields or newly created.
 */
Q.Event.factory = function (collection, defaults, callback, removeOnEmpty) {
	collection = collection || {};
	defaults = defaults || [];
	function _remove() {
		var delimiter = "\t";
		var args = this.indexes.split(delimiter);
		var l = args.length, i, objs = [collection];
		for (i=0; i<l; ++i) {
			objs.push(objs[i][ args[i] ]);
		}
		for (i=l-1; i>=0; --i) {
			var arg = args[i];
			delete objs[i][arg];
			if (!Q.isEmpty(objs[i])) {
				break;
			}
		}
	}
	var _args;
	var _Q_Event_factory = function _Q_Event_factory_function() {
		var existing = _Q_Event_factory.ifAny.apply(this, arguments);
		if (existing) {
			return existing;
		}
		var delimiter = "\t";
		var name = _args.join(delimiter);
		var e = new Q.Event();
		e.factory = _Q_Event_factory;
		e.name = name;
		if (callback) {
			callback.apply(e, _args);
		}
		_Q_Event_factory.onNewEvent.handle.apply(e, _args);
		Q.setObject(name, e, collection, delimiter);
		if (removeOnEmpty) {
			e.onEmpty().set(_remove);
		}
		e.indexes = name;
		return e;
	};
	_Q_Event_factory.ifAny = function _Q_Event_factory_ifAny() {
		_args = Array.prototype.slice.call(arguments, 0);
		var len = defaults.length;
		var f = (typeof(defaults[len-1]) === 'function')
			? defaults[len-1] : null;
		if (f) --len;
		for (var i=_args.length; i<len; ++i) {
			_args[i] = defaults[i];
		}
		_args = (f && f.apply(this, _args)) || _args;
		var delimiter = "\t";
		var name = _args.join(delimiter);
		var existing = Q.getObject(name, collection, delimiter);
		return existing || null;
	};
	_Q_Event_factory.collection = collection;
	_Q_Event_factory.onNewEvent = new Q.Event();
	return _Q_Event_factory;
};

/**
 * @class Q
 */

/**
 * This event occurs right before Q javascript library is initialized
 * @event beforeInit
 */
Q.beforeInit = new Q.Event();
/**
 * This event occurs when Q javascript library has just been initialized
 * @event onInit
 */
Q.onInit = new Q.Event();
/**
 * This event tracks the window.onload event
 * @event onLoad
 */
Q.onLoad = new Q.Event();
/**
 * This event tracks the window.onunload event
 * @event onUnload
 */
Q.onUnload = new Q.Event();
/**
 * This event tracks the window.hashchange event
 * @event onHashChange
 */
Q.onHashChange = new Q.Event();
/**
 * This event tracks the window.popstate event
 * @event onPopState
 */
Q.onPopState = new Q.Event();
/**
 * This event tracks the window.ononline event, when browser goes online
 * @event onOnline
 */
Q.onOnline = new Q.Event(function () {
	_isOnline = true;
}, 'Q');
/**
 * This event tracks the window.onoffline event, when online connection is lost
 * @event onOffline
 */
Q.onOffline = new Q.Event(function () {
	_isOnline = false;
}, 'Q');
/**
 * This event occurs every time before something is activated
 * @event beforeActivate
 */
Q.beforeActivate = new Q.Event();
/**
 * This event occurs every time after something is activated
 * @event onActivate
 */
Q.onActivate = new Q.Event();
/**
 * This event occurs when the DOM is ready
 * @event onDOM
 */
Q.onDOM = new Q.Event();
/**
 * This event occurs when the DOM and entire environment is ready
 * @event onReady
 */
Q.onReady = new Q.Event();
var _layoutElements = [];
var _layoutEvents = [];
var _layoutObservers = [];
/**
 * Call this function to get an event which occurs every time
 * Q.layout() is called on the given element or one of its parents.
 * @param {Element} [element=document.documentElement] 
 * @return {Q.Event}
 */
Q.onLayout = function (element) {
	element = element || document.documentElement;
	if (Q.typeOf(element) === 'Q.Tool') {
		element = element.element;
	}
	for (var i=0, l=_layoutElements.length; i<l; ++i) {
		if (_layoutElements[i] === element) {
			return _layoutEvents[i];
		}
	}
	var lastRect = {};
	var event = new Q.Event();
	var debouncedEvent = event.debounce(
		Q.onLayout.debounce, false, 'Q.onLayout'
	).map(function () {
		var rect = element.getBoundingClientRect();
		var ret;
		if (rect.width == lastRect.width
		&& rect.height == lastRect.height) {
			ret = false;
		} else {
			ret = [this, arguments]; // element got resized
		}
		lastRect = rect;
		return ret;
	}, 'Q.onLayout');

	var l = _layoutElements.push(element);
	_layoutEvents[l-1] = debouncedEvent;

	// create ResizeObserver
	var observer = null;
	if (typeof root.ResizeObserver === 'function') {
		observer = new root.ResizeObserver(function () {
			event.handle.call(event, element, element);
		});
		observer.observe(element);
	}
	_layoutObservers[l-1] = observer;
	event.onEmpty().set(Q.debounce(function () {
		for (var i=0, l=_layoutElements.length; i<l; ++i) {
			if (_layoutElements[i] === element) {
				_layoutElements.splice(i, 1);
				_layoutEvents.splice(i, 1);
				if (Q.getObject('disconnect', _layoutObservers[i])) {
					_layoutObservers[i].disconnect();
				}
				_layoutObservers.splice(i, 1);
				break;
			}
		}
	}, Q.onLayout.debounce || 0), 'Q');
	return debouncedEvent;
}
Q.onLayout.debounce = 100;

/**
 * This event is convenient for doing stuff when the window scrolls
 * @event onLayout
 */
Q.onScroll = new Q.Event();

/**
 * This event occurs before replacing the contents of an element
 * @event beforeReplace
 */
Q.beforeReplace = new Q.Event();

/**
 * Gets information about the currently running script.
 * Only works when called synchronously when the script loads.
 * Returns script src without "?querystring"
 * @method currentScript
 * @static
 * @param {Number} [stackLevels=0] If called within a function
 *  that was called inside a script, put 1, if deeper put 2, etc.
 * @return {Object} object with properties "src", "path" and "file"
 */
Q.currentScript = function (stackLevels) {
	var src = window._Q_currentScript_src || Q.getObject('document.currentScript.src');
	if (!src) {
		var index = 0, lines, i, l;
		try {
			throw new Error();
		} catch (e) {
			lines = e.stack.split('\n');
		}
		for (i=0, l=lines.length; i<l; ++i) {
			if (lines[i].match(/http[s]?:\/\//)) {
				index = i + 1 + (stackLevels || 0);
				break;
			}
		}
		src = lines[index];
	}
	var parts = src.match(/((http[s]?:\/\/.+\/|file:\/\/\/.+\/)([^\/]+\.(?:js|html)[^:]*))/);
	return {
		src: parts[1].split('?')[0],
		srcWithQuerystring: parts[1],
		path: parts[2],
		file: parts[3]
	};
};

/**
 * Gets path of the currently running script.
 * Only works when called synchronously when the script loads.
 * @method currentScriptPath
 * @static
 * @param {String} [subpath] Anything to append after path + '/'
 * @param {Number} [stackLevels=0] If called within a function
 *  that was called inside a script, put 1, if deeper put 2, etc.
 * @return {Object} object with properties "src", "path" and "file"
 */
Q.currentScriptPath = function (subpath, stackLevels) {
	return Q.currentScript(stackLevels).src.split('/').slice(0, -1).join('/')
        + (subpath ? '/' + subpath : '');
};
var currentScriptPath = Q.currentScriptPath();

/**
 * Use this to ensure that a property exists before running some javascript code.
 * If something is undefined, loads a script or executes a function,
 * calling the callback on success.
 * The callback is called only after the Q.onInit event has executed, so functions
 * like Q.url() and Q.addScript can be expected to work properly.
 * See Q.ensure.loaders
 * @static
 * @method ensure
 * @param {String} property
 *  Path to the property to test whether Q.getObject() will return undefined.
 * @param {Function} callback
 *  The callback to call when the loader has been executed.
 *  The first parameter should be the property (object, string, etc.) that's now defined.
 *  This is where you would put the code that relies on the property being defined.
 */
Q.ensure = function _Q_ensure(property, callback) {
	var value = Q.getObject(property, root);
	if (value !== undefined) {
		Q.handle(callback, null, [value]);
		return;
	}
	var loader = Q.ensure.loaders[property];
	if (!loader) {
		throw new Q.Error("Q.ensure: missing loader for " + property);
	}
	Q.onInit.addOnce(function () {
		if (typeof loader === 'string') {
			if (loader.substring(loader.length-3) === '.js') {
				Q.require(loader, callback);
			} else if (loader.substring(loader.length-5) === '.json') {
				Q.request(loader, function (err, value) {
					Q.setObject(property, value);
					callback && callback(value);
				}, {
					extend: false,
					skipNonce: true
				})
			}
		} else if (typeof loader === 'function') {
			loader(property, callback);
		} else if (loader instanceof Q.Event) {
			loader.addOnce(function _loaded() {
				callback && callback(property);
			}, property);
		}
	});
};

/**
 * Specifies the ways to load certain properties using Q.ensure()
 * @property {Object} ensure.loaders
 *  Something to execute if the property was undefined and needs to be loaded.
 *  The key is the property. The value can be one of several things.
 *  If a string, this is interpreted as the URL of a javascript to load.
 *  If a function, this is called with the property and callback as arguments.
 *  If an event, the callback is added to it.
 *  The loader must call the callback and pass the property as the first parameter.
 */
Q.ensure.loaders = {
	'Handlebars': Q.currentScriptPath('handlebars-v4.0.10.min.js'),
	'Q.info.baseUrl': Q.onInit,
	'IntersectionObserver': function (property, callback) {
		if ('IntersectionObserver' in window
		&& 'IntersectionObserverEntry' in window
		&& 'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
			// Minimal polyfill for Edge 15's lack of `isIntersecting`
			// See: https://github.com/w3c/IntersectionObserver/issues/211
			if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
   				  Object.defineProperty(window.IntersectionObserverEntry.prototype,
   					  'isIntersecting', {
   						  get: function () {
   							  return this.intersectionRatio > 0;
   						  }
   					  }
   				  );
			}
			return callback && callback(property);
	 	}
		Q.addScript('{{Q}}/js/polyfills/IntersectionObserver.js', function () {
			callback && callback(property);
		});
	}
};

/**
 * Sets up control flows involving multiple callbacks and dependencies
 * Usage:
 * @example
 * var p = Q.pipe(['user', 'stream], function (params, subjects) {
 *   // arguments that were passed are in params.user, params.stream
 *   // this objects that were passed are in subjects.user, subjects.stream
 * });
 * mysql("SELECT * FROM user WHERE userId = 2", p.fill('user'));
 * mysql("SELECT * FROM stream WHERE publisherId = 2", p.fill('stream'));
 *
 * The first parameter to p.fill() is the name of the field to fill when it's called
 * You can pass a second parameter to p.fill, which can be either:
 * true - in this case, the current function is ignored during the next times through the pipe
 * a string - in this case, this name is considered unfilled the next times through this pipe
 * an array of strings - in this case, these names are considered unfilled the next times through the pipe
 * @class Q.Pipe
 * @constructor
 * @see {Pipe.prototype.add} for more info on the parameters
 */
Q.Pipe = function _Q_Pipe(requires, maxTimes, callback, internal) {
	if (this === Q) {
		throw new Q.Error("Q.Pipe: omitted keyword new");
	}
	this.callbacks = [];
	this.params = {};
	this.subjects = {};
	this.ignore = {};
	this.finished = false;
	this.add.apply(this, arguments);
	this.internal = internal;
	if (internal && internal.progress) {
		internal.progress(this);
	}
};

var Pp = Q.Pipe.prototype;

/**
 * Adds a callback to the pipe
 * @method on
 * @param field {String}
 *  Pass the name of a field to wait for, until it is filled, before calling the callback.
 * @param callback {Function}
 *  This function is called as soon as the field is filled, i.e. when the callback
 *  produced by pipe.fill(field) is finally called by someone.
 *  The "this" and arguments from that call are also passed to the callback.
 *  The callback receives the same "this" and arguments that the original call was made with.
 *  It is passed the "this" and arguments which are passed to the callback.
 *  If you return true from this function, it will delete all the callbacks in the pipe.
 * @chainable
 */
Pp.on = function _Q_pipe_on(field, callback) {
	return this.add([field], 1, function _Q_pipe_on_callback (params, subjects, field) {
		return callback.apply(subjects[field], params[field], field);
	});
};

/**
 * Adds a callback to the pipe with more flexibility
 * @method add
 * @param {Array} requires
 *  Optional. Pass an array of required field names here.
 *  Alternatively, pass an array of objects, which should be followed by
 *  the name of a Q.Event to wait for.
 * @param {number} [maxTimes]
 *  Optional. The maximum number of times the callback should be called.
 * @param {Function} callback
 *  Once all required fields are filled, this function is called every time something is piped.
 *  It is passed four arguments: (params, subjects, field, requires)
 *  If you return false from this function, it will no longer be called for future pipe runs.
 *  If you return true from this function, it will delete all the callbacks in the pipe.
 * @return {Q.Pipe}
 * @chainable
 */
Pp.add = function _Q_pipe_add(requires, maxTimes, callback) {
	var r = null, n = null, e = null, r2, events, keys;
	for (var i=0; i<arguments.length; i++) {
		var ai = arguments[i];
		if (typeof ai === 'function') {
			if (e) {
				r2 = [];
				events = [];
				keys = [];
				var pipe = this;
				Q.each(r, function (k, item) {
					var event = Q.getObject(e, item);
					if (Q.typeOf(event) === 'Q.Event') {
						keys.push(event.add(pipe.fill(k)));
						r2.push(k);
						events.push(event);
					}
				});
				ai.pipeEvents = events;
				ai.pipeKeys = keys;
				r = r2;
			}
			ai.pipeRequires = r;
			ai.pipeRemaining = n;
			r = n = e = null;
			this.callbacks.push(ai);
		} else {
			switch (Q.typeOf(ai)) {
			case 'array':
				r = ai;
				if (r.length
				&& typeof r[0] !== 'string'
				&& typeof r[0] !== 'number') {
					e = arguments[++i];
				}
				break;
			case 'object':
				r = ai;
				e = arguments[++i];
				break;
			case 'number':
				n = ai;
				break;
			default:
				break;
			}
			if (e != null && typeof e !== 'string') {
				throw new Q.Error("Pipe.prototype.add requires event name after array of objects");
			}
		}
	}
	return this;
};

/**
 * Makes a function that fills a particular field in the pipe and can be used as a callback
 * @method fill
 * @param field {String}
 *   For error callbacks, you can use field="error" or field="users.error" for example.
 * @param ignore
 *   Optional. If true, then ignores the current field in subsequent pipe runs.
 *   Or pass the name (string) or names (array) of the field(s) to ignore in subsequent pipe runs.
 * @return {Function} Returns a callback you can pass to other functions.
 */
Pp.fill = function _Q_pipe_fill(field, ignore) {
	if (ignore === true) {
		this.ignore[this.i] = true;
	} else if (typeof ignore === 'string') {
		this.ignore[ignore] = true;
	} else if (Q.isArrayLike(ignore)) {
		for (var i=0; i<ignore.length; ++i) {
			this.ignore[ignore[i]] = true;
		}
	}

	var pipe = this;

	return function _Q_pipe_fill() {
		if (pipe.internal && pipe.internal.progress) {
			pipe.internal.progress(pipe, field);
		}
		pipe.params[field] = Array.prototype.slice.call(arguments);
		pipe.subjects[field] = this;
		pipe.run(field);
	};
};

/**
 * Runs the pipe
 * @method run
 * @param field {String} optionally indicate name of the field that was just filled
 * @return {number} the number of pipe callbacks that wound up running
 */
Pp.run = function _Q_pipe_run(field) {
	var cb, ret, callbacks = this.callbacks, params = Q.copy(this.params), count = 0;
	var i, j;

	cbloop:
	for (i=0; i<callbacks.length; i++) {
		if (this.ignore[i]) {
			continue;
		}
		this.i = i;
		if (!(cb = callbacks[i]))
			continue;
		if (cb.pipeRequires) {
			for (j=0; j<cb.pipeRequires.length; j++) {
				if (this.ignore[cb.pipeRequires[j]]) {
					continue;
				}
				if (! (cb.pipeRequires[j] in params)) {
					continue cbloop;
				}
			}
		}
		if (cb.pipeRemaining) {
			if (!--cb.pipeRemaining) {
				delete callbacks[i];
			}
		}
		ret = cb.call(this, this.params, this.subjects, field, cb.pipeRequires);
		if (cb.pipeEvents) {
			for (j=0; j<cb.pipeEvents.length; j++) {
				cb.pipeEvents[j].remove(cb.pipeKeys[j]);
			}
		}
		++count;
		delete cb.pipeEvents;
		delete cb.pipeKeys;
		if (ret === false) {
			delete callbacks[i];
		} else if (ret === true) {
			this.callbacks = []; // clean up memory
			this.finished = true;
			break;
		}
	}
	return count;
};


/**
 * @class Q
 */

/**
 * A convenience method for constructing Q.Pipe objects
 * and is really here just for backward compatibility.
 * @static
 * @method pipe
 * @return {Q.Pipe}
 * @see Q.Pipe
 */
Q.pipe = function _Q_pipe(a, b, c, d) {
	return new Q.Pipe(a, b, c, d);
};

// Minimal Q.Cache implementation (much more limited than in Q.js)
Q.Cache = Q.Cache || {};

/**
 * Generates the key under which things will be stored in a cache
 * @static
 * @method key
 * @param  {Array|String} args the arguments from which to generate the key
 * @param {Array} functions  optional array to which all the functions found in the arguments will be pushed
 * @return {String}
 */
Q.Cache.key = function _Cache_key(args, functions) {
	var i, keys = [];
	if (!Q.isArrayLike(args)) {
		return args;
	}

	for (i=0; i<args.length; ++i) {
		if (typeof(args[i]) === 'function') {
			if (functions && functions.push) {
				functions.push(args[i]);
			}
		} else if (typeof args[i] !== 'object' || Q.isPlainObject(args[i]) || args[i] instanceof Array) {
			keys.push(args[i]);
		}
	}
	return JSON.stringify(keys);
};

Q.Cache.Memory = function (name, maxItems) {
	this._name = name || 'mem';
	this._max = (typeof maxItems === 'number' && maxItems >= 1) ? maxItems : 100;
	this._map = {};   // key -> { subject, params:Array, cbpos:Number, ts:Number }
	this._keys = [];  // list of keys for random eviction
};
Q.Cache.Memory.prototype.get = function (args) {
	var key = Q.Cache.key(args);
	return this._map.hasOwnProperty(key) ? this._map[key] : null;
};

Q.Cache.Memory.prototype.set = function (args, cbpos, subject, params) {
	var key = Q.Cache.key(args);
	if (!this._map.hasOwnProperty(key)) {
		this._keys.push(key);
		if (this._keys.length > this._max) {
			var idx = Math.floor(Math.random() * this._keys.length);
			var evictKey = this._keys[idx];
			this._keys.splice(idx, 1);
			delete this._map[evictKey];
		}
	}
	this._map[key] = {
		subject: subject,
		params: Array.prototype.slice.call(params),
		cbpos: cbpos,
		ts: Date.now()
	};
	return true;
};

Q.Cache.Memory.prototype.remove = function (args) {
	var key = Q.Cache.key(args);
	if (this._map.hasOwnProperty(key)) {
		delete this._map[key];
		var i = this._keys.indexOf(key);
		if (i !== -1) this._keys.splice(i, 1);
		return true;
	}
	return false;
};

Q.Cache.Memory.prototype.each = function (args, fn, options) {
	// Normalize args
	options = options || { throwIfNoIndex: false };

	if (!args || args.length === 0) {
		// If no args provided, iterate over all keys in the cache
		for (var i = 0; i < this._keys.length; i++) {
			var key = this._keys[i];
			fn.call(this, key, this._map[key]);
		}
		return;
	}

	// If args are provided, generate prefix key and match
	var prefix = JSON.stringify(args);
	for (var i = 0; i < this._keys.length; i++) {
		var key = this._keys[i];
		// key is a JSON string array (like '["foo","bar"]')
		if (key.indexOf(prefix) === 0) {
			fn.call(this, key, this._map[key]);
		}
	}
};

Q.Cache.Memory.prototype.removeEach = function _Q_Cache_prototype_each(args, options) {
	options = options || { throwIfNoIndex: false };
	this.each(args, function (key) {
		this.remove(JSON.parse(key));
	}, options);
	return this;
};

Q.Cache.Memory.prototype.clear = function () {
	this._map = {};
	this._keys = [];
};

Q.Cache.document = function (name, maxItems) {
	return new Q.Cache.Memory(name, maxItems);
};

/**
 * Wraps a getter function to provide support for re-entrancy, cache and throttling.
 *  It caches based on all non-function arguments which were passed to the function.
 *  All functions passed in as arguments are considered as callbacks. Getter execution is
 *  considered complete when one of the callbacks is fired. If any other callback is fired,
 *  throttling may be influenced - i.e. throttleSize will increase by number of callbacks fired.
 *  If the original function has a "batch" property, it gets copied as a property of
 *  the wrapper function being returned. This is useful when calling Q.getter(Q.batcher(...))
 *  Call method .forget with the same arguments as original getter to clear cache record
 *  and update it on next call to getter (if it happen)
 * @static
 * @method getter
 * @param {Function} original
 *  The original getter function to be wrapped
 *  Can also be an array of [getter, execute] which you can use if
 *  your getter does "batching", and waits a tiny bit before sending the batch request,
 *  to see if any more will be requested. In this case, the execute function
 *  is supposed to execute the batched request without waiting any more.
 *  If the original function returns false, the caching is canceled for that call.
 * @param {Object} [options={}] An optional hash of possible options, which include:
 * @param {Function} [options.prepare] This is a function that is run to copy-construct objects from cached data.
 *  It gets (subject, parameters, callback) and is supposed to call callback(subject2, parameters2)
 *  This function can also set up auxiliary data structures in the web environment.
 * @param {Boolean} [options.dontWarn] Don't warn on errors in prepare() handler
 * @param {String} [options.throttle] an id to throttle on, or an Object that supports the throttle interface:
 * @param {Function} [options.throttleTry] function(subject, getter, args) - applies or throttles getter with subject, args
 * @param {Function} [options.throttleNext] function (subject) - applies next getter with subject
 * @param {Integer} [options.throttleSize=100] The size of the throttle, if it is enabled
 * @param {Boolean} [options.nonStandardErrorConvention=false] Pass true here if the callback parameters don't work with Q.firstErrorMessage() conventions
 * @param {Number} [callbackIndex] use this to explicitly specify which argument number is expecting a callback function
 * @param {Q.Cache|Boolean} [options.cache] pass false here to prevent caching, or an object which supports the Q.Cache interface
 *  By default, it will set up a cache in the loaded webpage with default parameters.
 *  You can use functions Q.Cache.document, Q.Cache.local and Q.Cache.session
 *  to create new caches, but please cache a limited maximum number of limited-size items,
 *  since the local and session storage can only handle up to 5MB on some browsers!
 * @return {Function}
 *  The wrapper function, which returns a Q.Promise with a property called "result"
 *  which could be one of Q.getter.CACHED, Q.getter.REQUESTING, Q.getter.WAITING or Q.getter.THROTTLING .
 *  After calling callbacks, the promise resolves with the "this" object returned in the getter, or rejects on any errors.
 *  This wrapper function also contains Q.Events called onCalled, onResult and onExecuted.
 */
Q.getter = function _Q_getter(original, options) {

	var gw = function Q_getter_wrapper() {
		var i, key, callbacks = [];
		var arguments2 = Array.prototype.slice.call(arguments);

		var _resolve, _reject;
		var ret = new Q.Promise(function (resolve, reject) {
			_resolve = resolve;
			_reject = reject;
		});

		// separate fields and callbacks
		key = Q.Cache.key(arguments2, callbacks);
		if (callbacks.length === 0) {
			// in case someone forgot to pass a callback
			// pretend they added a callback at the end
			function _promiseCallback(err, obj) {
				var error = !gw.nonStandardErrorConvention
					&& Q.firstErrorMessage(err, obj);
				if (error) {
					_reject(error);
				} else {
					_resolve(this !== undefined ? this : obj);
				}
			};
			callbacks.push(_promiseCallback);
			if (gw.callbackIndex !== undefined) {
				arguments2.splice(gw.callbackIndex, 0, _promiseCallback);
			} else {
				arguments2.push(_promiseCallback);
			}
		}
	
		ret.dontCache = false;
		gw.onCalled.handle.call(this, arguments2, ret);

		var cached, cbpos, cbi;
		Q.getter.usingCached = false;
		
		function _prepare(subject, params, callback, ret, cached) {
			if (gw.prepare) {
				gw.prepare.call(gw, subject, params, _result, arguments2);
			} else {
				_result(subject, params);
			}
			function _result(subject, params) {
				gw.onResult.handle(subject, params, arguments2, ret, gw);
				Q.getter.usingCached = cached;
				callback.apply(subject, params); // may throw
				gw.onExecuted.handle(subject, params, arguments2, ret, gw);
				Q.getter.usingCached = false;
			}
		}

		// if caching is required, check the cache -- maybe the result is there
		if (gw.cache && !ignoreCache) {
			if (cached = gw.cache.get(arguments2)) {
				cbpos = cached.cbpos;
				if (callbacks[cbpos]) {
					_prepare(cached.subject, cached.params, callbacks[cbpos], ret, true);
					ret.result = Q.getter.CACHED;
					return ret; // wrapper found in cache, callback and throttling have run
				}
			}
		}
		ignoreCache = false;

		_waiting[key] = _waiting[key] || [];
		_waiting[key].push({
			callbacks: callbacks,
			ret: ret
		});
		if (_waiting[key].length > 1) {
			gw.onExecuted.handle.call(this, arguments2, ret);
			ret.result = Q.getter.WAITING;
			return ret; // the request is already in process - let's wait
		}

		// replace the callbacks with smarter functions
		var args = [];
		for (i=0, cbi=0; i<arguments2.length; i++) {
			// we only care about functions
			if (typeof arguments2[i] !== 'function') {
				args.push(arguments2[i]); // regular argument
				continue;
			}
			args.push((function(cb, cbpos) {
				// make a function specifically to call the
				// callbacks in position pos, and then decrement
				// the throttle
				return function _Q_getter_callback() {
					if (!gw.nonStandardErrorConvention && Q.firstErrorMessage(arguments[0], arguments[1])) {
						ret.dontCache = true;
					}
					// save the results in the cache
					if (gw.cache && !ret.dontCache) {
						gw.cache.set(arguments2, cbpos, this, arguments);
					}
					// process waiting callbacks
					var wk = _waiting[key];
					delete _waiting[key];
					if (wk) {
						for (i = 0; i < wk.length; i++) {
							try {
								_prepare(this, arguments, wk[i].callbacks[cbpos], wk[i].ret, true);
							} catch (e) {
								if (!gw.dontWarn) {
									console.warn(e);
								}
							}
						}
					}
					// tell throttle to execute the next function, if any
					if (gw.throttle && gw.throttle.throttleNext) {
						gw.throttle.throttleNext(this);
					}
				};
			})(callbacks[cbi], cbi));
			++cbi; // the index in the array of callbacks
		}

		if (!gw.throttle) {
			// no throttling, just run the function
			if (false === original.apply(this, args)) {
				ret.dontCache = true;
			}
			ret.result = Q.getter.REQUESTING;
			gw.onExecuted.handle.call(this, arguments2, ret);
			return ret;
		}

		if (!gw.throttle.throttleTry) {
			// the throttle object is probably not set up yet
			// so set it up
			var p = {
				size: gw.throttleSize,
				count: 0,
				queue: [],
				args: []
			};
			gw.throttle.throttleTry = function _throttleTry(that, getter, args, ret) {
				++p.count;
				if (p.size === null || p.count <= p.size) {
					if (false === getter.apply(that, args)) {
						ret.dontCache = true;
					}
					return true;
				}
				// throttle is full, so queue this function
				p.queue.push(getter);
				p.args.push(args);
				return false;
			};
			gw.throttle.throttleNext = function _throttleNext(that) {
				if (--p.count < 0) {
					console.warn("Q.getter: throttle count is negative. This probably means you passed a callback somewhere it shouldn't have been passed.");
				}
				if (p.queue.length) {
					p.queue.shift().apply(that, p.args.shift());
				}
			};
		}
		if (!gw.throttleSize) {
			gw.throttle.throttleSize = function _throttleSize(newSize) {
				if (newSize === undefined) {
					return p.size;
				}
				p.size = newSize;
			};
		}

		// execute the throttle
		ret.result = gw.throttle.throttleTry(this, original, args, ret)
			? Q.getter.REQUESTING
			: Q.getter.THROTTLING;
		gw.onExecuted.handle.call(this, arguments2, ret);
		return ret;
	}

	Q.extend(gw, original, Q.getter.options, options);
	gw.original = original;
	gw.onCalled = new Q.Event();
	gw.onExecuted = new Q.Event();
	gw.onResult = new Q.Event();

	gw.all = function (arrayOfArguments, callback, useIndexes) {
		var keys = [], argsArray = [];
		for (var i=0, l=arrayOfArguments.length; i<l; ++i) {
			var args = arrayOfArguments[i];
			keys.push(useIndexes ? i : Q.Cache.key(args));
			if (!(args instanceof Array)) {
				args = [args];
			}
			argsArray.push(args);
		}
		var pipe = Q.pipe(keys, 1, function (params, subjects) {
			Q.handle(callback, this, [params, subjects, arrayOfArguments]);
		});
		for (i=0, l=keys.length; i < l; ++i) {
			argsArray[i].push(pipe.fill(keys[i]));
			gw.apply(this, argsArray[i]);
		}
		pipe.run();
	};

	var _waiting = {};
	if (gw.cache === false) {
		// no cache
		gw.cache = null;
	} else if (gw.cache === true || gw.cache === undefined) {
		// create our own Object that will cache locally in the page
		gw.cache = Q.Cache.document('Q_getter_' + (++_Q_getter_i));
	} else if (gw.cache && (!gw.cache.get || !gw.cache.set || !gw.cache.clear)) {
		gw.cache = Q.Cache.document('Q_getter_' + (++_Q_getter_i), options && options.cache);
	} // else assume we were passed an Object that supports the cache interface

	gw.throttle = gw.throttle || null;
	if (gw.throttle === true) {
		gw.throttle = '';
	}
	if (typeof gw.throttle === 'string') {
		// use our own objects
		if (!Q.getter.throttles[gw.throttle]) {
			Q.getter.throttles[gw.throttle] = {};
		}
		gw.throttle = Q.getter.throttles[gw.throttle];
	}

	gw.forget = function _forget() {
		if (!gw.cache) {
			return false;
		}
		return gw.cache.remove(Array.prototype.slice.call(arguments));
	};

	gw.forget.each = function _forget_each() {
		if (!gw.cache) {
			return false;
		}
		var args = Array.prototype.slice.call(arguments);
		gw.cache.each(args, gw.cache.remove);
		return true;
	};
	
	var ignoreCache = false;
	gw.force = function _force() {
		var key = Q.Cache.key(arguments);
		_waiting[key] = [];
		ignoreCache = true;
		return gw.apply(this, arguments);
	};

	if (original.batch) {
		gw.batch = original.batch;
	}
	return gw;
};
var _Q_getter_i = 0;
Q.getter.options = {
	cache: true,
	throttle: null,
	throttleSize: 100
};
Q.getter.throttles = {};
Q.getter.cache = {};
Q.getter.waiting = {};
Q.getter.CACHED = 0;
Q.getter.REQUESTING = 1;
Q.getter.WAITING = 2;
Q.getter.THROTTLING = 3;

/**
 * Custom exception constructor
 * @class Q.Exception
 * @constructor
 * @param {String} [message=""] The error message
 * @param {Object} fields={} Any additional fields to set on the error
 */
Q.Exception = function (message, fields) {
	if (fields) {
		for (var k in fields) {
			this[k] = fields[k];
		}
	}
	this.message = message || "";
};

Q.Exception.prototype = Error.prototype;

/**
 * The root mixin added to all tools.
 * @class Q.Tool
 * @constructor
 * @param {HTMLElement} [element] the element to activate into a tool
 * @param {Object} [options={}] an optional set of options that may contain ".Tool_name or #Some_exact_tool or #Some_child_tool"
 * @return {Q.Tool} if this tool is replacing an earlier one, returns existing tool that was removed.
 *	 Otherwise returns null, or false if the tool was already constructed.
 */
Q.Tool = function _Q_Tool(element, options) {
	if (this.activated) {
		return this; // don't construct the same tool more than once
	}
	this.activated = true;
	this.element = element;
	this.typename = 'Q.Tool';
	
	if (options === true) {
		options = {};
	}

	// ID and prefix
	if (!this.element.id) {
		var prefix = Q.Tool.beingActivated ? Q.Tool.beingActivated.prefix : '';
		if (!prefix) {
			var e = this.element.parentElement;
			do {
				if (e.hasClass && e.hasClass('Q_tool')) {
					prefix = Q.getObject('Q.tool.prefix', e)
						|| Q.Tool.calculatePrefix(e.id);
					break;
				}
			} while (e = e.parentElement);
		}
		var name = Q.Tool.names[this.name] || this.name.toCapitalized();
		this.element.id = prefix + name.split('/').join('_')
			+ '-' + (Q.Tool.nextDefaultId++) + "_tool";
		Q.Tool.nextDefaultId %= 1000000;
	}
	this.prefix = Q.Tool.calculatePrefix(this.element.id);
	this.id = this.prefix.substring(0, this.prefix.length-1);

	var activeTool = null;
	if (activeTool = Q.Tool.byId(this.id, this.name)) {
		var toolName = Q.Tool.names[this.name];
		var errMsg = "A " + toolName + " tool with id " + this.id + " is already active";
		//throw new Q.Error(errMsg);
		console.warn(errMsg, activeTool);
	}

	// for later use
	var classes = (this.element.className && this.element.className.split(/\s+/) || []);
	var key = Q.calculateKey(this);

	// options from data attribute
	var dataOptions = element.getAttribute('data-' + Q.normalize(this.name, '-'));
	if (dataOptions) {
		var parsed = null;
		if (dataOptions[0] === '{') {
			parsed = JSON.parse(dataOptions);
		} else {
			var ios = dataOptions.indexOf(' ');
			this.id = dataOptions.substring(0, ios);
			var tail = dataOptions.substring(ios+1);
			parsed = tail && JSON.parse(tail);
		}
		if (parsed) {
			Q.extend(this.options, Q.Tool.options.levels, parsed, key);
		}
	}

	// options cascade -- process option keys that start with '.' or '#'
	var partial, i, k, l, a, n;
	options = options || {};
	this.options = this.options || {};
	
	// collect options from parent ids, inner overrides outer
	var normalizedName = Q.normalize.memoized(this.name);
	var pids = this.parentIds();
	var len = pids.length;
	var o = len ? Q.extend({}, Q.Tool.options.levels, options) : options;
	for (i = len-1; i >= 0; --i) {
		var pid = pids[i];
		if (!(a = Q.Tool.active[pid])) {
			continue;
		}
		for (n in a) {
			for (k in a[n].state) {
				if (k[0] === '.' || k[0] === '#') {
					o[k] = Q.extend(o[k], Q.Tool.options.levels, a[n].state[k]);
				}
			}
		}
	}
	
	// .Q_something
	for (i = 0, l = classes.length; i < l; i++) {
		var className = classes[i];
		var cn = Q.normalize.memoized(className.substring(0, className.length-5));
		partial = o['.' + className];
		if (partial && (className.substring(className.length-5) !== '_tool' || cn === this.name)) {
			Q.extend(this.options, Q.Tool.options.levels, partial, key);
		}
	}
	// #Q_parent_child_tool
	if ((partial = o['#' + this.element.id])) {
		Q.extend(this.options, Q.Tool.options.levels, partial, key);
		for (k in o) {
			if (k.startsWith('#' + this.prefix)) {
				this.options[k] = o[k];
			}
		}
	}
	// #parent_child_tool, #child_tool
	var _idcomps = this.element.id.split('_');
	for (i = 0; i < _idcomps.length-1; ++i) {
		if ((partial = o['#' + _idcomps.slice(i).join('_')])) {
			Q.extend(this.options, Q.Tool.options.levels, partial, key);
		}
	}

	// get options from options property on element
	var eo = element.options;
	if (eo && eo[normalizedName]) {
		Q.extend(this.options, Q.Tool.options.levels, eo[normalizedName], key);
	}
	
	// override prototype Q function on the element to associate things with it
	if (element.Q === Element.prototype.Q) {
		element.Q = function (toolName) {
			if (!toolName) {
				return (this.Q.tool || null);
			}
			return this.Q.tools[Q.normalize.memoized(toolName)] || null;
		};
	}
	
	if (!element.Q.tools) element.Q.tools = {};
	if (!element.Q.toolNames) element.Q.toolNames = [];
	element.Q.toolNames.push(normalizedName);
	element.Q.tools[normalizedName] = this;
	if (!element.Q.tool) {
		element.Q.tool = this;
	}
	Q.setObject([this.id, this.name], this, Q.Tool.active);
	
	// Add a Q property on the object and extend it with the prototype.Q if any
	this.Q = Q.extend({
		/**
		 * Q.Event which occurs when the tool was constructed
		 * @event onConstruct
		 */
		onConstruct: new Q.Event(),
		/**
		 * Q.Event which occurs when the tool was initialized
		 * @event onInit
		 */
		onInit: new Q.Event(),
		/**
		 * Q.Event which occurs when the tool was removed
		 * @event onRemove
		 */
		beforeRemove: new Q.Event(),
		/**
		 * Q.Event which occurs when the tool was retained while replacing some HTML
		 * @event onRetain
		 */
		onRetain: new Q.Event(),
		/**
		 * Returns Q.Event which occurs when some fields in the tool's state changed
		 * @event onStateChanged
		 * @param name {String} The name of the field. Can be "" to listen on all fields.
		 */
		onStateChanged: new Q.Event.factory({}, "")
	}, this.Q);
	
	return this;
};

Q.Tool.options = {
	levels: 10
};

Q.Tool.active = {};
Q.Tool.names = {};

var _constructToolHandlers = {};
var _activateToolHandlers = {};
var _initToolHandlers = {};
var _beforeRemoveToolHandlers = {};
var _waitingParentStack = [];
var _pendingParentStack = [];
var _toolsToInit = {};
var _toolsWaitingForInit = {};

function _toolEventFactoryNormalizeKey(key) {
	return [key.substring(0, 3) === 'id:' ? key : Q.normalize.memoized(key)];
}

/**
 * Returns Q.Event which occurs when a tool has been constructed, but not yet activated
 * Generic callbacks can be assigned by setting toolName to ""
 * @class Q.Tool
 * @event onConstruct
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.onConstruct = Q.Event.factory(_constructToolHandlers, ["", _toolEventFactoryNormalizeKey]);

/**
 * Returns Q.Event which occurs when a tool has been activated
 * Generic callbacks can be assigned by setting toolName to ""
 * @class Q.Tool
 * @event onActivate
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.onActivate = Q.Event.factory(_activateToolHandlers, ["", _toolEventFactoryNormalizeKey], null, true);

/**
 * Returns Q.Event which occurs when a tool has been initialized
 * Generic callbacks can be assigned by setting toolName to ""
 * @event onInit
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.onInit = Q.Event.factory(_initToolHandlers, ["", _toolEventFactoryNormalizeKey], null, true);

/**
 * Returns Q.Event which occurs when a tool is about to be removed
 * Generic callbacks can be assigned by setting toolName to ""
 * @event beforeRemove
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.beforeRemove = Q.Event.factory(_beforeRemoveToolHandlers, ["", _toolEventFactoryNormalizeKey], null, true);

/**
 * Traverses elements in a particular container, including the container itself,
 * and removes + destroys all tools.
 * Should be called before removing elements.
 * @static
 * @method remove
 * @param {HTMLElement} elem
 *  The container to traverse
 * @param {boolean} removeCached
 *  Defaults to false. Whether the tools whose containing elements have the "data-Q-retain" attribute
 *  should be removed.
 * @param {boolean} [removeElementAfterLastTool=false]
 *  If true, removes the element if the last tool on it was removed
 * @param {String|Function} [filter]
 *  This is a string that would match the tool name exactly (after normalization) to remove it,
 *  or a function that will take a tool name and return a boolean, false means don't remove tool.
 */
Q.Tool.remove = function _Q_Tool_remove(elem, removeCached, removeElementAfterLastTool, filter) {
	if (typeof elem === 'string') {
		var tool = Q.Tool.byId(elem);
		if (!tool) return false;
		elem = tool.element;
	}
	if (typeof filter === 'string') {
		filter = Q.normalize.memoized(filter);
	}
	Q.find(elem, true, null, function _Q_Tool_remove_found(toolElement) {
		var tn = toolElement.Q.toolNames;
		if (!tn) { // this edge case happens very rarely, usually if a slot element
			return; // being replaced is inside another slot element being replaced
		}
		for (var i=tn.length-1; i>=0; --i) {
			if (typeof filter === 'string') {
				if (tn[i] !== filter) {
					continue;
				}
			} else if (typeof filter === 'function') {
				if (!filter(tn[i])) {
					continue;
				}
			}
			if (Q.typeOf(Q.getObject(["Q", "tools", tn[i], "remove"], toolElement)) !== "function") {
				continue;
			}
			toolElement.Q.tools[tn[i]].remove(removeCached, removeElementAfterLastTool);
		}
	});
};

/**
 * Traverses children in a particular container and removes + destroys all tools.
 * Should be called before removing elements.
 * @static
 * @method clear
 * @param {HTMLElement} elem 
 *  The container to traverse
 * @param {boolean} removeCached
 *  Defaults to false. Whether the tools whose containing elements have the "data-Q-retain" attribute
 *  should be removed.
 * @param {boolean} [removeElementAfterLastTool=false]
 *  If true, removes the element if the last tool on it was removed
 * @param {String|Function} [filter]
 *  This is a string that would match the tool name exactly (after normalization) to remove it,
 *  or a function that will take a tool name and return a boolean, false means don't remove tool.
 */
Q.Tool.clear = function _Q_Tool_clear(elem, removeCached, removeElementAfterLastTool, filter) {
	if (!elem) {
		return;
	}
	if (typeof elem === 'string') {
		var tool = Q.Tool.byId(elem);
		if (!tool) return false;
		elem = tool.element;
	}
	Q.Tool.remove(elem.children || elem.childNodes, removeCached, removeElementAfterLastTool, filter);
};

/**
 * Call this function to define a tool
 * @static
 * @method define
 * @param {String|Object} name The name of the tool, e.g. "Q/foo".
 *   Also you can pass an object containing {name: filename} pairs instead.
 * @param {String|Array} [require] Optionally name another tool (or array of tool names) that was supposed to already have been defined. This will cause your tool's constructor to make sure the required tool has been already loaded and activated on the same element.
 * @param {Object|Function} ctor Your tool's constructor information. You can also pass a filename here, in which case the other parameters are ignored.
 *   If you pass a function, then it will be used as a constructor for the tool. You can also pass an object with the following properties
 * @param {String} [ctor.js] filenames containing Javascript to load for the tool
 * @param {String} [ctor.css] filenames containing CSS to load for the tool, which will be namespaced
 * @param {String} [ctor.html] filenames containing HTML to load for the tool, including templates
 * @param {String|ArrayBufferConstructor} [ctor.text] list any text files to load (for the current language) before the tool constructor.
 *   Also looks for any text files added with Q.Text.forTools(namePrefix, textFileNames)
 * @param {Object} [ctor.placeholder] what to render before the tool is loaded and rendered instead
 * @param {String} [ctor.placeholder.html] literal HTML to insert
 * @param {String} [ctor.placeholder.template] the name of a template to insert
 * @param {Object} [defaultOptions] An optional hash of default options for the tool
 * @param {Array} [stateKeys] An optional array of key names to copy from options to state
 * @param {Object} [methods] An optional hash of method functions to assign to the prototype
 * @param {Boolean} [overwrite] Pass true here to overwrite the tool definition even if a constructor function was already loaded
 * @return {Function} The tool's constructor function
 */
Q.Tool.define = function (name, /* require, */ ctor, defaultOptions, stateKeys, methods, overwrite) {
	var ctors = {};
	if (typeof name === 'object') {
		ctors = name;
	} else {
		if (typeof arguments[1] !== 'function' && typeof arguments[2] === 'function') {
			var require = arguments[1];
			ctor = arguments[2];
			defaultOptions = arguments[3];
			stateKeys = arguments[4];
			methods = arguments[5];
			overwrite = arguments[6];
			if (typeof require === 'string') {
				require = [require];
			}
			ctor.require = require;
		}
		ctors[name] = ctor;
	}
	Q.each(ctors, function (name, ctor) {
		var n = Q.normalize.memoized(name); 
		if (!overwrite && typeof _qtc[n] === 'function') {
			return;
		}
		if (ctor == null) {
			ctor = function _Q_Tool_default_constructor() {
				// this constructor is just a stub and does nothing
			};
		}
		Q.Tool.names[n] = name;
		if (typeof ctor === 'string' || Q.isPlainObject(ctor)) {
			if (typeof _qtc[n] !== 'function') {
				_qtdo[n] = _qtdo[n] || {};
				_qtc[n] = ctor;
				if (ctor.placeholder) {
					_qtp[n] = ctor.placeholder;
				}
			}
			return;
		}
		ctor.toolName = n;
		if (!Q.isArrayLike(stateKeys)) {
			methods = stateKeys;
			stateKeys = undefined;
		}
		ctor.options = Q.extend(
			defaultOptions, Q.Tool.options.levels, _qtdo[n]
		);
		ctor.stateKeys = stateKeys;
		if (typeof ctor !== 'function') {
			throw new Q.Error("Q.Tool.define requires ctor to be a string or a function");
		}
		for (var k in ctor.options) {
			var v = ctor.options[k];
			if (Q.typeOf(v) === 'Q.Event') {
				v.type = k;
			}
		}

		var c = _qtc[n] || {};
		if (typeof c === 'string') {
			if (c.split('.').pop() === 'js') {
				c = { js: c };
			} else {
				c = { html: c };
			}
		}
		_qtc[n] = ctor;
		Q.Text.addedFor('Q.Tool.define', n, c);

		if (typeof ctor !== 'function') {
			return;
		}

		Q.extend(ctor.prototype, 10, methods);
		Q.onInit.addOnce(function () {
			var waitFor = [];
			var p = new Q.Pipe();
			if (c.text) {
				waitFor.push('text');
				Q.Text.get(c.text, p.fill('text'));
			}
			if (c.css) {
				var slotName = name.split('/')[0];
				waitFor.push('css');
				Q.addStylesheet(c.css, null, p.fill('css'), {slotName: slotName});
			}
			p.add(waitFor, 1, function (params) {
				if (params && params.text && params.text[1]) {
					ctor.text = params.text[1];
				}
				Q.Tool.onLoadedConstructor(ctor.toolName).handle(ctor.toolName, ctor);
				Q.Tool.onLoadedConstructor("").handle(ctor.toolName, ctor);
			}).run();
		});
	});
	return ctor;
};

/**
 * A shorthand way to define multiple tools, by a name pattern RegExp,
 * and use it to specify default names of js, css, etc. files for the tools.
 * 
 * @param {String|RegExp} regexp For example "{{First}}/(.*)". The pattern should contain a capture group.
 * @param {Object} defaults For example {js: "{{First}}/js/$1.js", css: "{{First}}/css/$1.css"}
 * @param {Object} tools Keys are tool names and values are {} or { overrides here } to extend defaults.
 * @return {Object} pairs of { toolName: defined }
 */
Q.Tool.define.pattern = function (regexp, defaults, tools) {
	if (typeof regexp === 'string') {
		regexp = new RegExp(regexp);
	}
	if (!defaults || !tools) {
		return;
	}
	var defined = {};
	for (var toolName in tools) {
		var match = toolName.match(regexp);
		if (!match) {
			console.warn("Q.Tool.define.pattern: doesn't match tool name " + toolName);
			continue;
		}
		var info = {};
		for (var k in defaults) {
			info[k] = toolName.replace(regexp, defaults[k])
		}
		defined[toolName] = Q.Tool.define(toolName, Q.extend(info, tools[toolName]));
	}
	return defined;
};

Q.Tool.beingActivated = undefined;

/**
 * Call this to find out if a tool was defined (but maybe not loaded).
 * 
 * @static
 * @method defined
 * @param {String} toolName the name of the tool
 * @return {Function|String|undefined} the tool constuctor's constructor function,
 *    the Javascript file url if not yet loaded, or undefined if not defined
 */
Q.Tool.defined = function (toolName) {
	if (!toolName) {
		return undefined;
	}
	return Q.Tool.constructors[Q.normalize.memoized(toolName)];
};

/**
 * Call this function to define default options for a tool constructor,
 * even if has not been loaded yet. Extends existing options with Q.extend().
 * @static
 * @method define.options
 * @param {String} toolName the name of the tool
 * @param {Object} setOptions the options to set
 * @return {Object} the resulting pending options for the tool
 */
Q.Tool.define.options = function (toolName, setOptions) {
	var options;
	toolName = Q.normalize.memoized(toolName);
	if (typeof _qtc[toolName] === 'function') {
		options = _qtc[toolName].options;
	} else {
		options = _qtdo[toolName] = _qtdo[toolName] || {};
	}
	if (setOptions) {
		Q.extend(options, Q.Tool.options.levels, setOptions);
	}
	return options;
};
var _qtdo = {};

Q.Tool.nextDefaultId = 1;
var _qtc = Q.Tool.constructors = {};
var _qtp = Q.Tool.placeholders = {};

var Tp = Q.Tool.prototype;

/**
 * Use this to render a template into a tool's element,
 * using its prefix for any tools inside the template.
 * This function also extends the tool.elements object
 * with elements defined in the template and found with
 * tool.element.querySelector() inside the element.
 * It also activates the content inside the tool, if any.
 * @method renderTemplate
 * @param {String|Object} name See Q.Template.render and Q.Template.load
 * @param {Object} [fields] The fields to pass to the template when rendering it.
 * @param {Function} [callback] a callback - receives (error) or (error, html)
 * @param {Object} [options={}] Options for the template engine compiler. See Q.Template.render.
 *  Also used as options for Q.activate()
 * @return {Promise} can use this instead of callback
 */
Tp.renderTemplate = Q.promisify(function (name, fields, callback, options) {
	var tool = this;
	if (typeof fields === 'function') {
		callback = fields;
		fields = {};
	}
	return Q.Template.render(name, fields || {}, function (err, html) {
		if (err) {
			return callback && callback(err);
		}
		Q.replace(tool.element, html);
		var n = Q.normalize.memoized(name);
		var info = Q.Template.info[n];
		if (!tool.elements) {
			tool.elements = {};
		}
		for (var k in info.elements || {}) {
			tool.elements[k] = tool.element.querySelector(info.elements[k]);
		}
		if (options && options.beforeActivate) {
			callback && callback.call(tool, null, html, tool.elements, options);
		}
		Q.activate(tool.element.children, options, function (elem, tools, options) {
			callback && callback.call(this, null, html, tool.elements, tools, options);
		});
	}, Q.extend({
		tool: tool
	}, options));
}, false, 2);

/**
 * Call this after changing one more values in the state.
 * Unlike Angular and Ember, Q provides a more explicit mechanism
 * for signaling that a tool's state has changed.
 * Other parts of code can use the Tool.prototype.onState event factory
 * to attach handlers to be run when the state changes.
 * @method stateChanged
 * @param {String|Array} names Name(s) of properties that may have changed,
 *  either an array or comma-separated string.
 */
Tp.stateChanged = function Q_Tool_prototype_stateChanged(names) {
	if (typeof names === 'string') {
		names = names.split(',');
		for (var i=0,l=names.length; i<l; ++i) {
			names[i] = names[i].trim();
		}
	}
	var l = names.length;
	for (var i=0; i<l; ++i) {
		var name = names[i];
		this.Q.onStateChanged(name).handle.call(this, name, this.state[name]);
	}
	this.Q.onStateChanged('').handle.call(this, names);
};

/**
 * You can call this to update the state of the tool, and let
 * all the hooks happen as a result. An alternative to this is
 * changing the state manually and then calling stateChanged(),
 * but this method was introduced to be more familiar to users of React.
 * It only does a *shallow* update, meaning it completely replaces
 * whatever was there previously.
 * @method setState
 * @param {Object} updates An object of state property names and new values
 */
Tp.setState = function Q_Tool_prototype_setState(updates) {
	Q.extend(this.state, updates);
	this.stateChanged(Object.keys(updates));
};

/**
 * When implementing tools, use this to implement rendering markup that can vary
 * as a function of the tool's state (with no additional side effects).
 * @method rendering
 * @param {Array|String} fields The names of fields to watch for, either as an array or 
 *  comma-separated string. When stateChanged is called, if one of the fields named here really changed,
 *  the callback will be called.
 * @param {Function} callback The callback, which receives (changed, previous, timestamp). 
 *  By default, Qbix defers the execution of your rendering handler until the next animation frame.
 *  If several calls to tool.stateChanged</span> occurred in the meantime, 
 *  Qbix aggregates all the changes and reports them to the rendering handler. 
 *  If a field in the state was changed several times in the meantime, 
 *  those intermediate values aren't given to the rendering handler, 
 *  since the assumption is that the view depends on the state without any side effects.
 *  However, if the field was changed, even if it later went back to its original value,
 *  it will show up in the list of changed fields.
 * @param {String} [key=""] Optional key used when attaching event handlers to tool.Q.onStateChanged events.
 * @param {boolean} [dontWaitForAnimationFrame=false] Pass true here if you really don't want to 
 *  wait for the next animation frame to do rendering (for example, 
 *  if you insist on reading the DOM and will use a library like FastDOM to manage DOM thrashing)
 */
Tp.rendering = function (fields, callback, key, dontWaitForAnimationFrame) {
	var tool = this;
	var i, l;
	if (typeof fields === 'string') {
		fields = fields.split(',');
		for (i=0,l=fields.length; i<l; ++i) {
			fields[i] = fields[i].trim();
		}
	}
	if (!fields.length) return false;
	var event;
	for (i=0, l=fields.length; i<l; ++i) {
		this.Q.onStateChanged(fields[i]).set(_handleChange, key);
	}
	var previous = (Q.Tool.beingActivated === this)
		? {} : Q.copy(this.state, fields);
	var changed = {};
	var r;
	function _handleChange(name) {
		if (this.state[name] === previous[name]) return;
		changed[name] = this.state[name];
		r = r || (dontWaitForAnimationFrame
			? setTimeout(_render, 0) 
			: requestAnimationFrame(_render));
	}
	function _render(t) { // this is only called once per animation frame
		Q.handle(callback, tool, [changed, previous, t])
		previous = Q.copy(tool.state, fields);
		changed = {};
		r = null;
	}
};

/**
 * Gets child tools contained in the tool, as determined by their ids.
 * @method children
 * @param {String} [name=""] Filter children by their tool name, such as "Q/inplace".
 *   If this is not empty, then returns an object of {toolId: tool} pairs.
 * @param {number} [levels=null] Pass 1 here to get only the immediate children, 2 for immediate children and grandchildren, etc.
 * @return {Object} A two-level hash of pairs like {id: {name: Tool}}
 */
Tp.children = function Q_Tool_prototype_children(name, levels) {
	var result = {};
	var prefix = this.prefix;
	var id, n, i, ids;
	name = name && Q.normalize.memoized(name);
	for (id in Q.Tool.active) {
		for (n in Q.Tool.active[id]) {
			if ((name && name != n)
			|| !id.startsWith(prefix)) {
				continue;
			}
			var tool = Q.Tool.active[id][n];
			if (!levels) {
				if (name) {
					result[id] = tool;
				} else {
					Q.setObject([id, n], tool, result);
				}
				continue;
			}
			ids = tool.parentIds();
			var l = Math.min(levels, ids.length);
			for (i=0; i<l; ++i) {
				if (ids[i] === this.id) {
					if (name) {
						result[id] = tool;
					} else {
						Q.setObject([id, n], tool, result);
					}
					continue;
				}
			}
		}
	}
	return result;
};

/**
 * Gets one child tool contained in the tool, which matches the prefix
 * based on the prefix of the tool.
 * @method child
 * @param {String} [append=""] The string to append to the tool prefix before finding the child tool id
 * @param {String} [name=""] Filter by tool name, such as "Q/inplace"
 * @return {Q.Tool|null}
 */
Tp.child = function Q_Tool_prototype_child(append, name) {
	name = name && Q.normalize.memoized(name);
	var prefix2 = this.prefix + (append || "");
	var id, n, pl = prefix2.length;
	if (append && Q.Tool.active[prefix2]) {
		if (name && Q.Tool.active[prefix2][name]) {
			return Q.Tool.active[prefix2];
		}
		return Q.first(Q.Tool.active[prefix2]);
	}
	for (id in Q.Tool.active) {
		for (n in Q.Tool.active[id]) {
			if (name && name != n) {
				break;
			}
			if (id.length >= pl + (append ? 0 : 1)
			&& id.substring(0, pl) == prefix2) {
				return Q.Tool.active[id][n];
			}
		}
	}
	return undefined;
};

/**
 * Gets the ids of the parent, grandparent, etc. tools (in that order) of the given tool
 * @method parentIds
 * @return {Array|null}
 */
Tp.parentIds = function Q_Tool_prototype_parentIds() {
	var prefix = this.prefix, ids = [], id, pl = prefix.length;
	for (id in Q.Tool.active) {
		if (id.length < pl-1
		&& id === prefix.substring(0, id.length)
		&& prefix[id.length] === '_') {
			ids.push(id);
		}
	}
	// sort in reverse length order
	ids.sort(function (a, b) { 
		return String(b).length - String(a).length; 
	});
	return ids;
};

/**
 * Gets parent tools, as determined by parentIds()
 * Note that several sibling tools may be activated on the same tool id.
 * @method parents
 * @return {Object} A two-level hash of pairs like {id: {name: Q.Tool}}
 */
Tp.parents = function Q_Tool_prototype_parents() {
	var ids = [], i, id;
	ids = this.parentIds();
	var result = {}, len = ids.length;
	for (i=0; i<len; ++i) {
		id = ids[i];
		result[id] = {};
		for (var n in Q.Tool.active[id]) {
			result[id][n] = Q.Tool.active[id][n];
		}
	}
	return result;
};

/**
 * Returns the immediate parent tool, if any, by using parentIds().
 * If more than one tool is activated with the same parent id, returns the first one.
 * @method parent
 * @return {Q.Tool|null}
 */
Tp.parent = function Q_Tool_prototype_parent() {
	var ids = [];
	ids = this.parentIds();
	return ids.length ? Q.first(Q.Tool.active[ids[0]]) : null;
};

/**
 * Returns the closest ancestor, if any, with the given tool name
 * If more than one tool is activated with the same parent id, returns the first one.
 * @method ancestor
 * @param {String} name
 * @return {Q.Tool|null}
 */
Tp.ancestor = function Q_Tool_prototype_parent(name) {
	name = Q.normalize.memoized(name);
	var parents = this.parents();
	for (var id in parents) {
		for (var n in parents[id]) {
			if (n === name) {
				return parents[id][n];
			}
		}
	}
	return undefined;
};

/**
 * Returns a tool on the same element
 * @method sibling
 * @return {Q.Tool|null}
 */
Tp.sibling = function Q_Tool_prototype_sibling(name) {
	return (this.element && this.element.Q && this.element.Q(name)) || null;
};

/**
 * Gets sibling tools activated on the same element
 * @method children
 * @return {Object} pairs of {normalizedName: tool}
 */
Tp.siblings = function Q_Tool_prototype_siblings() {
	var tools = (this.element && this.element.Q && this.element.Q.tools);
	tools = tools ? Q.copy(tools) : {};
	delete tools[this.name];
	return tools;
};

/**
 * Called when a tool instance is removed, possibly
 * being replaced by another.
 * Typically happens after an AJAX call which returns
 * markup for the new instance tool.
 * You should call Q.Tool.remove unless, for some reason, you plan to
 * remove this exact tool instance, and not its children or siblings.
 * @method remove
 * @param {boolean} [removeCached=false]
 *  Defaults to false. Whether or not to remove the actual tool if its containing element
 *  has a "data-Q-retain" attribute.
 * @param {boolean} [removeElementAfterLastTool=false]
 *  If true, removes the element if the last tool on it was removed
 * @return {boolean} Returns whether the tool was removed.
 */
Tp.remove = function _Q_Tool_prototype_remove(removeCached, removeElementAfterLastTool) {

	var i;
	var shouldRemove = removeCached
		|| this.element.getAttribute('data-Q-retain') === null;
	if (!shouldRemove || !Q.Tool.active[this.id]) {
		return false;
	}

	// give the tool a chance to clean up after itself
	var normalizedName = Q.normalize.memoized(this.name);
	_beforeRemoveToolHandlers["id:"+this.id] &&
	_beforeRemoveToolHandlers["id:"+this.id].handle.call(this);
	_beforeRemoveToolHandlers[normalizedName] &&
	_beforeRemoveToolHandlers[normalizedName].handle.call(this);
	_beforeRemoveToolHandlers[""] &&
	_beforeRemoveToolHandlers[""].handle.call(this);
	Q.handle(this.Q.beforeRemove, this, []);
	
	// remove immediate children first, and so on recursively
	var childId, childName;
	var children = this.children('', 1)
	for (childId in children) {
		for (childName in children[childId]) {
			children[childId][childName].remove();
		}
	}
	
	var nn = Q.normalize.memoized(this.name);
	delete this.element.Q.tools[nn];
	delete Q.Tool.active[this.id][nn];
	var tools = Q.Tool.active[this.id];
	if (Q.isEmpty(Q.Tool.active[this.id])) {
		if (removeElementAfterLastTool) {
			Q.removeElement(this.element);
		}
		this.element.Q.tool = null;
		delete Q.Tool.active[this.id];
	} else if (this.element.Q.tool
	&& Q.normalize.memoized(this.element.Q.tool.name) === nn) {
		this.element.Q.tool = Q.Tool.byId(this.id);
	}

	// remove all the tool's events automatically
	var tool = this;
	var key = Q.calculateKey(this);
	var arr = Q.Event.forTool[key];
	while (arr && arr.length) {
		// keep removing the first element of the array until it is empty
		arr[0].remove(tool);
	}
	delete Q.Event.forTool[key];

    var p = Q.Event.jQueryForTool[key];
	if (p) {
		for (i=p.length-1; i >= 0; --i) {
			var off = p[i][0];
			root.jQuery.fn[off].call(p[i][1], p[i][2], p[i][3]);
		}
		// Q.Event.jQueryForTool[key] = [];
		delete Q.Event.jQueryForTool[key];
	}
	
	return this.removed = true;
};

/**
 * If jQuery or $cash is available, override some functions
 */
if (root.$) {
	var $ = root.$;
	var htmlOriginal = $.fn.html;
	$.fn.html = function () {
		var args = Array.prototype.slice.call(arguments, 0);
		if (args.pop() === true) {
			this.each(function () {
				Q.Tool.clear(this);
			});
			return htmlOriginal.apply(this, args);
		}
		return htmlOriginal.apply(this, arguments);
	};
    /**
	 * Calls Q.activate on all the elements in the jQuery.
	 * @static
	 * @method activate
	 * @param {Object} options
	 *  Optional options to provide to tools and their children.
	 * @param {Function|Q.Event} callback
	 *  This will get called for each element that has been completely activated.
	 *  That is, after files for each of its tools, if any,
	 *  have been loaded and all their constructors have run.
	 *  It receives (elem, tools, options) as arguments, and the last tool to be
	 *  activated as "this".
	 */
	$.fn.activate = function _jQuery_fn_activate(options, callback, internal) {
		if (!this.length) {
			Q.handle(callback, null, options, []);
			return this;
		}
		return this.each(function () {
			Q.activate(this, options, callback, internal);
		});
	};

    setTimeout(function () {
        Q.each({
            'on': 'off',
            'live': 'die',
            'bind': 'unbind'
        }, function (on, off) {
            var _jQuery_fn_on = $.fn[on];
            $.fn[on] = function _jQuery_on() {
                var args = Array.prototype.slice.call(arguments, 0)
                for (var f = args.length-1; f >= 0; --f) {
                    if (typeof args[f] === 'function') {
                        break;
                    }
                } // assume f >= 1
                var af1, af2;
                af1 = af2 = args[f];
                var namespace = '';
                if (Q.isArrayLike(args[0])) {
                    namespace = args[0][1] || '';
                    if (namespace && namespace[0] !== '.') {
                        namespace = '.' + namespace;
                    }
                    args[0] = args[0][0];
                }
                if (typeof args[0] === 'function') {
                    var params = {
                        original: args[f]
                    };
                    af2 = args[f] = args[0] ( params );
                    af1.Q_wrapper = af2;
                    if (!('eventName' in params)) {
                        throw new Q.Error("Custom $.fn.on handler: need to set params.eventName");
                    }
                    args[0] = params.eventName;
                }
                if (namespace) {
                    var parts = args[0].split(' ');
                    for (var i=parts.length-1; i>=0; --i) {
                        parts[i] += namespace;
                    }
                    args[0] = parts.join(' ');
                }
                var added;
                if (args[f-1] === true) {
                    Q.Event.jQueryForPage.push([off, this, args[0], af2]);
                    added = 'page';
                } else if (Q.typeOf(args[f-1]) === 'Q.Tool') {
                    var tool = args[f-1];
                    var key = Q.calculateKey(tool);
                    if (!Q.Event.jQueryForTool[key]) {
                        Q.Event.jQueryForTool[key] = [];
                    }
                    Q.Event.jQueryForTool[key].push([off, this, args[0], af2]);
                    added = 'tool';
                }
                if (added) {
                    args.splice(f-1, 1);
                }
                return _jQuery_fn_on.apply(this, args);
            };
            
            var _jQuery_fn_off = $.fn[off];
            $.fn[off] = function () {
                var args = Array.prototype.slice.call(arguments, 0);
                var namespace = '';
                if (Q.isArrayLike(arguments[0])) {
                    namespace = args[0][1] || '';
                    if (namespace && namespace[0] !== '.') {
                        namespace = '.' + namespace;
                    }
                    args[0] = args[0][0];
                }
                if (typeof args[0] === 'function') {
                    var params = {};
                    args[0] ( params );
                    if (!('eventName' in params)) {
                        throw new Q.Error("Custom $.fn.on handler: need to set params.eventName");
                    }
                    args[0] = params.eventName;
                }
                if (namespace) {
                    var parts = args[0].split(' ');
                    for (var i=parts.length-1; i>=0; --i) {
                        parts[i] += namespace;
                    }
                    args[0] = parts.join(' ');
                }
                var f, af = null;
                for (f = args.length-1; f >= 0; --f) {
                    if (typeof args[f] === 'function') {
                        af = args[f];
                        break;
                    }
                }
                if (af && af.Q_wrapper) {
                    args[f] = af.Q_wrapper;
                }
                return _jQuery_fn_off.apply(this, args);
            };
        });
    }, 0);
}

/**
 * If jQuery or $cash is available, returns jQuery(selector, this.element).
 * Just a tiny Backbone.js-style convenience helper; this.$ is similar
 * to $, but scoped to the DOM tree of this tool.
 * @method $
 * @param {String} selector
 *   jQuery selector, fall back to querySelectorAll selector
 * @return {Object}
 *   jQuery object matched by the given selector, fallback to Array of HTMLElement
 */
Tp.$ = function _Q_Tool_prototype_$(selector) {
	if ($) {
		return selector === undefined
			? $(this.element)
			: $(selector, this.element);
	} else {
		return Q.$(selector, this.element, true);
	}
};

/**
 * Do something for every and future child tool that is activated inside this tool
 * @method forEachChild
 * @param {String} [name=""] Filter by name of the child tools, such as "Q/inplace"
 * @param {number} [levels] Optionally pass 1 here to get only the immediate children, 2 for immediate children and grandchildren, etc.
 * @param {boolean} [withSiblings=false] Optionally pass true here to also get the sibling tools activated on the same element
 * @param {Function} callback The callback to execute at the right time
 */
Tp.forEachChild = function _Q_Tool_prototype_forEachChild(name, levels, withSiblings, callback) {
	if (typeof name !== 'string') {
		levels = name;
		callback = levels;
		name = "";
	}
	if (typeof levels !== 'number') {
		withSiblings = levels;
		levels = null;
	}
	if (typeof withSiblings !== 'boolean') {
		callback = withSiblings;
		withSiblings = false;
	}
	name = name && Q.normalize.memoized(name);
	var id, n;
	var tool = this;
	var children = tool.children(name, levels);
	for (id in children) {
		if (name) {
			Q.handle(callback, children[id]);
		} else {
			for (n in children[id]) {
				Q.handle(callback, children[id][n]);
			}
		}
	}
	var onActivate = Q.Tool.onActivate(name);
	if (withSiblings) {
		var siblings = tool.siblings();
		for (n in siblings) {
			Q.handle(callback, siblings[n]);
		}
	}
	var key = onActivate.set(function () {
		if (this.prefix.startsWith(tool.prefix)) {
			if (withSiblings || this.prefix.length > tool.prefix.length) {
				Q.handle(callback, this, arguments);
			}
		}
	});
	tool.Q.beforeRemove.set(function () {
		onActivate.remove(key);
	});
};

/**
 * Returns a string that is already properly encoded and can be set as the value of an options attribute
 * @static
 * @method encodeOptions
 * @param {Object} options the options to pass to a tool
 * @return {String}
 */
Q.Tool.encodeOptions = function _Q_Tool_encodeOptions(options) {
	return JSON.stringify(options).encodeHTML().replaceAll({"&quot;": '"'});
};

/**
 * Sets the options on the element, for example before it is retained
 * for Q/tabs switchTo, for Q.loadUrl, or another transition.
 * That way, the options are retained and the tool can refer to them
 * when it's activated again, which may help skip some steps in tool.refresh()
 * @param {Object} options You may want to do Q.extend({}, tool.options, newStuff) here
 */
Tp.updateElementOptions = function _Q_Tool_updateElementOptions(options) {
	var attrName = 'data-' + this.name.replace(new RegExp('_', 'g'), '-');
	this.element.setAttribute(attrName, JSON.stringify(options));
};

/**
 * Sets up element so that it can be used to activate a tool
 * For example: $('container').append(Q.Tool.prepare('div', 'Streams/chat')).activate(options);
 * @static
 * @method prepare
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String|Array} toolName
 *  The type of the tool, such as "Q/tabs", or an array of types
 * @param {Object|Array} [toolOptions]
 *  The options for the tool. If toolName is an array, this is the array 
 *  of corresponding objects to use for options.
 * @param {String|Function} [id=null]
 *  Optional id of the tool, such as "Q_tabs_2", used if element doesn't have an "id" attribute.
 *  If null, calculates an automatically unique id beginning with the tool's name
 * @param {String} [prefix]
 *  Optional prefix to prepend to the tool's id
 * @param {Boolean} [lazyload=false]
 *    Pass true to allow the tool to be lazy-loaded by a Q/lazyload tool if it is
 *    activated on one of its containers.
 * @return {HTMLElement}
 *  Returns an element you can append to things, and/or call Q.activate on
 */
Q.Tool.prepare = Q.Tool.setUpElement = function _Q_Tool_prepare(element, toolName, toolOptions, id, prefix, lazyload) {
	if (typeof toolOptions === 'string') {
		prefix = id;
		id = toolOptions;
		toolOptions = undefined;
	}
	if (typeof element === 'string') {
		element = document.createElement(element);
	}
	if (typeof toolName === 'string') {
		toolName = [toolName];
	}
	if (Q.isPlainObject(toolOptions)) {
		toolOptions = [toolOptions];
	}
	for (var i=0, l=toolName.length; i<l; ++i) {
		var tn = toolName[i];
		var tnn = Q.normalize.memoized(tn);
		var ntt = tn.split('/').join('_');
		var ba = Q.Tool.beingActivated;
		var p1 = prefix || (ba ? ba.prefix : '');
		element.addClass('Q_tool '+ntt+'_tool');
		if (toolOptions && toolOptions[i]) {
			element.options = element.options || {};
			element.options[tnn] = toolOptions[i];
		}
		if (!element.getAttribute('id')) {
			if (typeof id === 'function') {
				id = id();
			}
			if (id == undefined) {
				var p2;
				do {
					p2 = p1 + ntt + '-' + (Q.Tool.nextDefaultId++) + '_';
					Q.Tool.nextDefaultId %= 1000000;
				} while (Q.Tool.active[p2]);
				id = p2 + 'tool';
			} else {
				if (p1) {
					id = p1 + id;
				}
			}
			element.setAttribute('id', id);
		}
		_insertPlaceholderHTML(element, tnn);
	}
	if (lazyload) {
		element.setAttribute('data-Q-lazyload', 'waiting');
	}
	return element;
};

/**
 * Returns HTML for an element that it can be used to activate a tool
 * @static
 * @method prepareHTML
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String} toolName
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String|Function} [id]
 *  Optional id of the tool, such as "Q_tabs_2"
 * @param {String} [prefix]
 *  Optional prefix to prepend to the tool's id
 * @param {Object} [attributes]
 *  You can pass extra attributes to the element here
 * @return {String}
 *  Returns HTML that you can include in templates, etc.
 */
Q.Tool.prepareHTML = Q.Tool.setUpElementHTML = function _Q_Tool_prepareHTML(
	element, toolName, toolOptions, id, prefix, attributes
) {
	var e = Q.Tool.prepare(element, toolName, null, id, prefix);
	var ntt = toolName.replace(/\//g, '_');
	if (toolOptions) {
		e.setAttribute('data-'+ntt.replace(/_/g, '-'), JSON.stringify(toolOptions));
	}
	if (attributes) {
		for (var k in attributes) {
			if (k === 'class') {
				e.addClass(attributes[k]);
			} else {
				e.setAttribute(k, attributes[k]);
			}
		}
	}
	return e.outerHTML;
};

/**
 * Sets up element so that it can be used to activate a tool
 * For example: $('container').append(Q.Tool.prepare('div', 'Streams/chat')).activate(options);
 * The prefix and id of the element are derived from the tool on which this method is called.
 * @method prepare
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String} toolName
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @return {HTMLElement}
 *  Returns an element you can append to things
 */
Tp.prepare = Tp.setUpElement = function (element, toolName, toolOptions, id) {
	return Q.Tool.prepare(element, toolName, toolOptions, id, this.prefix);
};

/**
 * Returns HTML for an element that it can be used to activate a tool.
 * The prefix and id of the element are derived from the tool on which this method is called.
 * For example: $('container').append(Q.Tool.prepareHTML('Streams/chat')).activate(options);
 * @method prepareHTML
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String} toolName
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @param {Object} [attributes]
 *  You can pass extra attributes to the element here
 * @return {String}
 *  Returns HTML that you can include in templates, etc.
 */
Tp.prepareHTML = Tp.setUpElementHTML = function (element, toolName, toolOptions, id, attributes) {
	return Q.Tool.prepareHTML(element, toolName, toolOptions, id, this.prefix, attributes);
};

/**
 * Returns a tool corresponding to the given DOM element, if such tool has already been constructed.
 * @static
 * @method from
 * @param toolElement {Element}
 *   the root element of the desired tool
 * @param {String} [toolName]
 *   optional name of the tool attached to the element
 * @param {Boolean} [useClosest]
 *   pass true to check the closest parent of the element with that tooL
 * @return {Q.Tool|null}
 *   the tool corresponding to the given element, otherwise null
 */
Q.Tool.from = function _Q_Tool_from(toolElement, toolName, useClosest) {
	if (Q.isArrayLike(toolElement)) {
		toolElement = toolElement[0];
	} if (typeof toolElement === 'string') {
		toolElement = document.getElementById(toolElement);
	}
	if (useClosest) {
		var className = toolName.split('/').join('_')+'_tool';
		toolElement = toolElement && toolElement.closest('.'+className);
	}
	return toolElement && toolElement.Q ? toolElement.Q(toolName) : null;
};

/**
 * Reference a tool by its id
 * @static
 * @method byId
 * @param {String} id
 * @param {String} name optionally specify the name of the tool, useful if more than one tool was activated on the same element. It will be run through Q.normalize().
 * @return {Q.Tool|null|undefined}
 */
Q.Tool.byId = function _Q_Tool_byId(id, name) {
	if (name) {
		name = Q.normalize.memoized(name);
		return Q.Tool.active[id] ? Q.Tool.active[id][name] : null;
	}
	var tool = Q.Tool.active[id] ? Q.first(Q.Tool.active[id]) : null;
	if (!tool) {
		return undefined;
	}
	var q = tool.element.Q;
	return q.tools[q.toolNames[0]];
};

/**
 * Find all the activated tools with a certain name
 * @static
 * @method byName
 * @param {String|Array} name This is run through Q.normalize()
 * @return {Object}
 */
Q.Tool.byName = function _Q_Tool_byName(name) {
	var result = {};
	var isString = (typeof name === 'string');
	if (isString) {
		name = Q.normalize.memoized(name);
	} else {
		for (var i=0, l=name.length; i<l; ++i) {
			name[i] = Q.normalize.memoized(name[i]);
		}
	}
	for (var id in Q.Tool.active) {
		var tools = Q.Tool.active[id];
		for (var n in tools) {
			if ((isString && name === n)
			|| (!isString && name.indexOf(n) >= 0)) {
				result[id] = tools[n];
			}
		}
	}
	return result;
};

/**
 * Computes and returns a tool's prefix
 * @static
 * @method calculatePrefix
 * @param {String} id the id or prefix of an existing tool or its element
 * @return {String}
 */
Q.Tool.calculatePrefix = function _Q_Tool_calculatePrefix(id) {
	if (id.match(/_tool$/)) {
		return id.substring(0, id.length-4);
	} else if (id.substring(id.length-1) === '_') {
		return id;
	} else {
		return id + "_";
	}
};

/**
 * Computes and returns a tool's id from some string that's likely to contain it,
 * such as an HTML element's id, a tool's id, or a tool's prefix.
 * @static
 * @method calculateId
 * @param {String} id the id or prefix of an existing tool or its element
 * @return {String}
 */
Q.Tool.calculateId = function _Q_Tool_calculateId(id) {
	if (id.match(/_tool$/)) {
		return id.substring(0, id.length-5);
	} else if (id.substring(id.length-1) === '_') {
		return id.substring(0, id.length-1);
	} else {
		return id;
	}
};

/**
 * For debugging purposes only, allows to log tool names conveniently
 * @method toString
 * @return {String}
 */
Tp.toString = function _Q_Tool_prototype_toString() {
	return this.id;
};

/**
 * Loads the script corresponding to a tool
 * @method _loadToolScript
 * @param {DOMElement} toolElement
 * @param {Function} callback  The callback to call when the corresponding script has been loaded and executed
 * @param {Mixed} [shared] pass this only when constructing a tool
 * @param {String} [parentId] used internally to pass id of parent tools waiting for init
 * @param {Object} [options={}]
 * @param {Boolean} [options.placeholder=false] used internally to set placeholder HTML for tools waiting for activation
 * @return {boolean} whether the script needed to be loaded
 */
function _loadToolScript(toolElement, callback, shared, parentId, options) {
	var toolId = Q.Tool.calculateId(toolElement.id);
	var classNames = toolElement.className.split(' ');
	var toolNames = [];
	for (var i=0, nl = classNames.length; i<nl; ++i) {
		var className = classNames[i];
		if (className === 'Q_tool'
		|| className.slice(-5) !== '_tool') {
			continue;
		}
		toolNames.push(Q.normalize.memoized(className.substring(0, className.length-5)));
	}
	var p = new Q.Pipe(toolNames, function (params) {
		// now that all the tool scripts are loaded, activate the tools in the right order
		for (var i=0, nl = toolNames.length; i<nl; ++i) {
			var toolName = toolNames[i];
			callback.apply(null, params[toolName]);
		}
	});
	Q.each(toolNames, function (i, toolName) {
		var toolConstructor = _qtc[toolName];
		function _loadToolScript_loaded(params) {
			// in this function, toolConstructor starts as a string
			// and we expect the script to call Q.Tool.define()
			if (params.html && !params.html[0] && params.html[1]
			&& typeof _qtc[toolName] !== 'function') {
				var div = document.createElement('div');
				div.innerHTML = params.html[1];
				var scripts = div.getElementsByTagName('script');
				Q.each(scripts, function () { // run scripts in order
					eval(this.innerHTML);
				});
				var styles = div.getElementsByTagName('style');
				Q.each(styles, function () { // permanently add any styles to document
					document.head.appendChild(this);
				});
				_processTemplateElements(div);
			}
			toolConstructor = _qtc[toolName];
			if (typeof toolConstructor !== 'function') {
				_handleMissingConstructor(true);
			}
			p.fill(toolName)(toolElement, toolConstructor, toolName, uniqueToolId, params);
		}
		if (toolConstructor === undefined) {
			_handleMissingConstructor(false);
		}
		if (parentId) {
			Q.setObject([toolId, parentId], true, _toolsToInit);
			if (parentId !== toolId) {
				Q.setObject([parentId, toolId], true, _toolsWaitingForInit);
			}
		}
		if (shared) {
			var uniqueToolId = toolId + " " + toolName;
			if (!shared.firstToolId) {
				shared.firstToolId = uniqueToolId;
			}
			if (shared.waitingForTools.indexOf(uniqueToolId) < 0) {
				shared.waitingForTools.push(uniqueToolId);
			}
		}
		if (options && options.placeholder) {
			_insertPlaceholderHTML(toolElement, toolName);
		}
		if (typeof toolConstructor === 'function') {
			return p.fill(toolName)(toolElement, toolConstructor, toolName, uniqueToolId);
		}
		if (toolConstructor === undefined) {
			return;
		}
		if (typeof toolConstructor === 'string') {
			if (toolConstructor.split('.').pop() === 'js') {
				toolConstructor = { js: toolConstructor };
			} else {
				toolConstructor = { html: toolConstructor };
			}
		}
		if (!Q.isPlainObject(toolConstructor)) {
			throw new Q.Error("Q.Tool.loadScript: toolConstructor cannot be " + Q.typeOf(toolConstructor));
		}
		var toolConstructorSrc = toolConstructor.js || toolConstructor.html;
		if (!toolConstructorSrc) {
			throw new Q.Error("Q.Tool.loadScript: missing tool constructor file");
		}
		var pipe = Q.pipe(), waitFor = [];
		if (toolConstructor.js) {
			waitFor.push('js');
			Q.addScript(toolConstructor.js, pipe.fill('js'));
		}
		if (toolConstructor.html) {
			waitFor.push('html');
			Q.request.once(toolConstructor.html, pipe.fill('html'), { extend: false, parse: false });
		}
		// start loading css and text at the same time as the js and html
		if (toolConstructor.css) {
			var n = Q.Tool.names[toolName];
			var slotName = (n && n.split('/')[0]) || '';
			waitFor.push('css');
			Q.addStylesheet(toolConstructor.css, null, pipe.fill('css'), {slotName: slotName});
		}
		var n = Q.normalize.memoized(toolName);
		var text = Q.Text.addedFor('Q.Tool.define', n, toolConstructor);
		if (text) {
			waitFor.push('text');
			Q.Text.get(text, pipe.fill('text'));
		}
		pipe.add(waitFor, 1, _loadToolScript_loaded).run();

		function _handleMissingConstructor(requireFunction) {
			var result = {};
			Q.Tool.onMissingConstructor.handle(_qtc, toolName, result);
			if (result.toolName) {
				toolConstructor = _qtc[toolName] = Q.Tool.defined(result.toolName);
				Q.Tool.onLoadedConstructor(result.toolName)
				.add(function (n, constructor) {
					_qtc[toolName] = constructor;
					Q.Tool.onLoadedConstructor(toolName)
					.handle.call(Q.Tool, toolName, constructor);
				}, toolName);
			}
			if (typeof toolConstructor !== 'function'
			&& (requireFunction || (
				typeof toolConstructor !== 'string'
				&& !(Q.isPlainObject(toolConstructor) && toolConstructor.js
			)))) {
				toolConstructor = function () {
					log("Missing tool constructor for " + toolName);
				}; 
				Q.Tool.onLoadedConstructor(toolName)
				.handle.call(Q.Tool, toolName, toolConstructor);
			}
		}
	});
}

function _insertPlaceholderHTML(toolElement, toolName) {
	var toolPlaceholder = _qtp[toolName];
	if (!toolPlaceholder || toolElement.Q_insertedPlaceholderHTML) {
		return false;
	}
	// Insert placeholder HTML from one of the tools.
	// Usually it's a .Q_placeholder_shimmer class div container with a bunch of children
	var tool = Q.getObject(['Q', 'tools', toolName], toolElement);
	if (tool && !toolElement.innerHTML) {
		return false;
	}
	function _insertHTML(err, html) {
		toolElement.Q_insertedPlaceholderHTML = true;
		toolElement.innerHTML = html;
	}
	if (toolPlaceholder.html) {
		_insertHTML(null, toolPlaceholder.html);
	} else if (toolPlaceholder.template) {
		if (Q.isPlainObject(toolPlaceholder.template)) {
			Q.Template.render(toolPlaceholder.template.name, toolPlaceholder.template.fields, _insertHTML);
		} else {
			Q.Template.render(toolPlaceholder.template, _insertHTML);
		}
	}
	return true;
}

Q.Tool.onLoadedConstructor = Q.Event.factory({}, ["", function (name) { 
	return [Q.normalize.memoized(name)];
}]);
Q.Tool.onMissingConstructor = new Q.Event();

/**
 * For defining method stubs that will be replaced with methods on demand.
 * Assign this in place of any asynchronous method
 * that would have a callback and/or return a Promise.
 * Then call Q.Method.define() on the object containing these.
 * @class Q.Method
 * @constructor
 * @param {Object} properties pass an object with any properties to assign to the
 *  method function, such as { options: { a: "b" , c: "d" }}
 * @param {Object} [options] More information about the method
 * @param {boolean} [options.isGetter] set to true to indicate that the method will be wrapped with Q.getter()
 */
Q.Method = function (properties, options) {
	Q.extend(this, properties);
	this.__options = options || {};
};

Q.Method.stub = new Q.Method(); // for backwards compatibility

Q.Method.load = function (o, k, url, closure) {
	var original = o[k];
	return new Promise(function (resolve, reject) {
		Q.require(url, function (exported) {
			if (exported) {
				var args = closure ? closure() : [];
				if (!exported.Q_Method_load_executed) {
					var m = exported.apply(o, args);
					if (typeof m === 'function') {
						o[k] = m;
					}
					exported.Q_Method_load_executed = true;
				}
			}
			var v = o[k];
			if (v === original) {
				return reject("Q.Method.define: Must override method '" + k + "'");
			}
			for (var property in original) {
				if (!(property in v)) {
					v[property] = original[property];
				}
			}
			resolve(v);
			Q.Method.onLoad.handle(o, k, o[k], closure);
		}, true);
	});
};

Q.Method.onLoad = new Q.Event();

/**
 * Call this on any object that contains new Q.Method()
 * in place of some asynchronous methods. It will set up code to load
 * implementations of these methods on demand, from files found at URLs
 * of the form {{prefix}}/{{methodName}}.js . In those files, you can
 * write code such as the following, using constant objects:
 * Q.exports(function (Users, _private) { 
 *   return function myCoolMethod(options, callback) {
 *     return new Promise(...);
 *   }
 * });
 * When the method is first called, it loads the implementation, and
 * returns a promise that resolves to whatever the implementation returns.
 * Subsequent calls to the method would simply invoke the implementation.
 * @param {Object} o The object which contains some asynchronous methods
 * @param {String} prefix The part of the URL before "/{{methodName}}.js".
 *  It is passed through Q.url() so it can look like "{{Users}}/js/Users/Web3"
 * @param {Function} closure Optional, this function could reference some
 *  constants in a closure, and return array of these constants, to be used
 *  inside the method implementation in a separate file. The closure constants
 *  can be objects, whose contents are dynamic, but the constants themselves
 *  should never change between invocations of the method. 
 * @return {Object} the object sent in the first parameter
 */
Q.Method.define = function (o, prefix, closure) {
	if (!prefix) {
		prefix = Q.currentScriptPath(Q.Method.define.options.siblingFolder);
	}
	Q.each(o, function (k) {
		if (!o.hasOwnProperty(k) || !(o[k] instanceof Q.Method)) {
			return;
		}
		// method stub is still there
		var method = o[k];
		o[k] = function _Q_Method_shim () {
			var url = Q.url(prefix + '/' + k + '.js');
			var t = this, a = arguments;
			return Q.Method.load(o, k, url, closure)
			.then(function (f) {
				return f.apply(t, a);
			});
		};
		Q.extend(o[k], method);
		if (method.__options.isGetter) {
			o[k].force = function _Q_Method_force_shim () {
				var url = Q.url(prefix + '/' + k + '.js');
				var t = this, a = arguments;
				return Q.Method.load(o, k, url, closure)
				.then(function (f) {
					return f.force.apply(t, a);
				});
			};
			o[k].forget = function _Q_Method_forget_shim () {
				var url = Q.url(prefix + '/' + k + '.js');
				var t = this, a = arguments;
				return Q.Method.load(o, k, url, closure)
					.then(function (f) {
						return f.forget.apply(t, a);
					});
			};
		}
		if (method.__options.cache) {
			o[k].cache = method.__options.cache;
		}
	});
	return o;
};

/**
 * A Q.Session object represents a session, and implements things like an "expiring" dialog
 * @class Q.Session
 * @constructor
 */

Q.Session = {
	paths: [],
	/**
	 * Clears the various objects that were set specifically
	 * for this user session.
	 * @static
	 * @method clear
	 */
	clear: function () {
		Q.each(Q.Session.paths, function (i, path) {
			if (Q.getObject(path)) {
				Q.setObject(path, null);
			}
		});
		return true;
	}
};

Q.Method.define.options = {
	siblingFolder: 'methods'
};

/**
 * A Q.Request object represents a network request issued by Q
 * @class Q.Request
 * @constructor
 */

Q.Request = function _Q_Request(url, slotNames, callback, options) {
	this.url = url;
	this.slotNames = slotNames;
	this.callback = callback;
	this.options = options;
};

/**
 * A Q.Response object represents a network response
 * @class Q.Response
 * @constructor
 */

Q.Response = function _Q_Response(response) {
	
};

Q.Response.processScriptDataAndLines = function (response) {
	if (response.scriptData) {
		Q.each(response.scriptData,
		function _Q_scriptData_each() {
			Q.each(this, function _Q_loadUrl_scriptData_assign(k, v) {
				Q.setObject(k, v);
			});
		});
	}
	if (response.sessionDataPaths) {
		Q.Session.paths = response.sessionDataPaths;
	}
	if (response.scriptLines) {
		for (var i in response.scriptLines) {
			if (response.scriptLines[i]) {
				(function () {
					eval("var Q = window.Q;"); // needed after some minification
					eval(response.scriptLines[i]);
				})();
			}
		}
	}
};

Q.Response.processStylesheets = function Q_Response_loadStylesheets(response, callback) {
	if (!response.stylesheets) {
		return callback();
	}
	var newStylesheets = {};
	var keys = Object.keys(response.stylesheets);
	if (response.stylesheets[""]) {
		keys.splice(keys.indexOf(""), 1);
		keys.unshift("");
	}
	var waitFor = [];
	var slotPipe = Q.pipe();			
	Q.each(keys, function (i, slotName) {
		var stylesheets = [];
		for (var j in response.stylesheets[slotName]) {
			var stylesheet = response.stylesheets[slotName][j];
			var key = slotName + '\t' + stylesheet.href + '\t' + stylesheet.media;
			var elem = Q.addStylesheet(
				stylesheet.href, stylesheet.media,
				slotPipe.fill(key), { slotName: slotName, returnAll: false }
			);
			if (elem) {
				stylesheets.push(elem);
			}
			waitFor.push(key);
		}
		newStylesheets[slotName] = stylesheets;
	});
	slotPipe.add(waitFor, function _Q_loadUrl_pipe_slotNames() {
		callback();
	}).run();
	return newStylesheets;
}

Q.Response.processStyles = function Q_Response_processStyles(response) {
	if (!response.stylesInline) {
		return null;
	}
	var newStyles = {},
		head = document.head || document.getElementsByTagName('head')[0];
	var keys = Object.keys(response.stylesInline);
	if (response.stylesInline[""]) {
		keys.splice(keys.indexOf(""), 1);
		keys.unshift("");
	}
	Q.each(keys, function (i, slotName) {
		var styles = response.stylesInline[slotName];
		if (!styles) return;
		var style = document.createElement('style');
		style.setAttribute('type', 'text/css');
		style.setAttribute('data-slot', slotName);
		if (style.styleSheet){
			style.styleSheet.cssText = styles;
		} else {
			style.appendChild(document.createTextNode(styles));
		}
		head.appendChild(style);
		newStyles[slotName] = [style];
	});
	return newStyles;
}

Q.Response.processHtmlCssClasses = function Q_Response_processHtmlCssClasses(response) {
	Q.each(response.htmlCssClasses, function (i, c) {
		document.documentElement.addClass(c);
	});
}

Q.Response.processMetas = function Q_Response_processMetas(response) {
	if (!response.metas) {
		return null;
	}

	var elHead = document.getElementsByTagName('head')[0];
	for (var slotName in response.metas) {
		Q.each(response.metas[slotName], function (i) {
			var metaData = this;
			var metas = document.querySelectorAll("meta[" + metaData.name + "='" + metaData.value + "']");
			var found = false;
			Q.each(metas, function (j) {
				if (this.getAttribute(metaData.name) === metaData.value) {
					this.setAttribute(metaData.name, metaData.value);
					this.setAttribute("content", metaData.content);
					found = true;
					return false;
				}
			});
			if (!found) {
				var meta = document.createElement("meta");
				meta.setAttribute(metaData.name, metaData.value);
				meta.setAttribute("content", metaData.content);
				elHead.appendChild(meta);
				return;
			}
		});
	}
};

Q.Response.processTemplates = function Q_Response_processTemplates(response) {
	if (!response.templates) {
		return null;
	}
	var slotName, newTemplates = {};
	for (slotName in response.templates) {
		newTemplates[slotName] = [];
		Q.each(response.templates[slotName], function (i) {
			var info = Q.take(this, ['type', 'text', 'partials', 'helpers']);
			newTemplates[slotName].push(
				Q.Template.set(this.name, this.content, info)
			);
		});
	}
	return newTemplates;
};

Q.Response.processScripts = function Q_Response_processScripts(response, callback, options) {
	if (!response.scripts) {
		callback();
		return null;
	}
	var slotPipe = Q.pipe(Object.keys(response.scripts), function _Q_loadUrl_pipe_slotNames() {
		callback();
	});
	var newScripts = {};
	var keys = Object.keys(response.scripts);
	if (response.scripts[""]) {
		keys.splice(keys.indexOf(""), 1);
		keys.unshift("");
	}
	Q.each(keys, function (i, slotName) {
		var elem = Q.addScript(
			response.scripts[slotName], slotPipe.fill(slotName), {
			ignoreLoadingErrors: options.ignoreLoadingErrors,
			returnAll: false
		});
		if (elem) {
			newScripts[slotName] = elem;
		}
	});
	return newScripts;
};

/**
 * A constructor to create Q.Page objects
 * @class Q.Page
 * @constructor
 * @param {String} uriString
 */
Q.Page = function (uriString) {
	this.uriString = uriString;
};

/**
 * Pushes a url onto the history stack via pushState with a fallback to hashChange,
 * to be handled later by either the Q_popStateHandler or the Q_hashChangeHandler.
 * @static
 * @method push
 * @param {String} url The url to push
 * @param {String} [title=null] The title to go with the url, to override current title
 */
Q.Page.push = function (url, title) {
	var currentUrl = location.pathname + location.search + location.hash;
	if (location.href === url || currentUrl === url || currentUrl === '/' + url) {
		return null; // already here
	}
	var prevUrl = location.href;
	url = Q.url(url);
	var baseUrl = Q.baseUrl();
	if (!url.startsWith(baseUrl)) {
		return false;
	}
	var parts = url.split('#');
	var path = (url.substring(Q.baseUrl().length+1) || '');
	if (history.pushState) {
		if (typeof title === 'string') {
			history.pushState({}, title, url);	
		} else {
			history.pushState({}, null, url);
		}
	} else {
		var hash = '#!url=' + encodeURIComponent(path) +
			location.hash.replace(/#!url=[^&]*/, '')
				.replace(/&!url=[^&]*/, '')
				.replace(/&column=[^&]+/, '')
				.replace(/#column=[^&]+/, '');
		if (parts[1]) {
			hash += ('&'+parts[1])
				.replace(/&!url=[^&]*/, '')
				.replace(/&column=[^&]+/, '');
		}
		if (location.hash !== hash) {
			Q_hashChangeHandler.ignore = true;
			location.hash = hash;
		}
	}
	if (typeof title === 'string') {
		document.title = title;
	}
	Q_hashChangeHandler.currentUrl = url.split('#')[0];
	Q_hashChangeHandler.currentUrlTail = Q_hashChangeHandler.currentUrl
		.substring(baseUrl.length + 1);
	Q.info.url = url;
	Q.handle(Q.Page.onPush, Q, [url, title, prevUrl]);
};

Q.Page.onPush = new Q.Event();

Q.Page.currentUrl = function () {
	var url = location.hash.queryField('url');
	return url ? Q.url(url) : location.href.split('#')[0];
};

/**
 * Whether a page is currently being loaded
 * @property {boolean} beingLoaded
 */
Q.Page.beingLoaded = false;
/**
 * Whether a page is currently being activated
 * @property {boolean} beingActivated
 */
Q.Page.beingActivated = false;
/**
 * Whether we are currently in the process of unloading the existing page,
 * and then loading and activating the new page.
 * @property {boolean} beingProcessed
 */
Q.Page.beingProcessed = false;

/**
 * Occurs when the page has begun to load
 * @event onLoad
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.onLoad = Q.Event.factory(null, [""]);
/**
 * Occurs after the page is activated
 * @event onActivate
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.onActivate = Q.Event.factory(null, [""]);
/**
 * Occurs after the page unloads
 * @event onUnload
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.onUnload = Q.Event.factory(null, [""]);
/**
 * Occurs before the page unloads
 * @event beforeUnload
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.beforeUnload = Q.Event.factory(null, [""]);

/**
 * @class Q
 */

/**
 * Use this function to set handlers for when the page is loaded or unloaded.
 * @static
 * @method page
 * @param {String|Array|Object} page "$Module/$action" or a more specific URI string, or "" to handle all pages
 * @param {Function} handler A function to run after the page loaded.
 *  If the page is already currently loaded (i.e. it is the latest loaded page)
 *  then the handler is run right away.
 *  The handler can optionally returns another function, which will be run when the page is unloaded.
 *  After a page is unloaded, all the "unloading" handlers added in this way are removed, so that
 *  the next time the "loading" handlers run, they don't create duplicate "unloading" handlers.
 * @param {String} key Use this to identify the entity setting the handler, e.g. "Users/authorize".
 *  If the key is undefined, it will be automatically set to "Q". To force no key, pass null here.
 *  Since "loading" handlers are not automatically removed, they can accumulate if the key was null.
 *  For example, if an AJAX call would execute Javascript such as Q.page(uri, handler, null),
 *  this could lead to frustrating bugs as event handlers are registered multiple times, etc.
 */
Q.page = function _Q_page(page, handler, key) {
	if (key === undefined) {
		key = 'Q';
	}
	if (Q.isArrayLike(page)) {
		for (var i = 0, l = page.length; i<l; ++i) {
			Q.page(page[i], handler, key);
		}
		return;
	}
	if (Q.isPlainObject(page)) {
		for (var k in page) {
			Q.page(k, page[k], key);
		}
		return;
	}
	if (typeof handler !== 'function') {
		return;
	}
	Q.Page.onActivate(page)
	.add(function Q_onPageActivate_handler(url, options) {
		var unload = handler.call(
			Q, Q.Page.beforeUnload("Q\t"+page), url, options
		);
		if (unload && typeof unload === "function") {
			Q.Page.beforeUnload("Q\t"+page).set(unload, key);
		}
	}, key);
};

/**
 * Initialize the Q javascript platform
 * @static
 * @method init
 * @param {Object} options
 * @param {boolean} [options.isLocalFile] set this to true if you are calling Q.init from local file:/// context.
 */
Q.init = function _Q_init(options) {
	if (Q.init.called) {
		return false;
	}
	Q.init.called = true;
	Q.info.baseUrl = Q.info.baseUrl || location.href.split('/').slice(0, -1).join('/');
	Q.info.imgLoading = Q.info.imgLoading || Q.url('{{Q}}/img/throbbers/loading.gif');
	Q.loadUrl.options.slotNames = Q.info.slotNames;
	_detectOrientation();
	Q.addEventListener(root, 'orientationchange', _detectOrientation);
	Q.addEventListener(root, 'unload', Q.onUnload.handle);
	Q.addEventListener(root, 'online', Q.onOnline.handle);
	Q.addEventListener(root, 'offline', Q.onOffline.handle);
	var checks = ["init", "ready"];
	var p = Q.pipe(checks, 1, function _Q_init_pipe_callback() {
		if (!Q.info) Q.info = {};
		if (options && options.isLocalFile) {
			Q.info.isLocalFile = true;
			Q.handle.options.loadUsingAjax = true;
		}
		function _ready() {
			setTimeout(function () {
				Q.ready();
			}, 0);
		}
		_ready();
	});

	function _domReady() {
		p.fill("ready")();
	}

	// Bind document ready event
    document.addEventListener("DOMContentLoaded", _domReady);
    var _timer = setInterval(function() { // for old browsers
        if (/loaded|complete/.test(document.readyState)) {
            clearInterval(_timer);
            _domReady();
        }
    }, 10);
	
	Q.handle(Q.beforeInit);
	
	// Time to call all the onInit handlers
	var p2 = Q.pipe();
	var waitFor = [];
	var urls = Q.info.urls;
	if (urls && urls.updateBeforeInit && (urls.caching || urls.integrity)) {
		waitFor.push('Q.info.urls.updateBeforeInit');
		Q.updateUrls(p2.fill('Q.info.urls.updateBeforeInit'));
	}
	if (!Q.isEmpty(Q.getObject('Q.info.text.loadBeforeInit'))) {
		waitFor.push('loadBeforeInit');
		Q.Text.get(Q.info.text.loadBeforeInit, p2.fill('loadBeforeInit'));
	}
	p2.add(waitFor, 1, function () {
		p.fill('init')();
		Q.handle(Q.onInit, Q);
	}).run();
};

/**
 * This is called when the DOM is ready
 * @static
 * @method ready
 */
Q.ready = function _Q_ready() {
	var loader = Q.ready.options.skipNonce
		? function (callback) { callback() }
		: Q.loadNonce;
	loader(function readyWithNonce() {
		var baseUrl = Q.baseUrl();
		_isReady = true;
		if (Q.info.isLocalFile && !baseUrl.startsWith('file://')) {
			// This is an HTML file loaded from the local filesystem
			var url = location.hash.queryField('url');
			if (url === undefined) {
				Q.handle(baseUrl);
			} else {
				Q.handle(url.indexOf(baseUrl) == -1 ? baseUrl+'/'+url : url);
			}
			return;
		}

		// Try to add the plugin thing again
		Q.onDOM.handle.call(root);
		
		// This is an HTML document loaded from our server
		if (Q.info.uri && Q.info.uri.module) {
			var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action;
			try {
				Q.Page.beingLoaded = true;
				Q.Page.onLoad('').handle();
				Q.Page.onLoad(moduleSlashAction).handle();
				if (Q.info.uriString !== moduleSlashAction) {
					Q.Page.onLoad(Q.info.uriString).handle();
				}
			} catch (e) {
				debugger; // pause here if debugging
				Q.Page.beingLoaded = false;
				throw e;
			}
		}
		Q.Page.beingLoaded = false;	

		Q.activate(document.body, undefined, function _onReadyActivate() {
			// Hash changes -- will work only in browsers that support it natively
			// see http://caniuse.com/hashchange
			Q.addEventListener(root, 'hashchange', Q.onHashChange.handle);
			
			// History changes -- will work only in browsers that support it natively
			// see http://caniuse.com/history
			Q.addEventListener(root, 'popstate', Q.onPopState.handle);

			// To support tool layouting, trigger 'layout' event
			// on browser resize and orientation change
			Q.addEventListener(root, 'resize', Q.layout);
			Q.addEventListener(root, 'orientationchange', Q.layout);
			Q.addEventListener(root, 'scroll', Q.onScroll.handle);
			_setLayoutInterval();

			// Call the functions meant to be called after ready() is done
			Q.onReady.handle.call(root);

			// This is an HTML document loaded from our server
			try {
				Q.Page.beingActivated = true;
				Q.Page.onActivate('').handle(Q.info.url);
				if (Q.info && Q.info.uri) {
					var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action;
					Q.Page.onActivate(moduleSlashAction).handle();
					if (Q.info.uriString !== moduleSlashAction) {
						Q.Page.onActivate(Q.info.uriString).handle();
					}
				}
				Q.Page.beingActivated = false;
			} catch (e) {
				debugger; // pause here if debugging
				Q.Page.beingActivated = false;
				throw e;
			}
			
			if (location.hash.toString()) {
				Q_hashChangeHandler();
			}
		});
	});
};
Q.ready.options = {};

/**
 * This function is called by Q to make sure that we've loaded the session nonce.
 * If you like, you can also call it yourself.
 * @static
 * @method loadNonce
 * @param {Function} callback This function is called when the nonce is loaded
 * @param {Object} context The "this" to pass to the callback
 * @param {Array} args The arguments to pass to the callback
 */
Q.loadNonce = function _Q_loadNonce(callback, context, args) {
	if (Q.nonce) {
		Q.handle(callback, context, args);
		return;
	}
	var baseUrl = Q.baseUrl();
	var p1 = baseUrl && baseUrl.parseUrl();
	var p2 = location.href.parseUrl();
	if (!p1 || p1.host !== p2.host || (p1.scheme !== p2.scheme && p2.scheme === 'https')) {
		Q.handle(callback, context, args); // nonce won't load cross-origin anyway
		return;
	}
	// make this into a getter function, and call it from here but also from Q.js
	if (Q.info.isStatic) {
		Q.request({"Q.scriptData": 1}, Q.info.isStatic, Q.info.slotNames,
		function (err, res) {
			for (var slot in res.scriptData) {
				var data = res.scriptData[slot];
				for (var k in data) {
					Q.setObject(k, data[k]);
				}
			}
		});
	}
	return Q.loadNonce.loader(callback, context, args);
};

// Default loader does nothing, but you can override it
// to load nonces from your server
Q.loadNonce.loader = function (callback, context, args) {
    return Q.handle(callback, context, args);
};

/**
 * This function is called by Q to make sure that we've loaded the Handlebars library
 * If you like, you can also call it yourself.
 * @static
 * @method loadHandlebars
 * @param {Function} callback This function is called when the library is loaded
 */
Q.loadHandlebars = Q.getter(function _Q_loadHandlebars(callback) {
	Q.onInit.addOnce(function () {
		Q.ensure('Handlebars', function () {
			_addHandlebarsHelpers();
			Q.handle(callback);
		});
	}, 'Q.loadHandlebars');
}, {
	cache: Q.Cache.document('Q.loadHandlebars', 1)
});

/**
 * Remove an element from the DOM and try to clean up tools as much as possible
 * @static
 * @method removeElement
 * @param {HTMLElement|Array} element, or array of elements, or object of elements
 * @param {boolean} removeTools whether to properly remove the tools before removing the element
 */
Q.removeElement = function _Q_removeElement(element, removeTools) {
	if (!element) {
		return;
	}
	if (Q.isArrayLike(element)) {
		return Q.each(element, function () {
			Q.removeElement(this, removeTools);
		});
	}
	if (removeTools) {
		Q.Tool.remove(element);
	}
	if (element.tagName === 'LINK' && element.href) {
		// unlike scripts, when we yank the css, it should be marked as removed
		var href2 = element.href.split('?')[0];
		delete Q.addStylesheet.loaded[href2];
	}
	for (var i=0, l=_layoutElements.length; i<l; ++i) {
		var p = _layoutElements[i];
		do {
			if (p === element) {
				_layoutElements.splice(i, 1);
				_layoutEvents.splice(i, 1);
				--i; --l;
				break;
			}
		} while (p = p.parentElement);
	}
	if (!element.parentElement) return false;
	element.parentElement.removeChild(element);
	try {
		for (var prop in element) {
			delete element[prop];
		}
	} catch (e) {
		// Old IE doesn't like this
	}
};

/**
 * Replaces the contents of an element and does the right thing with all the tools in it
 * @static
 * @method replace
 * @param {String|HTMLElement} container
 *  Pass a tag name to create an HTMLElement with that tag. Or pass
 *  an existing HTMLElement whose contents are to be replaced with the source
 *  Tools found in the existing DOM which have data-Q-retain attribute
 *  are actually retained unless the tool replacing them has a data-Q-replace attribute.
 *  You can update the tool by implementing a handler for
 *  tool.Q.onRetain, which receives the old Q.Tool object, the new options and incoming element.
 *  After the event is handled, the tool's state will be extended with these new options.
 * @param {Element|String|DocumentFragment} source
 *  An HTML string or an Element or DocumentFragment which is not part of the DOM.
 *  If an element, it is treated as a document fragment, and its contents are used to replace the container's contents.
 * @param {Object} options
 *  Optional. A hash of options, including:
 * @param {Array} [options.replaceElements] array of elements or ids of elements in the document to replace, even if they have "data-q-retain" attributes.
 * @return {HTMLElement|false}
 *  Returns the container element if successful
 */
Q.replace = function _Q_replace(container, source, options) {
	if (typeof container === 'string') {
		container = document.createElement(container);
	}
	if (container.innerHTML == '' && typeof source == 'string') {
		container.innerHTML = source;
		return container;
	}
	if (!source) {
		var c; while (c = container.lastChild) {
			Q.removeElement(c, true);
		} // Clear the container
		return container;
	}
	options = Q.extend({}, Q.replace.options, options);
	if (Q.typeOf(source) === 'string') {
		var s = document.createElement('div'); // temporary container
		s.innerHTML = source;
		source = s;
	}
	
	var replaceElements = [];
	if (options.replaceElements) {
		Q.each(options.replaceElements, function (i, e) {
			replaceElements.push(
				typeof e === 'string' ? document.getElementById(e) : e
			);
		});
	}
	if (!source.childNodes) {
		return false;
	}
	
	var retainedTools = {};
	var newOptions = {};
	var incomingElements = {};
	var list = source.querySelectorAll('.Q_tool');
	for (var i=0, l=list.length; i<l; ++i) {
		var incomingElement = list[i];
		var id = incomingElement.id;
		var element = id && document.getElementById(id);
		if (element && element.getAttribute('data-Q-retain') !== null
		&& incomingElement.getAttribute('data-Q-replace') === null
		&& element.Q && element.Q.tool
		&& replaceElements.indexOf(element) < 0) {
			// If a tool exists with this exact id and has "data-Q-retain",
			// then re-use it and all its HTML elements, unless
			// the new tool HTML has data-Q-replace or is in options.replaceElements.
			// This way tools can avoid doing expensive operations each time
			// they are replaced and reactivated.
			incomingElements[incomingElement.id] = incomingElement;
			Q.replace.retainedElements[incomingElement.id] = element;
			incomingElement.parentElement.replaceChild(element, incomingElement);
			retainedTools[id] = retainedTools[id] || {};
			newOptions[id] = newOptions[id] || {};
			for (var name in element.Q.tools) {
				var tool = Q.Tool.from(element, name);
				var attrName = 'data-' + Q.normalize.memoized(tool.name, '-');
				var tn = Q.normalize.memoized(tool.name);
				var newOptionsString = incomingElement.getAttribute(attrName);
				if (newOptionsString) {
					element.setAttribute(attrName, newOptionsString);
					newOptions[id][tn] = JSON.parse(newOptionsString);
				}
				retainedTools[id][tn] = tool;
			}
			if (incomingElement.options) {
				Q.extend(newOptions[id], incomingElement.options);
			}
		}
	};
	
	Q.beforeReplace.handle(container, source, options, newOptions, retainedTools);
	
	var c;
	while (c = container.lastChild) {
		Q.removeElement(c, true);
	} // Clear the container
	
	// Move the actual nodes from the source to existing container
	if (source instanceof DocumentFragment) {
		container.appendChild(source);
	} else {
		while (c = source.childNodes[0]) {
			container.appendChild(c);
		}
	}
	
	for (var id in retainedTools) {
		for (var toolName in retainedTools[id]) {
			var tool = retainedTools[id][toolName];
			var newOpt = newOptions[id][toolName];
			// The tool's constructor not will be called again with the new options.
			// Instead, implement Q.onRetain, from the tool we decided to retain.
			// The Q.Tool object still contains all its old properties, options, state.
			// Its element still contains DOM elements, 
			// attached jQuery data and events, and more.
			// However, the newOpt now contains the new options for the tool,
			// and the element's data-TOOL-NAME attribute is a copy of the
			// incoming element's data-TOOL-NAME attribute, if any.
			Q.handle(tool.Q.onRetain, tool, [newOpt, incomingElements[id]]);
			Q.extend(tool.state, 10, newOpt);
		}
	}
	
	return container;
};

Q.replace.retainedElements = {};

var _supportsPassive;

/**
 * Add an event listener to an element, but with more features than Element.prototype.addEventListener()
 * You can pass this event listener also to the corresponding Q.removeEventListener(), but
 * only if you call addEventListener once per eventHandler. Otherwise, you should use this function's return value
 * in calls to Q.removeEventListener().
 * @static
 * @method addEventListener
 * @param {HTMLElement|Array|NodeList} element
 *  An HTML element, window or other element that supports listening to events
 *  You can also pass an Array or NodeList of elements here.
 * @param {String|Array|Object|Function} eventName
 *  A space-delimited string of event names, or an array of event names.
 *  You can also pass an object of { eventName: eventHandler } pairs, in which csae
 *  the next parameter would be useCapture.
 *  You can also pass functions such as Q.Pointer.start here.
 * @param {Function} eventHandler
 *  A function to call when the event fires
 * @param {boolean|Object} [useCapture]
 *  Whether to use the capture instead of bubble phase. Ignored in IE8 and below.
 *  You can also pass {passive: true} and other such things here.
 * @param {boolean} [hookStopPropagation]
 *  Whether to override Event.prototype.stopPropagation in order to capture the event even
 *  when a descendant of the element tries to stop propagation to its ancestors.
 * @return {Function} the wrapper function to pass to corresponding Q.removeEventListener
 */
Q.addEventListener = function _Q_addEventListener(element, eventName, eventHandler, useCapture, hookStopPropagation) {
	if (Q.isEmpty(element) || Q.isEmpty(eventHandler)) {
		return false;
	}
	useCapture = useCapture || false;
	if (Q.isArrayLike(element)) {
		for (var i=0, l=element.length; i<l; ++i) {
			Q.addEventListener(element[i], eventName, eventHandler, useCapture, hookStopPropagation);
		}
		return;
	}
	if (Q.isPlainObject(eventName)) {
		for (var k in eventName) {
			Q.addEventListener(element, k, eventName[k], eventHandler);
		}
		return;
	}
	function _Q_addEventListener_wrapper(e) {
		Q.handle(eventHandler, element, [e]);
	}
	var handler = (eventHandler.typename === "Q.Event"
		? (eventHandler.eventListener = _Q_addEventListener_wrapper)
		: eventHandler);
	if (Q.isPlainObject(useCapture)) {
		// Test via a getter in the options object to see if the passive property is accessed
		if (_supportsPassive === undefined) {
			_supportsPassive = false;
			if (Object.defineProperty) {
				try {
					var opts = Object.defineProperty({}, 'passive', {
						get: function() {
							_supportsPassive = true;
						}
					});
					window.addEventListener("Qtest", _f, opts);
					window.removeEventListener("Qtest", _f);
				} catch (e) {}
			}
		}
		useCapture = _supportsPassive ? useCapture : useCapture.capture;
	}
	if (typeof eventName === 'function') {
		var params = {
			original: eventHandler
		};
		var wrapper = eventName ( params );
		if (!('eventName' in params)) {
			throw new Q.Error("Custom $.fn.on handler: need to set params.eventName");
		}
		eventHandler.Q_wrapper = handler = wrapper;
		eventName = wrapper.eventName = params.eventName;
	}
	if (!eventName) {
		return;
	}

	if (typeof eventName === 'string') {
		var split = eventName.trim().split(' ');
		if (split.length > 1) {
			eventName = split;
		}
	}
	if (Q.isArrayLike(eventName)) {
		for (var i=0, l=eventName.length; i<l; ++i) {
			Q.addEventListener(element, eventName[i], eventHandler, useCapture, hookStopPropagation);
		}
		return;
	}
	if (element.addEventListener) {
		element.addEventListener(eventName, handler, useCapture);
	} else if (element.attachEvent) {
		element.attachEvent('on'+eventName, handler);
	} else {
		eventName = eventName.toLowerCase();
		element["on"+eventName] = function () {
			if (element["on"+eventName]) {
				element["on"+eventName].apply(this, arguments);
			}
			handler.apply(this, arguments);
		}; // best we can do
	}
	
	if (hookStopPropagation) {
		var args = [element, eventName, eventHandler, useCapture];
		var hooks = Q.addEventListener.hooks;
		for (var i=0, l=hooks.length; i<l; ++i) {
			var hook = hooks[i];
			if (hook[0] === element
			&& hook[1] === eventName
			&& hook[2] === eventHandler
			&& hook[3] === useCapture) {
				hooks.splice(i, 1);
				break;
			}
		}
		hooks.push(args);
	}
	function _f() { }
	return handler;
};
Q.addEventListener.hooks = [];
function _Q_Event_stopPropagation() {
	var event = this;
	Q.each(Q.addEventListener.hooks, function () {
		var element = this[0];
		var matches = element === root
			|| element === document
			|| (element instanceof Element && element !== event.target && element.contains(event.target));
		if (matches && this[1] === event.type) {
			this[2].apply(element, [event]);
		}
	});
	var p = _Q_Event_stopPropagation.previous;
	if (p) {
		p.apply(event, arguments);
	} else {
		event.cancelBubble = true; // <-- must be true to stop bubbling
	}
}
_Q_Event_stopPropagation.previous = Event.prototype.stopPropagation;
Event.prototype.stopPropagation = _Q_Event_stopPropagation;

/**
 * Remove an event listener from an element
 * @static
 * @method removeEventListener
 * @param {HTMLElement|Array|NodeList} element An element, or array or NodeList of elements, on which
 *  Q.addEventListener was previously called.
 * @param {String|Array|Object|Function} eventName
 *  A space-delimited string of event names, or an array of event names.
 *  You can also pass an object of { eventName: eventHandler } pairs, in which csae
 *  the next parameter would be useCapture.
 *  You can also pass functions such as Q.Pointer.start here.
 * @param {Function} eventHandler Pass the same eventHandler as was passed to Q.addEventListener
 * @param {boolean} useCapture Pass the same useCapture as was passed to Q.addEventListener
 * @return {boolean} Should normally return true, unless listener could not be found or removed
 */
Q.removeEventListener = function _Q_removeEventListener(element, eventName, eventHandler, useCapture) {
	if (Q.isEmpty(element) || Q.isEmpty(eventHandler)) {
		return false;
	}
	if (Q.isArrayLike(element)) {
		for (var i=0, l=element.length; i<l; ++i) {
			Q.removeEventListener(element[i], eventName, eventHandler, useCapture);
		}
		return;
	}

	useCapture = useCapture || false;
	var handler = (eventHandler.typename === "Q.Event"
		? eventHandler.eventListener
		: eventHandler);
	if (handler.Q_wrapper) {
		handler = handler.Q_wrapper;
	}
	if (typeof eventName === 'string') {
		var split = eventName.split(' ');
		if (split.length > 1) {
			eventName = split;
		}
	}
	if (Q.isArrayLike(eventName)) {
		for (var i=0, l=eventName.length; i<l; ++i) {
			Q.removeEventListener(element, eventName[i], eventHandler, useCapture);
		}
		return;
	}
	if (typeof eventName === 'function') {
		var params = {
			original: function () {}
		};
		eventName(params);
		eventName = params.eventName;
		if (!eventName) {
			return false;
		}
	}
	if (element.removeEventListener) {
		element.removeEventListener(eventName, handler, !!useCapture);
	} else if (element.detachEvent) {
		element.detachEvent('on'+eventName, handler);
	} else {
		element["on"+eventName] = null; // best we can do
	}

	var hooks = Q.addEventListener.hooks;
	for (var i=hooks.length-1; i>=0; --i) {
		var hook = hooks[i];
		if (hook[0] === element
		&& hook[1] === eventName
		&& hook[2] === eventHandler
		&& hook[3] === useCapture) {
			hooks.splice(i, 1);
			break;
		}
	}
	return true;
};

/**
 * Call this function to set a notice that is shown when the page is almost about to be unloaded
 * @static
 * @method beforeUnload
 * @param notice {String} The notice to set. It should typically be worded so that "Cancel" cancels the unloading.
 * @required
 */
Q.beforeUnload = function _Q_beforeUnload(notice) {
	Q.addEventListener(window, 'beforeunload', function (e) {
		if (!notice) return undefined;
		e = e || window.event;
		if (e) { // For IE and Firefox (prior to 4)
			e.preventDefault(); // for newer browsers, but ignores notice
			e.returnValue = notice;
		}
		return notice; // For Safari and Chrome
	});
};

/**
 * Triggers a method or Q.Event on all the tools inside a particular element,
 * traversing in a depth-first manner.
 * @static
 * @method trigger
 * @param {String} eventName  Required, the name of the method or Q.Event to trigger
 * @required
 * @param {HTMLElement} element Optional element to traverse from (defaults to document.body).
 * @param {Array} args Any additional arguments that would be passed to the triggered method or event
 */
Q.trigger = function _Q_trigger(eventName, element, args) {
	var parts = eventName.split('.');
	Q.find(element || document.body, true, function _Q_trigger_found(toolElement) {
		_Q_trigger_recursive(Q.Tool.from(toolElement), eventName, args);
		return false;
	}, null);
};

/**
 * Call this function to trigger layout changes,
 * or assign it as an event listener to some events.
 * @param {Element} [element=document.documentElement]
 *  For any elements inside this container that Q.onLayout() was called on,
 *  handle the corresponding Q.Events, and trigger "Q.layout" methods, if any,
 *  on container elements.
 *  If a non-element is passed here (such as null, or a DOMEvent)
 *  then this defaults to the document element.
 * @param {Boolean} [force] Pass true here to handle Q.onLayout events
 *   even if ResizeObserver was added
 */
Q.layout = function _Q_layout(element, force) {
	if (!(element instanceof Element)) {
		element = null;
	}
	Q.each(_layoutElements, function (i, e) {
		if (!element || element.contains(e)) {
			var event = _layoutEvents[i];

			// return if ResizeObserver defined on this element
			if (!force && _layoutObservers[i]) {
				return;
			}

			event.handle.call(event, e, element);
		}
	});
};

/**
 * Returns whether Q.ready() has been called
 * @static
 * @method isReady
 * @return {boolean}
 */
Q.isReady = function _Q_isReady() {
	return _isReady;
};

/**
 * Returns whether the client is currently connected to the Internet.
 * In the future, this will not be a binary thing ;-)
 * @static
 * @method isOnline
 * @return {boolean}
 */
Q.isOnline = function _Q_isOnline() {
	return _isOnline;
};

/**
 * Loads a plugin
 * @static
 * @method load
 * @param {String|Array} plugins
 * @param {Function} callback
 * @param {Object} options
 */
Q.load = function _Q_load(plugins, callback, options) {
	var urls = [];
	if (typeof plugins === 'string') {
		plugins = plugins.split(' ').map(function (str) { return str.trim(); });
	}
	var baseUrl = Q.baseUrl();
	Q.each(plugins, function (i, plugin) {
		if (plugin && !Q.plugins[plugin]) {
			urls.push(baseUrl+'/Q/plugins/'+plugin+'/js/'+plugin+'.js');
		}
	});
	return Q.addScript(urls, callback, options);	
};

/**
 * Obtain a URL to request. Takes into account the Q_ct and Q_ut cookies
 * in order to work with Cordova file bundles, as well as Q.updateUrls()
 * @static
 * @method url
 * @param {Object|String|null} what
 *  Usually the stuff that comes after the base URL.
 *  If you don't provide this, then it just returns the Q.baseUrl()
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  Fields containing null and undefined are skipped.
 *  NOTE: only handles scalar values in the object.
 * @param {Object} [options] A hash of options, including:
 * @param {String} [options.baseUrl] A string to replace the default base url
 * @param {Number} [options.cacheBust] Number of milliseconds before a new cachebuster is appended
 * @param {Object} [options.info] if passed, extends this object with any info about the url
 */
Q.url = function _Q_url(what, fields, options) {
	var what2 = what || '';
	if (what2.startsWith('data:') || what2.startsWith('blob:')) {
		return what2; // this is a special type of URL
	}
	var parts = what2.split('?');
	var what3, tail, info, cb;
	if (fields) {
		for (var k in fields) {
			if (fields[k] !== undefined) {
				parts[1] = (parts[1] || "").queryField(k, fields[k]);
			}
		}
		what2 = parts[0] + (parts[1] ? '?' + parts[1] : '');
	}
	var baseUrl = (options && options.baseUrl) || Q.baseUrl() || "";
	what3 = Q.interpolateUrl(what2);
	if (baseUrl && what3.startsWith(baseUrl)) {
		tail = what3.substring(baseUrl.length+1);
		tail = tail.split('?')[0];
		info = Q.getObject(tail, Q.updateUrls.urls, '/');
	} else if (!what3.isUrl()) {
		info = Q.getObject(what3, Q.updateUrls.urls, '/');
	}
	if (info ) {
		if (Q.info.urls && Q.info.urls.caching && info.t) {
			parts = what3.split('?');
			if (parts.length > 1) {
				parts[1] = parts[1].queryField('Q.cb', info.t);
				what3 = parts[0] + '?' + parts[1];	
			} else {
				what3 = parts[0] + '?Q.cb=' + info.t;
			}
			if (info.cacheBaseUrl && info.t < Q.cookie('Q_ct')) {
				baseUrl = info.cacheBaseUrl;
			}
		}
		if (options && options.info) {
			Q.extend(options.info, 10, info);
		}
	} else if (options && options.cacheBust) {
		cb = options.cacheBust;
		what3 += "?Q.cb=" + Math.floor(Date.now()/1000/cb)*cb;
	}
	parts = what3.split('?');
	if (parts.length > 2) {
		what3 = parts.slice(0, 2).join('?') + '&' + parts.slice(2).join('&');
	}
	var result = '';
	if (!what) {
		result = baseUrl + (what === '' ? '/' : '');
	} else if (what3.isUrl()) {
		result = what3;
	} else {
		result = baseUrl + ((what3.substring(0, 1) == '/') ? '' : '/') + what3;
	}
	if (Q.url.options.beforeResult) {
		var params = {
			what: what3,
			fields: fields,
			result: result
		};
		Q.url.options.beforeResult.handle(params);
		result = params.result;
	}
	return result;
};

Q.url.options = {
	beforeResult: null
};

/**
 * Interpolate some standard placeholders inside a url, such as 
 * {{AppName}} or {{PluginName}}
 * @static
 * @method interpolateUrl
 * @param {String} url
 * @param {Object} [additional={}] Any additional substitutions
 * @return {String} The url with substitutions applied
 */
Q.interpolateUrl = function (url, additional) {
	if (url.indexOf('{{') < 0) {
		return url;
	}
	var substitutions = {};
	substitutions['baseUrl'] = substitutions[Q.info.app] = Q.baseUrl();
	substitutions['Q'] = Q.pluginBaseUrl('Q');
	substitutions['currentScriptPath'] = currentScriptPath;
	for (var plugin in Q.plugins) {
		substitutions[plugin] = Q.pluginBaseUrl(plugin);
	}
	url = url.interpolate(substitutions);
	if (additional) {
		url = url.interpolate(additional);
	}
	return url;
};

/**
 * You can override this function to do something special
 * @method pluginBaseUrl
 */
Q.pluginBaseUrl = function (plugin) {
	return 'Q/plugins/' + plugin;
};

/**
 * Get the URL for an action
 * @static
 * @method action
 * @param {String} uri
 *  A string of the form "Module/action" or an absolute url, which is returned unmodified.
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  NOTE: only handles scalar values in the object.
 * @param {Object} [options] A hash of options, including:
 * @param {String} [options.baseUrl] A string to replace the default base url
 * @param {Number} [options.cacheBust] Number of milliseconds before a new cachebuster is appended
 */
Q.action = function _Q_action(uri, fields, options) {
	if (uri.isUrl()) {
		return Q.url(uri, fields);
	}
	return Q.url("action.php/"+uri, fields, options);
};

/**
 * Extends a string or object to be used with AJAX
 * @static
 * @method ajaxExtend
 * @param {String} what
 *  If a string, then treats it as a URL and
 *  appends ajax fields to the end of the querystring.
 *  If an object, then adds properties to it.
 * @param {String|Object|Array} slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an object or array, converts it to a comma-separated list
 * @param {Object} options
 *  Optional. A hash of options, including:
 *  * @param {String} [options.echo] A string to echo back. Used to keep track of responses
 *  * @param {String} [options.method] if set, adds a &Q.method=$method to the querystring
 *  * @param {String|Function} [options.callback] if a string, adds a "&Q.callback="+encodeURIComponent(callback) to the querystring.
 *  * @param {Boolean} [options.iframe] if true, tells the server to render the response as HTML in an iframe, which should call the specified callback
 *  * @param {String} [options.loadExtras] if "all", asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load, can also be "response", "initial", "session" or "initial,session"
 *  * @param {Array} [options.idPrefixes] optional array of Q_Html::pushIdPrefix values for each slotName
 *  * @param {number} [options.timestamp] whether to include a timestamp (e.g. as a cache-breaker)
 * @return {String|Object}
 *  Returns the extended string or object
 */
Q.ajaxExtend = function _Q_ajaxExtend(what, slotNames, options) {
	if (!what && what !== '') {
		if (console && ('warn' in console)) {
			console.warn('Q.ajaxExtend received empty url');
		}
		return '';
	}
	options = options || {};
	var slotNames2 = (typeof slotNames === 'string')
		? slotNames 
		: Q.extend([], slotNames).join(',');
	var idPrefixes = options
		? ((typeof options.idPrefixes === 'string')
			? options.idPrefixes 
			: (options.idPrefixes && options.idPrefixes.join(',')))
		: '';
	var timestamp = Date.now();
	var formFactor = Q.info.forceFormFactor;
	var ajax = options.iframe ? 'iframe' : 'json';
	if (typeof what == 'string') {
		var p = what.split('#');
		var what2 = p[0];
		if (Q.info && Q.baseUrl() === what2) {
			what2 += '/'; // otherwise we will have 301 redirect with trailing slash on most servers
		}
		what2 += (what2.indexOf('?') < 0) ? '?' : '&';
		what2 += 'Q.ajax=' + encodeURIComponent(ajax);
		if (options.loadExtras) {
			var loadExtras = options.loadExtras === true ? 'all' : options.loadExtras;
			what2 += '&Q.loadExtras=' + encodeURIComponent(loadExtras);
		}
		if (options.timestamp) {
			what2 += encodeURI('&Q.timestamp=')+encodeURIComponent(timestamp);
		}
		if (slotNames2 != null) {
			what2 += encodeURI('&Q.slotNames=') + encodeURIComponent(slotNames2);
		}
		if (idPrefixes) {
			what2 += encodeURI('&Q.idPrefixes=') + encodeURIComponent(idPrefixes);
		}
		if (options) {
			if (typeof options.callback === 'string') {
				what2 += encodeURI('&Q.callback=') + encodeURIComponent(options.callback);
			}
			if ('echo' in options) {
				what2 += encodeURI('&Q.echo=') + encodeURIComponent(options.echo);
			}
			if (options.method) {
				what2 += encodeURI('&Q.method=' + encodeURIComponent(options.method.toUpperCase()));
			}
		}
		if (Q.nonce !== undefined) {
			what2 += encodeURI('&Q.nonce=') + encodeURIComponent(Q.nonce);
		}
		what2 = (p[1] ? what2 + '#' + p[1] : what2);
		if (formFactor) {
			what2 += '&Q.formFactor=' + formFactor; // propagate it
		}
	} else {
		// assume it's an object
		var what2 = {};
		for (var k in what) {
			what2[k] =  what[k];
		}
		what2["Q.ajax"] = ajax;
		if (options.timestamp) {
			what2["Q.timestamp"] = timestamp;
		}
		if (slotNames) {
			what2["Q.slotNames"] = slotNames2;
		}
		if (options) {
			if (options.callback) {
				what2["Q.callback"] = options.callback;
			}
			if ('echo' in options) {
				what2["Q.echo"] = options.echo;
			}
			if (options.method) {
				what2["Q.method"] = options.method;
			}
		}
		if ('nonce' in Q) {
			what2["Q.nonce"] = Q.nonce;
		}
		if (formFactor) {
			what2["Q.formFactor"] = formFactor; // propagate it
		}
	}
	return what2;
};

/**
 * A way to make requests that is cross-domain. Typically used for requesting JSON or various templates.
 * It uses script tags and JSONP callbacks for remote domains, and prefers XHR for the local domain.
 * @static
 * @method request
 * @param {Object} [fields]
 *  Optional object of fields to pass, syntactic sugar for adding fields to GET requests
 * @param {String} url
 *  The URL you pass will normally be automatically extended through Q.ajaxExtend
 * @param {String|Array} slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an array, converts it to a comma-separated list
 * @param {Function} callback
 *  The err and parsed content will be passed to this callback function,
 *  (unless parse is false, in which case the raw content is passed as a String),
 *  followed by a Boolean indicating whether a redirect was performed.
 * @param {Object} options
 *  A hash of options, including options that would be passed to Q.url(), but also these:
 * @param {String} [options.method="GET"] the HTTP method to use. If not "GET" and options.form is set, adds to url &Q.method= that value to the querystring, and uses POST method.
 * @param {Object} [options.fields] optional fields to pass with any method other than "get"
 * @param {Object} [options.formdata] if set, instead of fields, submits the formdata (including multipart form-data such as files, etc.) 
 * @param {HTMLElement} [options.form] if specified, then the request is made by submitting this form, temporarily extending it with any fields passed in options.fields, and possibly overriding its method with whatever is passed to options.method .
 * @param {Boolean} [options.dontTransformUrl] pass true to just use the passed URL without transforming it
 * @param {String} [options.resultFunction="result"] The path to the function to handle inside the
 *  contentWindow of the resulting iframe, e.g. "Foo.result". 
 *  Your document is supposed to define this function if it wants to return results to the
 *  callback's second parameter, otherwise it will be undefined
 * @param {Array} [options.idPrefixes] optional array of Q_Html::pushIdPrefix values for each slotName
 * @param {boolean} [options.skipNonce] if true, skips loading of the nonce
 * @param {Object} [options.xhr] set to false to avoid XHR. Or set to true, to try to make xhr based on "method" option.
 *	 Or pass an object with properties to merge onto the xhr object, including a special "sync" property to make the call synchronous.
 *	 Or pass a function which will be run before .send() is executed. First parameter is the xhr object, second is the options.
 * @param {Function} [options.preprocess] an optional function that takes the xhr object before the .send() is invoked on it
 * @param {boolean} [options.parse] set to false to pass the unparsed string to the callback
 * @param {boolean} [options.asJSON] set to true to have the payload be encoded as JSON, if method is not "GET"
 * @param {boolean} [options.extend=true] if false, the URL is not extended with Q fields.
 * @param {String} [options.loadExtras=null] if "all", asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load, can also be "response", "initial", "session" or "initial,session"
 * @param {boolean} [options.query=false] if true simply returns the query url without issuing the request
 * @param {String} [options.callbackName] if set, the URL is not extended with Q fields and the value is used to name the callback field in the request.
 * @param {boolean} [options.duplicate=true] you can set it to false in order not to fetch the same url again
 * @param {boolean} [options.quiet=true] this option is just passed to your onLoadStart/onLoadEnd handlers in case they want to respect it.
 * @param {boolean} [options.timestamp] whether to include a timestamp (e.g. as a cache-breaker)
 * @param {boolean} [options.timeout=5000] milliseconds to wait for response, before showing cancel button and triggering onTimeout event, if any, passed to the options
 * @param {boolean} [options.ignoreRedirect=false] if true, doesn't honor redirects and tries to process the scripts, css, etc. from the response
 * @param {Function|null} [options.onRedirect=Q.handle] if set and response data.redirect.url is not empty, automatically call this function. Set to null to block redirecting.
 * @param {Array} [options.beforeRequest] array of handlers to call before the request, they receive url, slotNames, options, callback and must call the callback passing (possibly altered) url, slotNames, options
 * @param {Q.Event} [options.onTimeout] handler to call when timeout is reached. First argument is a function which can be called to cancel loading.
 * @param {Q.Event} [options.onResponse] handler to call when the response comes back but before it is processed
 * @param {Q.Event} [options.onProcessed] handler to call when a response was processed
 * @param {Q.Event} [options.onLoadStart] handlers of this event will be called after the request is initiated, if "quiet" option is false they can add some visual indicators
 * @param {Q.Event} [options.onLoadEnd] handlers of this event will be called after the request is fully completed, if "quiet" option is false they can add some visual indicators
 * @return {Q.Request} Object corresponding to the request
 */
Q.request = function (url, slotNames, callback, options) {
	
	var fields, delim;
	if (typeof url === 'object') {
		fields = arguments[0];
		url = arguments[1];
		slotNames = arguments[2];
		callback = arguments[3];
		options = arguments[4];
		delim = (url.indexOf('?') < 0) ? '?' : '&';
		url += delim + Q.queryString(fields);
	}
	if (typeof slotNames === 'function') {
		options = callback;
		callback = slotNames;
		slotNames = [];
	} else if (typeof slotNames === 'string') {
		slotNames = slotNames.split(',');
	}
	var o = Q.extend({}, Q.request.options, options);
	if (!o.dontTransformUrl) {
		url = Q.url(url, null, options);
	}
	var request = new Q.Request(url, slotNames, callback, o);
	if (o.skipNonce) {
		_Q_Response_makeRequest.call(this, url, slotNames, callback, o);
	} else {
		Q.loadNonce(_Q_Response_makeRequest, this, [url, slotNames, callback, o]);
	}
	return request;
	
	function _Q_Response_makeRequest (url, slotNames, callback, o) {

		var tout = false, t = {};
		if (o.timeout !== false) {
			tout = o.timeout || Q.request.options.timeout;
		}
	
		function _Q_Response_callback(err, content, wasJSONP) {
			if (err) {
				Q.handle(callback, this, [err, content, false]);
				Q.handle(o.onProcessed, this, [err, content, false]);
				return;
			}
			var response = content;
			if (o.parse !== false) {
				try {
					if (wasJSONP) {
						response = content;
					} else {
						response = JSON.parse(content)
					}
				} catch (e) {
					console.warn('Q.request(' + url + ',['+slotNames+']):' + e);
					err = {"errors": [e]};
					callback(e, content);
					return Q.handle(o.onProcessed, this, [e, content]);
				}
			}
			var ret = callback && callback.call(this, err, response, response && response.redirect && response.redirect.url);
			Q.handle(o.onProcessed, this, [err, response]);
			if (ret === false) {
				return; // don't redirect
			}
			if (!o.ignoreRedirect && response && response.redirect && response.redirect.url) {
				Q.handle(o.onRedirect, Q, [response.redirect.url]);
			}
		};

		function _onStart () {
			Q.handle(o.onLoadStart, this, [url, slotNames, o]);
			if (tout !== false) {
				t.timeout = setTimeout(_onTimeout, tout);
			}
		}

		function _onTimeout () {
			if (!t.loaded) {
				Q.handle(o.onShowCancel, this, [_onCancel, o]);
				if (o.onTimeout) {
					o.onTimeout(_onCancel);
				}
			}
		}

		function _onResponse (response, wasJSONP) {
			t.loaded = true;
			if (t.timeout) {
				clearTimeout(t.timeout);
			}
			Q.handle(o.onLoadEnd, request, [url, slotNames, o]);
			if (!t.cancelled) {
				o.onResponse.handle.call(request, response, wasJSONP);
				_Q_Response_callback.call(request, null, response, wasJSONP);
			}
		}
		
		function _onCancel (status, msg) {
			var code, data;
			if (_documentIsUnloading) { // the document is about to go poof anyway
				return; // don't call any callbacks, avoiding possible alerts
			}
			status = Q.isInteger(status) ? status : null;
			if (this.response) {
				try {
					data = JSON.parse(this.response);
					msg = Q.getObject(['errors', 0, 'message'], data);
					code = Q.getObject(['errors', 0, 'code'], data);
				} catch (e) {
					data = null;
					msg = "Response is not in JSON format";
					console.warn('Q.request(' + url + ',['+slotNames+']): ' + msg);
				}
			}
			if (!msg) {
				var defaultError = status ? Q.text.Q.request.error : Q.text.Q.request.canceled;
				msg = (msg || Q.text.Q.request[status] || defaultError)
					.interpolate({'status': status, 'url': url})
			}
			t.cancelled = true;
			_onResponse();
			var errors = {
				errors: [Q.extend({}, data && data.errors[0], {
					message: msg || "Request was canceled",
					code: code || status,
					httpStatus: status
				})]
			};
			o.onCancel.handle.call(this, errors, o);
			_Q_Response_callback.call(this, errors, errors);
		}
		
		function xhr(onSuccess, onCancel) {
			if (o.extend !== false) {
				request.urlRequested
				= url
				= Q.ajaxExtend(url, slotNames, overrides);
			}			
			var xmlhttp;
			xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState == 4 && !xmlhttp.handled) {
					xmlhttp.handled = true;
					if (xmlhttp.status == 200) {
						onSuccess.call(xmlhttp, xmlhttp.responseText);
					} else {
						log("Q.request xhr: " + xmlhttp.status + ' ' 
							+ xmlhttp.responseText.substring(xmlhttp.responseText.indexOf('<body')));
						onCancel.call(xmlhttp, xmlhttp.status);
					}
				}
			};
			if (typeof o.xhr === 'function') {
				o.xhr.call(xmlhttp, xmlhttp, options);
			}
			var sync = (o.xhr === 'sync');
			if (Q.isPlainObject(o.xhr)) {
				Q.extend(xmlhttp, o.xhr);
				sync = sync || xmlhttp.sync;
			}
			var content = o.formdata ? o.formdata : Q.queryString(o.fields);
			request.xmlhttp = xmlhttp;
			if (verb === 'GET') {
				xmlhttp.open('GET', url + (content ? '&' + content : ''), !sync);
				xmlhttp.send();
			} else {
				xmlhttp.open(verb, url, !sync);
				if (o.asJSON) {
					content = JSON.stringify(o.fields);
					xmlhttp.setRequestHeader("Content-Type", "application/json");
				} else if (!o.formdata) {
					xmlhttp.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded');
				}
				//xmlhttp.setRequestHeader("Content-length", content.length);
				//xmlhttp.setRequestHeader("Connection", "close");
				xmlhttp.send(content);
			}
			return url;
		}
		
		var method = o.method || 'GET';
		var verb = method.toUpperCase();
		var overrides = {};
		if (o.loadExtras) {
			overrides.loadExtras = o.loadExtras;
		}

		if (verb !== 'GET') {
			verb = 'POST'; // browsers don't always support other HTTP verbs;
			overrides.method = o.method;
		}

		if (o.beforeRequest) {
			var chain = Q.chain(o.beforeRequest);
			chain(url, slotNames, o, _request);
		} else {
			_request(url, slotNames, o);
		}

		function _request(url, slotNames, o) {
			if (o.form) {
				if (o.extend !== false) {
					overrides.iframe = true;
					o.fields = Q.ajaxExtend(o.fields || {}, slotNames, overrides);
				}
				Q.formPost(url, o.fields, o.method, {
					form: o.form,
					onLoad: function (iframe) {
						var resultFunction = o.resultFunction
							? Q.getObject(o.resultFunction, iframe.contentWindow)
							: null;
						var result = typeof(resultFunction) === 'function' ? resultFunction() : undefined;
						_Q_Response_callback.call(request, null, result, true);
					}
				});
				return;
			}
	
			if (!o.query && o.xhr !== false
			&& (url.startsWith(Q.baseUrl()))) {
				_onStart();
				return xhr(_onResponse, _onCancel);
			}
	
			var i = Q.request.callbacks.length;
			var url2 = url;
			if (callback) {
				Q.request.callbacks[i] = function _Q_Response_JSONP(data) {
					delete Q.request.callbacks[i];
					Q.removeElement(script);
					_onResponse(data, true);
				};
				if (o.callbackName) {
					url2 = url + (url.indexOf('?') < 0 ? '?' : '&')
						+ encodeURIComponent(o.callbackName) + '='
						+ encodeURIComponent('Q.request.callbacks['+i+']');
				} else {
					url2 = (o.extend === false || o.dontTransformUrl)
						? url
						: Q.ajaxExtend(url, slotNames, Q.extend(o, {
							callback: 'Q.request.callbacks['+i+']'
						}));
				}
			} else {
				url2 = (o.extend === false) ? url : Q.ajaxExtend(url, slotNames, o);
			}
			if (options.fields) {
				delim = (url.indexOf('?') < 0) ? '?' : '&';
				url2 += delim + Q.queryString(options.fields);
			}
			if (!o.query) {
				var script = Q.addScript(url2, null, {'duplicate': o.duplicate});
			}
			request.urlRequested = url2;
		}
	}
};

Q.request.callbacks = []; // used by Q.request

Q.request.once = Q.getter(Q.request, {
	cache: Q.Cache.document('Q.request', 1)
});

/**
 * Try to find an error assuming typical error data structures for the arguments
 * @static
 * @method firstError
 * @param {Object} data An object where the errors may be found. You can pass as many of these as you want. If it contains "errors" property, then errors[0] is the first error. If it contains an "error" property, than that's the first error. Otherwise, for the first argument only, if it is nonempty, then it's considered an error.
 * @return {String|null} The first error message found, or null
 */
Q.firstError = function _Q_firstErro(data /*, data2, ... */) {
	var error = undefined;
	for (var i=0; i<arguments.length; ++i) {
		var d = arguments[i];
		if (Q.isEmpty(d)) {
			continue;
		}
		if (d.errors && d.errors[0]) {
			error = d.errors[0];
		} else if (d.error) {
			error = d.error;
		} else if (!i) {
			error = Q.isArrayLike(d) ? d[0] : d;
		}
		if (error) {
			break;
		}
	}
	return error || undefined;
};

/**
 * Try to find an error message assuming typical error data structures for the arguments
 * @static
 * @method firstErrorMessage
 * @param {Object} data An object where the errors may be found. You can pass as many of these as you want. If it contains "errors" property, then errors[0] is the first error. If it contains an "error" property, than that's the first error. Otherwise, for the first argument only, if it is nonempty, then it's considered an error.
 * @return {String|null} The first error message found, or null
 */
Q.firstErrorMessage = function _Q_firstErrorMessage(data /*, data2, ... */) {
	var error = Q.firstError.apply(this, arguments);
	if (!error) {
		return undefined;
	}
	return (typeof error === 'string')
		? error
		: (error && error.message ? error.message : JSON.stringify(error));
};

/**
 * Serialize a plain object, with possible sub-objects, into an http querystring.
 * @static
 * @method queryString
 * @param {Object|String|HTMLElement} fields
 *  The object to serialize into a querystring that can be sent to PHP or something.
 *  The algorithm will recursively walk the object, and skip undefined values.
 *  You can also pass a form element here. If you pass a string, it will simply be returned.
 * @param {Array|true} keys
 *  An optional array of keys into the object, in the order to serialize things.
 *  Or, pass true here to sort keys by ascending string order, recursively inside objects too.
 * @param {boolean} returnAsObject
 *  Pass true here to get an object of {fieldname: value} instead of a string
 * @param {Object} [options]
 * @param {boolean} [options.convertBooleanToInteger=false] Whether to convert true,false into 1,0
 * @return {String|Object}
 *  A querystring that can be used with HTTP requests.
 */
Q.queryString = function _Q_queryString(fields, keys, returnAsObject, options) {
	if (Q.isEmpty(fields)) {
		return returnAsObject ? {} : '';
	}
	if (typeof fields === 'string') {
		return fields;
	}
	if (fields instanceof Element) {
		if (fields.tagName.toUpperCase() !== 'FORM') {
			throw new Q.Error("Q.queryString: element must be a FORM");
		}
		var result = '';
		Q.each(fields.querySelectorAll('input, textarea, select'), function () {
			var value = (this.tagName.toUpperCase() === 'SELECT')
				? this.options[this.selectedIndex].value
				: this.value;
			result += (result ? '&' : '') + this.getAttribute('name')
				+ '=' + encodeURIComponent(value);
		});
		return result;
	}
	var parts = [];
	function _params(prefix, obj) {
		if (obj == undefined) {
			return;
		}
		if (Q.isArrayLike(obj)) {
			// Serialize array item.
			Q.each(obj, function _Q_param_each(i, value) {
				if (/\[\]$/.test(prefix)) {
					// Treat each array item as a scalar.
					_add(prefix, value);
				} else {
					_params(prefix + "[" + (Q.typeOf(value) === "object" || Q.typeOf(value) === "array" ? i : "") + "]", value, _add);
				}
			});
		} else if (obj && Q.typeOf(obj) === "object") {
			// Serialize object item.
			var keys2 = Object.keys(obj);
			if (keys === true) {
				keys2.sort();
			}
			for (var i=0; i<keys2.length; ++i) {
				var name = keys2[i];
				_params(prefix + "[" + name + "]", obj[name], _add);
			}
		} else {
			// Serialize scalar item.
			_add(prefix, obj);
		}
	}
	
	var result = {};
	
	function _add(key, value) {
		if (value == undefined || Q.typeOf(value) == 'function') {
			return;
		}
		if (options && options.convertBooleanToInteger) {
			value = (value === true) ? 1 : (value === false ? 0 : value);
		}
		if (returnAsObject) {
			result[key] = value;
		} else {
			parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
		}
	}

	if (keys) {
		var keys2 = (keys !== true)
			? keys
			: (Q.isArrayLike(fields) && fields.map
				? fields.map(function (e, i) { return i; }) 
				: Object.keys(fields).sort()
			);
		Q.each(keys2, function _Q_param_each(i, field) {
			_params(field, fields[field]);
		});
	} else {
		Q.each(fields, function _Q_param_each(field, value) {
			_params(field, value);
		});
	}

	// Return the resulting serialization
	return returnAsObject
		? result
		: parts.join("&").replace(/%20/g, "+");
};

/**
 * Uses a form to do a real POST, but doesn't have a callback
 * Useful for convincing Safari to stop blocking third-party cookies
 * Technically we could use AJAX and CORS instead, and then we could have a callback.
 * @static
 * @method formPost
 * @param {String|HTMLElement} action The form action. You can also pass an
 *  HTML form element here, and skip fields and method.
 * @param {Object} [fields]  The parameters of the form
 * @param {String} [method] The method with which to submit the form. Defaults to the form's method, or "post" if missing.
 * @param {Object|Boolean} options 
 *  You can pass true here to just submit the form and load the results in a new page in this window.
 *  Or provide an optional object which can contain the following:
 * @param {String} [options.target] the name of a window or iframe to use as the target.
 * @param {HTMLElement} [options.iframe] the iframe to use. If not provided, this is filled to point to a newly created iframe object.
 * @param {Q.Event} [options.onLoad] callback to call when results are loaded in the iframe. Ignored if options.target is specified.
 * @param {HTMLElement} [options.form] the form to use. In this case, the action, fields and method are ignored.
 */
Q.formPost = function _Q_formPost(action, fields, method, options) {
	var _sugar = 0;
	if (action && (action instanceof Element) && typeof action.action === 'string') {
		options = fields;
		fields = null;
		method = null;
		_sugar = 1;
	}
	if (typeof options === 'function') {
		options = {onLoad: options};
	} else if (options === true) {
		options = {straight: true};
	} else {
		options = options || {};
	}
	var o = Q.copy(options);
	if (_sugar == 1) {
		o.form = action;
		action = o.form.action;
		method = o.form.method;
	} else {
		method = method || (o.form && o.form.method) || "POST";
		action = action || (o.form && o.form.action) || "";
	}
	method = method.toUpperCase();
	var onload;
	if (o.onLoad) {
		onload = (o.onLoad.typename === 'Q.Event')
			? o.onLoad.handle
			: o.onLoad;
	}
	var name = o.target;
	var iframeProvided = o.iframe;
	var iframe;
	if (!name) {
		iframe = o.iframe;
		if (iframe) {
			name = iframe.getAttribute('name');
		}
		if (!name) {
			name = 'Q_formPost_iframe_' + (++Q.formPost.counter % 1000);
			// we only need 1000 because we remove iframes after they successfully load
		}
		if (!o.iframe) {
			iframe = options.iframe = document.createElement('iframe');
			iframe.width = iframe.height = iframe.marginWidth = iframe.marginHeight = 0;
		}
		iframe.setAttribute("name", name);
		iframe.setAttribute("id", name);
	}
	var form = o.form, oldMethod, oldAction;
	if (form) {
		oldMethod = form.method;
		oldAction = form.action;
	} else {
		form = document.createElement('form');
	}
	form.setAttribute("method", method);
	form.setAttribute("action", action);

	var hiddenFields = [];
	var fields2 = Q.queryString(fields, null, true);
	for (var key in fields2) {
		if (fields2.hasOwnProperty(key)) {
			var hiddenField = document.createElement("input");
			hiddenField.setAttribute("type", "hidden");
			hiddenField.setAttribute("name", key);
			hiddenField.setAttribute("value", fields2[key]);
			form.appendChild(hiddenField);
			hiddenFields.push(hiddenField);
		 }
	}

	if (iframe && !iframeProvided) {
		document.body.appendChild(iframe);
	}
	if (iframe) {
		Q.addEventListener(iframe, 'load', function _Q_formPost_loaded() {
			Q.handle(onload, this, [iframe]);
			if (!iframeProvided && iframe.parentElement) {
				// iframe has loaded everything, and onload callback completed
				// time to remove it from the DOM
				// if someone still needs it, they should have saved a reference to it.
				Q.removeElement(iframe);
			}
		});
	}

	if (!o.form) document.body.appendChild(form);
	if (!o.straight) {
		form.setAttribute("target", name);
	}
	form.submit();
	setTimeout(function () {
		if (!o.form) {
			Q.removeElement(form, true);
		} else {
			for (var i=hiddenFields.length-1; i>=0; --i) {
				Q.removeElement(hiddenFields[i]);
			}
			form.action = oldAction;
			form.method = oldMethod;
		}
	}, 0);
};
Q.formPost.counter = 0;

/**
 * Requests a diff from the server to find any updates to files since
 * the last Q_ut timestamp, then saves current timestamp in Q_ut cookie.
 * @param {Function} callback
 */
Q.updateUrls = function(callback) {
	var timestamp, earliest, url, json, ut = Q.cookie('Q_ut');
	try {
		var lut = root.localStorage.getItem(Q.updateUrls.timestampKey);
	} catch (e) {}
	if (ut && !lut) {
		Q.request('Q/urls/urls/latest.json', [], function (err, result) {
			Q.updateUrls.urls = result;
			json = JSON.stringify(Q.updateUrls.urls);
			root.localStorage.setItem(Q.updateUrls.urlsKey, json);
			if (timestamp = result['@timestamp']) {
				root.localStorage.setItem(Q.updateUrls.timestampKey, timestamp);
				Q.cookie('Q_ut', timestamp);
			}
			if (earliest = result['@earliest']) {
				root.localStorage.setItem(Q.updateUrls.earliestKey, earliest);
			}
			Q.handle(callback, null, [result, timestamp]);
		}, {extend: false, cacheBust: 1000, skipNonce: true});
	} else if (ut && ut !== lut) {
		url = 'Q/urls/diffs/' + lut + '.json';
		Q.request(url, [], function (err, result) {
			if (err) {
				// we couldn't find a diff, so let's reload the latest.json
				Q.request('Q/urls/urls/latest.json', function (err, result) {
					_update(result);
				}, { extend: false, cacheBust: 1000 });
				console.warn("Q.updateUrls couldn't load or parse " + url);
			} else {
				_update(result);
			}
			function _update(result) {
				try {
					var urls = JSON.parse(root.localStorage.getItem('Q.updateUrls.urls'));
				} catch (e) {}
				if (!Q.isEmpty(urls)) {
					Q.updateUrls.urls = urls;
					Q.extend(Q.updateUrls.urls, 100, result);
				}
				json = JSON.stringify(Q.updateUrls.urls);
				root.localStorage.setItem(Q.updateUrls.urlsKey, json);
				if (timestamp = result['@timestamp']) {
					root.localStorage.setItem(Q.updateUrls.timestampKey, timestamp);
					Q.cookie('Q_ut', timestamp);
				}
				if (earliest = result['@earliest']) {
					root.localStorage.setItem(Q.updateUrls.earliestKey, earliest);
				}
				Q.handle(callback, null, [result, timestamp]);
			}
		}, { extend: false, cacheBust: 1000, skipNonce: true });
	} else {
		Q.handle(callback, null, [{}, null]);
	}
};

Q.updateUrls.urlsKey = 'Q.updateUrls.urls';
Q.updateUrls.earliestKey = 'Q.updateUrls.earliest';
Q.updateUrls.timestampKey = 'Q.updateUrls.timestamp';
try {
	Q.updateUrls.urls = JSON.parse(root.localStorage.getItem(Q.updateUrls.urlsKey) || "{}");
} catch (e) {}

/**
 * Adds a reference to a javascript, if it's not already there
 * @static
 * @method addScript
 * @param {String|Array} src The script url or an array of script urls
 * @param {Function} onload
 * @param {Object} [options]
 *  Optional. A hash of options, including options for Q.url() and these:
 * @param {String} [options.type='text/javascript'] Type attribute of script tag
 * @param {Boolean} [options.async] do not wait for previous scripts and don't block future scripts
 * @param {Boolean} [options.duplicate] if true, adds script even if one with that src was already loaded
 * @param {Boolean} [options.querystringMatters] if true, then different querystring is considered as different, even if duplicate option is false
 * @param {Boolean} [options.skipIntegrity] if true, skips adding "integrity" attribute even if one can be calculated
 * @param {Boolean} [options.onError] optional function that may be called in newer browsers if the script fails to load. Its this object is the script tag.
 * @param {Boolean} [options.ignoreLoadingErrors] If true, ignores any errors in loading scripts.
 * @param {Boolean} [options.container] An element to which the stylesheet should be appended (unless it already exists in the document).
 * @param {Boolean} [options.returnAll] If true, returns all the script elements instead of just the new ones
 * @return {Array} An array of SCRIPT elements
 */
Q.addScript = function _Q_addScript(src, onload, options) {

	function stateChangeInIE() { // function to watch scripts load in IE
		// Execute as many scripts in order as we can
		var script;
		while (_pendingIEScripts[0]
		&& (_pendingIEScripts[0].readyState == 'loaded' 
			|| _pendingIEScripts[0].readyState == 'complete'
		)) {
			script = _pendingIEScripts.shift();
			script.onreadystatechange = null; // avoid future loading events from this script (eg, if src changes)
			container.appendChild(script);
			onload2(null, script, script.src);
		}
	}
	
	function onload2(e, s, u) {
		var cb;
		if (this && ('readyState' in this) && (this.readyState !== 'complete' && this.readyState !== 'loaded')) {
			return;	
		}
		if (s) {
			script = s;
			src = u;
		} else if (onload2.executed) {
			return;
		}
		var targetsrc = src.split('?')[0];
		Q.addScript.loaded[targetsrc] = true;
		while ((cb = Q.addScript.onLoadCallbacks[targetsrc].shift())) {
			Q.nonce = Q.nonce || Q.cookie('Q_nonce');
			cb.call(this);
		}
		script.onload = script.onreadystatechange = null; // Handle memory leak in IE
		onload2.executed = true;
	}

	function onerror2(e) {
		if (o.ignoreLoadingErrors) {
			return onload2(e);
		}
		if (onerror2.executed) {
			return;
		}
		var cb;
		Q.addScript.loaded[src2] = false;
		if (Q.addScript.onErrorCallbacks[src2]) {
			while ((cb = Q.addScript.onErrorCallbacks[src2].shift())) {
				cb.call(this);
			}
		}
		onerror2.executed = true;
	}

	function _onload() {
		Q.addScript.loaded[src2] = true;
		onload();
	}

	if (!onload) {
		onload = function () {};
	}

	if (Q.isArrayLike(src)) {
		var pipe, ret = [];
		var srcs = [];
		Q.each(src, function (i, src) {
			if (!src) return;
			srcs.push((src && src.src) ? src.src : src);
		});
		if (Q.isEmpty(srcs)) {
			onload();
			return [];
		}
		pipe = new Q.Pipe(srcs, onload);
		Q.each(srcs, function (i, src) {
			ret.push(Q.addScript(src, pipe.fill(src), options));
		});
		return ret;
	}

	var o = Q.extend({}, Q.addScript.options, options);
	var firstScript = document.scripts ? document.scripts[0] : document.getElementsByTagName('script')[0];
	var container = o.container || document.head  || document.getElementsByTagName('head')[0];
		
	if (!onload) {
		onload = function() { };
	}
	
	var script, i, p;
	_onload.loaded = {};
	src = (src && src.src) ? src.src : src;
	if (!src) {
		return null;
	}
	options = options || {};
	options.info = {};
	src = Q.url(src, null, options);
	var src2 = src.split('?')[0];
	
	if (!o.duplicate) {
		if (!o.querystringMatters && Q.addScript.loaded[src2]) {
			_onload();
			return o.returnAll ? null : false;
		}
		var scripts = document.getElementsByTagName('script');
		var ieStyle = _pendingIEScripts.length;
		if (ieStyle) {
			var arr = [].concat(_pendingIEScripts);
			for (i=0; i<scripts.length; ++i) {
				arr.push(scripts[i]);
			}
			scripts = arr;
		}
		for (i=0; i<scripts.length; ++i) {
			script = scripts[i];
			var s = script.getAttribute('src');
			if (!s || (o.querystringMatters
				? s !== src
				: s.split('?')[0] !== src2
			)) {
				continue;
			}
			// move the element to the right container if necessary
			// hopefully, moving the script element won't change the order of execution
			p = script;
			var outside = true;
			while (p = p.parentElement) {
				if (p === container) {
					outside = false;
    				break;
				}
			}
			if (outside && !ieStyle) {
				container.appendChild(script);
			}
			// the script already exists in the document
			if (Q.addScript.loaded[src2] || Q.addScript.loaded[src2]) {
				// the script was already loaded successfully
				_onload(script);
				return o.returnAll ? script : false;
			}
			if (Q.addScript.loaded[src2] === false) {
				// the script had an error when loading
				if (o.ignoreLoadingErrors) {
					_onload(script);
				} else if (o.onError) {
					o.onError.call(script);
				}
				return o.returnAll ? script : false;
			}
			if (!Q.addScript.added[src2]
			&& !script.wasProcessedByQ
			&& (!('readyState' in script)
			|| (script.readyState !== 'complete'
			|| script.readyState !== 'loaded'))) {
				// the script was added by someone else (and hopefully loaded)
				// we can't always know whether to call the error handler
				// if we got here, we might as well call onload
				_onload();
				return o.returnAll ? script : false;
			}
			// this is our script, the script hasn't yet loaded, so register onload2 and onerror2 callbacks
			if (!Q.addScript.onLoadCallbacks[src2]) {
				Q.addScript.onLoadCallbacks[src2] = [];
			}
			if (!Q.addScript.onErrorCallbacks[src2]) {
				Q.addScript.onErrorCallbacks[src2] = [];
			}
			Q.addScript.onLoadCallbacks[src2].push(onload);
			if (o.onError) {
				Q.addScript.onErrorCallbacks[src2].push(o.onError);
			}
			if (!script.wasProcessedByQ) {
				script.onload = onload2;
				script.onreadystatechange = onload2; // for IE
				Q.addEventListener(script, 'error', onerror2);
				script.wasProcessedByQ = true;
			}
			return o.returnAll ? script : false; // don't add this script to the DOM
		}
	}

	// Create the script tag and insert it into the document
	script = document.createElement('script');
	script.setAttribute('type', Q.getObject("type", options) || 'text/javascript');
	if (options.info.h && !options.skipIntegrity) {
		if (Q.info.urls && Q.info.urls.integrity) {
			script.setAttribute('integrity', 'sha256-' + options.info.h);
		}
	}
	if (o.async) {
		script.async = true;
	}
	Q.addScript.added[src2] = true;
	Q.addScript.onLoadCallbacks[src2] = [_onload];
	Q.addScript.onErrorCallbacks[src2] = [];
	if (o.onError) {
		Q.addScript.onErrorCallbacks[src2].push(o.onError);
	}
	Q.addEventListener(script, 'load', onload2);
	Q.addEventListener(script, 'error', onerror2);
	script.wasProcessedByQ = true;
	
	if ('async' in script) { // modern browsers
		script.setAttribute('src', src);
		if (!o.async) {
			script.async = false;
		}
		container.appendChild(script);
	} else if (firstScript.readyState) { // IE<10
		// create a script and add it to our todo pile
		_pendingIEScripts.push(script);
		script.onreadystatechange = stateChangeInIE; // listen for state changes
		script.src = src; // setting src after onreadystatechange listener is necessary for cached scripts
	} else { // fall back to defer
		script.setAttribute('defer', 'defer');
		script.setAttribute('src', src);
		container.appendChild(script);
	}
	return script;
};

Q.addScript.onLoadCallbacks = {};
Q.addScript.onErrorCallbacks = {};
Q.addScript.added = {};
Q.addScript.loaded = {};
var _pendingIEScripts = [];

Q.addScript.options = {
	duplicate: false,
	ignoreLoadingErrors: false
};

/**
 * Exports one or more variables from a javascript file,
 * which works with Q.require() a bit similarly to Node.js.
 * The arguments you pass to this function will be passed
 * as arguments to the callback of Q.require() whenever it requires
 * the file in which this is called. They will also be saved,
 * for subsequent calls of Q.require().
 * @method exports
 * @static
 */
Q.exports = function () {
	var src = Q.currentScript(1).src;
	_exports[src] = Array.prototype.slice.call(arguments, 0);
};

/**
 * This is an alternative to the Q.import() function,
 * which works with Q.exports() a bit similarly to Node.js.
 * Loads the Javascript file and then executes the callback,
 * The code in the file is supposed to synchronously call Q.exports()
 * and pass arguments to it which are then passed as arguments
 * to the callback. If the code was loaded and Q.exports() was
 * already called, then the callback is called with saved arguments.
 * @method require
 * @static
 * @param {String} src The src of the script to load, will be processed by Q.url()
 * @param {Function} callback Called after the script loads
 * @param {Boolean} synchronously Whether to call the callback synchronously when src was already loaded
 * @param {Boolean} memoized Set to true, to memoize return value and re-use it instead of calling it again
 */
Q.require = function (src, callback, synchronously, once) {
	if (!src || typeof src !== 'string') {
		throw new Q.Exception("Q.require: invalid script src");
	}
	src = Q.url(src);
	var srcWithoutQuerystring = src.split('?')[0];
	var value = _exports[src] || _exports[srcWithoutQuerystring];
	if (value !== undefined) {
		if (synchronously) {
			Q.handle(callback, Q, value);
		} else {
			setTimeout(function () {
				Q.handle(callback, Q, value);
			}, 0);
		}
		return;
	}
	Q.addScript(src, function _Q_require_callback(err) {
		if (err) {
			return Q.handle(callback, Q.Exception, [err]);
		}
		var value = _exports[src] || _exports[srcWithoutQuerystring];
		Q.handle(callback, Q, value || []);
	});
};

/**
 * Used to load a module, using the built-in import() function.
 * This wrapper is here so we can more easily log and trace where
 * files have been imported from.
 * @method import
 * @static
 * @param {String} src The src of the module to load, will be processed by Q.url()
 * @return {Promise} A promise that resolves to whatever was exported by the module
 */
Q.import = function (src) {
	Q.handle(Q.import.onCall, Q, [src]);
	return this.import(Q.url(src));
};

Q.import.onCall = new Q.Event();

var _exports = {};

/**
 * Adds a reference to a stylesheet, if it's not already there
 * @static
 * @method addStylesheet
 * @param {String} href
 * @param {String} media
 * @param {Function} onload
 * @param {Object} [options]
 *  Optional. A hash of options, including options for Q.url() and these:
 * @param {Boolean} [options.slotName] The slot name to which the stylesheet should be added, used to control the order they're applied in.
 *  Do not use together with container option.
 * @param {HTMLElement} [options.container] An element to which the stylesheet should be appended (unless it already exists in the document)
 *  Although this won't result in valid HTML, all browsers support it, and it enables the CSS to later be easily removed at runtime.
 * @param {Boolean} [options.ignoreLoadingErrors=false] If true, ignores any errors in loading scripts.
 * @param {Boolean} [options.querystringMatters] if true, then different querystring is considered as different, even if duplicate option is false
 * @param {Boolean} [options.skipIntegrity] if true, skips adding "integrity" attribute even if one can be calculated
 * @param {Boolean} [options.returnAll=false] If true, returns all the link elements instead of just the new ones
 * @return {Array} Returns an aray of LINK elements
 */
Q.addStylesheet = function _Q_addStylesheet(href, media, onload, options) {

	function onload2(e) {
		if (onload2.executed) {
			return;
		}
		if (('readyState' in this) &&
			(this.readyState !== 'complete' && this.readyState !== 'loaded')) {
			return;
		}
		var targethref = href.split('?')[0];
		Q.addStylesheet.loaded[targethref] = true;
		var cb;
		while ((cb = Q.addStylesheet.onLoadCallbacks[targethref].shift())) {
			cb.call(this);
		}
		onload2.executed = true;
	}

	function onerror2(e) {
		if (o.ignoreLoadingErrors) {
			return onload2(e);
		}
		if (onerror2.executed) {
			return;
		}
		var cb;
		Q.addStylesheet.loaded[href2] = false;
		if (Q.addStylesheet.onErrorCallbacks[href2]) {
			while ((cb = Q.addStylesheet.onErrorCallbacks[href2].shift())) {
				cb.call(this);
			}
		}
		onerror2.executed = true;
	}

	function _onload() {
		Q.addStylesheet.loaded[href2] = true;
		onload();
	}

	if (typeof media === 'function') {
		options = onload; onload = media; media = undefined;
	} else if (Q.isPlainObject(media) && !(media instanceof Q.Event)) {
		options = media; media = null;
	}
	var o = Q.extend({}, Q.addScript.options, options);
	if (!o.slotName && Q.Tool.beingActivated) {
		var n = Q.Tool.names[Q.Tool.beingActivated.name];
		if (n) {
			o.slotName = n.split('/')[0];
		}
	}
	if (!onload) {
		onload = function () { };
	}
	if (Q.isArrayLike(href)) {
		var pipe, ret = [];
		var hrefs = [];
		Q.each(href, function (i, href) {
			if (!href) return;
			hrefs.push((href && href.href) ? href.href : href);
		});
		if (Q.isEmpty(hrefs)) {
			onload();
			return [];
		}
		pipe = new Q.Pipe(hrefs, 1, onload);
		Q.each(hrefs, function (i, href) {
			ret.push(Q.addStylesheet(href, media, pipe.fill(href), options));
		});
		return ret;
	}
	var container = o.container || document.getElementsByTagName('head')[0];

	if (!href) {
		onload(false);
		return false;
	}
	o.info = {};
	href = Q.url(href, null, options);
	var href2 = href.split('?')[0];
	
	if (!o.querystringMatters && Q.addStylesheet.loaded[href2]) {
		_onload();
		return o.returnAll ? null : false;
	}
	if (!media) {
		media = 'screen,print';
	}
	var elements = document.querySelectorAll('link[rel=stylesheet],style[data-slot]');
	var i, e, h, m;
	for (i=0; i<elements.length; ++i) {
		e = elements[i];
		m = e.getAttribute('media');
		h = elements[i].getAttribute('href')
		 || elements[i].getAttribute('data-href');
		if ((m && m !== media) || !h || h.split('?')[0] !== href2) {
			continue;
		}
		// A link element with this media and href is already found in the document.
		// Move the element to the right container if necessary
		// (This may change the order in which stylesheets are applied).
		var p = e, outside = true;
		while (p = p.parentElement) {
			if (p === container) {
				outside = false;
				break;
			}
		}
		if (outside) {
			container.appendChild(e);
		}
		if (!Q.addStylesheet.added[href2]
		&& !e.wasProcessedByQ
		&& (!('readyState' in e)
		|| (e.readyState !== 'complete'
		|| e.readyState !== 'loaded'))) {
			// the stylesheet was added by someone else (and hopefully loaded)
			// we can't always know whether to call the error handler
			// if we got here, we might as well call onload
			_onload();
			return o.returnAll ? e : false;
		}
		if (Q.addStylesheet.loaded[href]
		|| Q.addStylesheet.loaded[href2]
		|| !Q.addStylesheet.added[href2]) {
			onload();
			return o.returnAll ? e : false;
		}
		if (!Q.addStylesheet.onLoadCallbacks[href2]) {
			Q.addStylesheet.onLoadCallbacks[href2] = [];
		}
		if (!Q.addStylesheet.onErrorCallbacks[href2]) {
			Q.addStylesheet.onErrorCallbacks[href2] = [];
		}
		Q.addStylesheet.onLoadCallbacks[href2].push(onload);
		if (o.onError) {
			Q.addStylesheet.onErrorCallbacks[href2].push(o.onError);
		}
		if (!e.wasProcessedByQ) {
			if (Q.info.isAndroidStock) {
				setTimeout(function () { // it doesn't support onload
					onload2.call(e); // let's simulate onload optimistically
				}, 100);
			} else {
				Q.addEventListener(e, 'load', onload2);
				Q.addEventListener(e, 'error', onerror2);
				e.onreadystatechange = onload2; // for IE8
			}
			e.wasProcessedByQ = true;
		}
		return o.returnAll ? e : false; // don't add
	}

	// Create the stylesheet's tag and insert it into the document
	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('type', 'text/css');
	link.setAttribute('media', media);
	if (o.info.h && !o.skipIntegrity) {
		if (Q.info.urls && Q.info.urls.integrity) {
			link.setAttribute('integrity', 'sha256-' + o.info.h);
		}
	}
	Q.addStylesheet.added[href] = true;
	Q.addStylesheet.onLoadCallbacks[href2] = [onload];
	link.onload = onload2;
	link.onreadystatechange = onload2; // for IE
	link.setAttribute('href', href);
	var elements2 = document.querySelectorAll('link[data-slot], style[data-slot]');
	var insertBefore = null;
	if (Q.allSlotNames && o.slotName) {
		link.setAttribute('data-slot', o.slotName);
		var slotIndex = Q.allSlotNames.indexOf(o.slotName);
		for (var j=0; j<elements2.length; ++j) {
			e = elements2[j];
			var slotName = e.getAttribute('data-slot');
			if (Q.allSlotNames.indexOf(slotName) > slotIndex) {
				insertBefore = e;
				break;
			}
		}
	}
	if (insertBefore) {
		insertBefore.parentElement.insertBefore(link, insertBefore);
	} else {
		container.appendChild(link);
	}
	// By now all widespread browser versions support at least one of the above methods:
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#Browser_compatibility
	return link;
};


Q.addStylesheet.onLoadCallbacks = {};
Q.addStylesheet.onErrorCallbacks = {};
Q.addStylesheet.added = {};
Q.addStylesheet.loaded = {};

/**
 * Gets, sets or a deletes a cookie
 * @static
 * @method cookie
 * @param {String} name
 *   The name of the cookie
 * @param {Mixed} value
 *   Optional. If passed, this is the new value of the cookie.
 *   If null is passed here, the cookie is "deleted".
 * @param {Object} options
 *   Optional hash of options, including:
 * @param {number} [options.expires] number of milliseconds until expiration. Defaults to session cookie.
 * @param {String} [options.domain] the domain to set cookie. If you leave it blank,
 *  then the cookie will be set as a host-only cookie, meaning that subdomains won't get it.
 * @param {String} [options.path] path to set cookie. Defaults to path from Q.baseUrl()
 * @return {String|null|false}
 *   If only name was passed, returns the stored value of the cookie, or null.
 *   Returns false if cookie operations are blocked (e.g. exception is thrown by the browser)
 */
Q.cookie = function _Q_cookie(name, value, options) {
	try {
		var parts;
		options = options || {};
		if (typeof value != 'undefined') {
			var path, domain = '';
			parts = Q.baseUrl().split('://');
			if ('path' in options) {
				path = ';path='+options.path;
			} else if (parts[1]) {
				path = ';path=/' + parts[1].split('/').slice(1).join('/');
			} else {
				return null;
			}
			if ('domain' in options) {
				domain = ';domain='+options.domain;
			} else {
				// remove any possibly conflicting cookies from .hostname, with same path
				var o = Q.copy(options);
				var hostname = parts[1].split('/').shift();
				o.domain = '.'+hostname;
				Q.cookie(name, null, o);
				domain = ''; //';domain=' + hostname;
			}
			if (value === null) {
				document.cookie = encodeURIComponent(name)+'=;expires=Thu, 01-Jan-1970 00:00:01 GMT'+path+domain;
				return null;
			}
			var expires = '';
			if (options.expires) {
				expires = new Date();
				expires.setTime((new Date()).getTime() + options.expires);
				expires = ';expires='+expires.toGMTString();
			}
			document.cookie = encodeURIComponent(name)+'='+encodeURIComponent(value)+expires+path+domain;
			return null;
		}
	
		// Otherwise, return the value
		var cookies = document.cookie.split(';'), result;
		for (var i=0; i<cookies.length; ++i) {
			parts = cookies[i].split('=');
			result = parts.splice(0, 1);
			result.push(parts.join('='));
			if (decodeURIComponent(result[0].trim()) === name) {
				return result.length < 2 ? null : decodeURIComponent(result[1]);
			}
		}
		return null;
	} catch (e) {
		return false;
	}
};

/**
 * Get the name of the session cookie
 * @method sessionName 
 * @static
 * @return {string}
 */
Q.sessionName = function () {
	return Q.info.sessionName || 'Q_sessionId';
};

/**
 * Get the value of the session cookie
 * @method sessionId
 * @static
 * @return {string}
 */
Q.sessionId = function () {
	return Q.cookie(Q.sessionName());
};

/**
 * Finds all elements that contain a class matching the filter,
 * and calls the callback for each of them.
 * @static
 * @method find
 * @param {HTMLElement|Array} elem
 *  An element, or an array of elements, within which to search
 * @param {String|RegExp|true|null} filter
 *  The name of the class or attribute to match
 * @param {Function} callbackBefore
 *  A function to run when a match is found (before the children).
 *  If it returns true, the Q.find function doesn't search further inside that element.
 *  If it returns false, the Q.find function stops searching.
 *  Otherwise, the Q.find function continues to search inside the element.
 * @param {Function} callbackAfter
 *  A function to run when a match is found (after the children)
 *  If it returns false, the Q.find function stops searching.
 * @param {Object} options
 *  Any options to pass to the callbacks as the second argument
 * @param {Mixed} shared
 *  An optional object that will be passed to each callbackBefore and callbackAfter
 */
Q.find = function _Q_find(elem, filter, callbackBefore, callbackAfter, options, shared, parent, index) {
	var i, activating = false;
	if (!elem) {
		return;
	}
	if (filter === true) {
		filter = 'q_tool';
		activating = true;
		if (elem.Q_activating && shared && elem.Q_activating !== shared.activating) {
			return; // skip the element and its subtree, it's already being activated
		}
	}
	// Arrays are accepted
	if ((Q.isArrayLike(elem) && !Q.instanceOf(elem, Element))
	|| (typeof HTMLCollection !== 'undefined' && (elem instanceof root.HTMLCollection))
	|| (root.jQuery && (elem instanceof root.jQuery))) {
		Q.each(elem, function _Q_find_array(i, item) {
			if (!item) {
				return;
			}
			if (false === Q.find(
				item, filter, callbackBefore, callbackAfter, 
				options, shared, parent, i
			)) {
				return false;
			}
		});
		return;
	}
	// Do a depth-first search and call the constructors
	var found = (filter === null);
	if (!found && ('className' in elem) && typeof elem.className === "string" && elem.className) {
		var classNames = elem.className.split(' ');
		for (i=classNames.length-1; i>=0; --i) {
			var className = Q.normalize.memoized(classNames[i]);
			if (((typeof filter === 'string') && (filter === className))
			|| ((filter instanceof RegExp) && filter.test(className))
			|| ((typeof filter === 'function' && filter(className)))) {
				found = true;
				break;
			}
		}
	}
	if (!found && elem.attributes) {
		for (i=elem.attributes.length-1; i>=0; --i) {
			var attribute = elem.attributes[i].name;
			if (((typeof filter === 'string') && (filter === attribute))
			|| ((filter instanceof RegExp) && filter.test(attribute))
			|| ((typeof filter === 'function' && filter(attribute)))) {
				found = true;
				break;
			}
		}
	}
	var ret;
	if (found && typeof callbackBefore == 'function') {
		ret = callbackBefore(elem, options, shared, parent, index);
		if (ret === false) {
			return false;
		}
	}
	if (ret !== true) {
		var children = ('children' in elem) ? elem.children : elem.childNodes;
		ret = Q.find(Q.copy(children), filter, callbackBefore, callbackAfter, options, shared, elem);
		if (ret === false) {
			return false;
		}
	}
	if (found && typeof callbackAfter  == 'function') {
		if (false === callbackAfter(elem, options, shared, parent, index)) {
			return false;
		}
	}
};

/**
 * Unleash this on an element to activate all the tools within it.
 * If the element is itself an outer div of a tool, that tool is activated too.
 * @static
 * @method activate
 * @param {HTMLElement|Q.Tool} elem
 *  HTML element or existing tool to traverse and activate
 *  If this is empty, then Q.activate exits early
 * @param {Object} options
 *  Optional options to provide to tools and their children.
 * @param {Function|Q.Event} [callback]
 *  This will get called when the content has been completely activated.
 *  That is, after all the files, if any, have been loaded and all the
 *  constructors have run.
 *  It receives (elem, tools, options) as arguments, and the last tool to be
 *  activated as "this".
 * @param {Object} [internal] stuff for internal use
 * @param {Boolean} [internal.lazyload] used by Q/lazyload tool
 * @param {Function} [internal.progress] function to cal with incremental progress, to debug Q.activate()
 * @return {Q.Promise} Returns a promise with an extra .cancel() method to cancel the action
 */
Q.activate = function _Q_activate(elem, options, callback, internal) {
	
	if (!elem) {
		return;
	}
	
	var ba, tool;
	if (Q.typeOf(elem) === 'Q.Tool') {
		tool = elem;
		ba = Q.Tool.beingActivated;
		Q.Tool.beingActivated = tool;
		elem = tool.element;
	}
	
	var activating = ((elem.Q_activating || 0) + 1) % 1000000;
	elem.Q_activating = activating;
	
	Q.beforeActivate.handle.call(root, elem); // things to do before things are activated
	
	var shared = {
		tool: null,
		tools: {},
		waitingForTools: [],
		pipe: Q.pipe(),
		canceled: false,
		activating: activating
	};
	Q.extend(shared, 3, internal);
	if (typeof options === 'function') {
		callback = options;
		options = undefined;
	}
	Q.find(elem, true, _activateTools, _initTools, options, shared);
	internal && internal.progress && internal.progress(shared);
	shared.pipe.add(shared.waitingForTools, 1, _activated)
		.run();
		
	Q.Tool.beingActivated = ba;
	
	var promise = {};
	var _resolve = null;
	var _reject = null;
	if (Q.Promise) {
		promise = new Q.Promise(function (resolve, reject) {
			_resolve = resolve;
			_reject = reject;
		});
	}
	promise.cancel = function () {
		shared.canceled = true;
		_reject && _reject();
	};
	return promise;
	
	function _activated() {
		var tool = shared.firstTool || shared.tool;
		shared.internal && shared.internal.progress && shared.internal.progress(shared);
		// tool may be undefined, if Q.activate() is called synchronously inside tool constructor
		if (callback) {
			Q.handle(callback, tool, [elem, shared.tools, options]);
		}
		_resolve && _resolve({
			element: elem, options: options, tools: shared.tools
		});
		delete elem.Q_activating;
		Q.handle(Q.onActivate, tool, [elem, shared.tools, options]);
	}
};

/**
 * Requests a URL served by Qbix Platform and loads it as if it was a page loaded in the browser.
 * @static
 * @method loadUrl
 * @param {String} url The url to load.
 * @param {Array|String} slotNames Optional, defaults to all application slots
 * @param {Function} callback Callback which is called when response returned and scripts,
 * stylesheets and inline styles added, but before inline scripts executed.
 * Receives response as its first argument. May return DOM element or array of DOM elements on which to call Q.activate
 * By default place slot content to DOM element with id "{slotName}_slot"
 * @param {Object} options Optional.
 * An hash of options to pass to the loader, and can also include options for loadUrl itself:
 * @param {Function} [options.loader=Q.request] can be used to override the actual function to request the URL. See Q.request documentation for more options.
 * @param {Function} [options.handler] the function to handle the returned data. Defaults to a function that fills the corresponding slot containers correctly.
 * @param {Boolean} [options.dontTransformUrl] pass true to just use the passed URL without transforming it
 * @param {boolean} [options.ignoreHistory=false] if true, does not push the url onto the history stack
 * @param {boolean} [options.ignorePage=false] if true, does not process the links / stylesheets / script data in the response, and doesn't trigger deactivation of current page and activation of the new page
 * @param {boolean} [options.ignoreRedirect=false] if true, doesn't honor redirects and tries to process the scripts, css, etc. from the response
 * @param {boolean} [options.ignoreLoadingErrors=false] If true, ignores any errors in loading scripts.
 * @param {boolean} [options.ignoreHash=false] if true, does not navigate to the hash part of the URL in browsers that can support it
 * @param {Object} [options.fields] additional fields to pass via the querystring
 * @param {Object} [options.formdata] if set, instead of fields, submits the formdata (including multipart form-data such as files, etc.) 
 * @param {String} [options.loadExtras=null] if "all", asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load, can also be "response", "initial", "session" or "initial,session"
 * @param {Number|boolean} [options.timeout=1500] milliseconds to wait for response, before showing cancel button and triggering onTimeout event, if any, passed to the options
 * @param {boolean} [options.quiet=false] if true, allows visual indications that the request is going to take place.
 * @param {String|Array} [options.slotNames] an array of slot names to request and process (default is all slots in Q.info.slotNames)
 * @param {Array} [options.idPrefixes] optional array of values to pass to PHP method Q_Html::pushIdPrefix for each slotName
 * @param {Object} [options.retainSlots] an object of {slotName: whetherToRetain} pairs, retained slots aren't requested
 * @param {boolean} [options.slotContainer] optional function taking (slotName, response) and returning the element, if any, to fill for that slot
 * @param {Array} [options.replaceElements] array of elements or ids of elements in the document to replace. Overrides "data-q-retain" attributes but not retainSlots option.
 * @param {Object} [options.dontRestoreScrollPosition] set dontRestoreScroll[url] = true to skip fillSlots restoring scroll position for that url, or just set dontRestoreScroll[''] = true to skip all urls
 * @param {String} [options.key='Q'] If a response to the request initiated by this call to Q.loadUrl is preceded by another call to Q.loadUrl with the same key, then the response handler is not run for that response (since a newer one is pending or arrived).
 * @param {Q.Event} [options.onTimeout] handler to call when timeout is reached. Receives function as argument - the function might be called to cancel loading.
 * @param {Q.Event} [options.onCancel] passed to the loader to be called if the loader cancels the response
 * @param {Q.Event} [options.onResponse] handler to call when the loader gets a response but before it is processed
 * @param {Q.Event} [options.onError] event for when an error occurs, by default shows an alert
 * @param {Q.Event} [options.onLoad] event which occurs when the parsed data comes back from the server
 * @param {Q.Event} [options.onActivate] event which occurs when all Q.activate's processed and all script lines executed
 * @param {Q.Event} [options.onLoadStart] handlers of this event will be called after the request is initiated, if "quiet" option is false they can add some visual indicators
 * @param {Q.Event} [options.onLoadEnd] handlers called after the request is fully completed, if "quiet" option is false they can add some visual indicators
 * @param {Q.Event} [options.beforeTransition] handler called before starting to mess with styles, this is where you can save some settings
 * @param {Q.Event} [options.beforeFillSlots] handler called before filling slots with new content
 * @param {Q.Event} [options.onFillSlots] use this handler to do things with elements as soon as they are filled into the slots
 * @param {Q.Event} [options.beforeUnloadUrl] opportunity to save state around current url, such as scroll positions of displayed slots
 * @param {Q.Event} [options.unloadedUrl] if the URL was already replaced by the time Q.loadUrl is called (e.g. from popState handler) pass the URL being unloaded here
 * @return {Q.Promise} Returns a promise with an extra .cancel() method to cancel the action
 */
Q.loadUrl = function _Q_loadUrl(url, options) {
	var o = Q.extend({}, Q.loadUrl.options, options);
	var handler = o.handler;
	var slotNames = o.slotNames || (Q.info && Q.info.slotNames);
	if (typeof slotNames === 'string') {
		slotNames = slotNames.split(',');
	}
	if (o.retainSlots) {
		var arr = [], i, l = slotNames.length;
		for (i=0; i<l; ++i) {
			var slotName = slotNames[i];
			if (!o.retainSlots[slotName] || Q.loadUrl.retainedSlots[slotName]) {
				arr.push(slotName);
			} else {
				Q.loadUrl.retainedSlots[slotName] = document.getElementById(slotName + '_slot');
			}
		}
		slotNames = arr;
	}

	var parts = url.split('#');
	var urlToLoad = (parts[1] && parts[1].queryField('url')) || parts[0];

	var loader = Q.request;
	var onActivate, onError;
	if (o.loader) {
		loader = o.loader;
	}
	if (o.onError) {
		onError = o.onError;
	}
	if (o.onActivate) {
		onActivate = o.onActivate;
	}
	var _loadUrlObject = {url: url, options: options};
	Q.loadUrl.loading[o.key] = _loadUrlObject;
	loader(urlToLoad, slotNames, loadResponse, o);
	
	var promise = {};
	var _resolve = null;
	var _reject = null;
	var _canceled = null;
	if (Q.Promise) {
		promise = new Q.Promise(function (resolve, reject) {
			_resolve = resolve;
			_reject = reject;
		});
	}
	promise.cancel = function () {
		_canceled = true;
		_reject && _reject("request canceled");
	};
	return promise;

	function loadResponse(err, response, redirected) {
		var e;
		if (_canceled) {
			return; // this loadUrl call was canceled
		}
		var loadingUrlObject = Q.loadUrl.loading[o.key];
		delete Q.loadUrl.loading[o.key]; // it's loaded
		if (redirected && !o.ignoreRedirect) {
			_resolve && _resolve(response);
			return; // it was just a redirect
		}
		if (loadingUrlObject &&
		_loadUrlObject != loadingUrlObject) {
			var sn1 = loadingUrlObject.options && loadingUrlObject.options.slotNames || [];
			var sn2 = _loadUrlObject.options && _loadUrlObject.options.slotNames || [];
			sn1 = typeof sn1 === 'string' ? sn1 : sn1.join(',');
			sn2 = typeof sn2 === 'string' ? sn2 : sn2.join(',')
			e = 'request to ' + loadingUrlObject.url
				+ ' (' + sn1 + ') '
				+ ' was initiated after ' 
				+ ' current one to ' + _loadUrlObject.url
				+ ' (' + sn2 + ')';
			_reject && _reject(e);
			return; // a newer request was sent
		}
		if (!Q.isEmpty(err)) {
			e = new Q.Exception(Q.firstErrorMessage(err), Q.firstError(err));
			_reject && _reject(e);
			return Q.handle(onError, this, [e]);
		}
		// if (Q.isEmpty(response)) {
		// 	e = "Response is empty";
		// 	_reject && _reject(e);
		// 	return Q.handle(onError, this, [e, response]);
		// }
		if (!Q.isEmpty(response.errors)) {
			e = response.errors[0].message;
			_reject && _reject(e);
			return Q.handle(onError, this, [e]);
		}

		Q.handle(o.onLoad, this, [response]);
		var unloadedUrl = o.unloadedUrl || location.href;
		Q.handle(o.beforeUnloadUrl, this, [unloadedUrl, url, response]);

		_resolve && _resolve(response);
		
		Q.Page.beingProcessed = true;

		Q.Response.processHtmlCssClasses(response);
		Q.Response.processMetas(response);
		Q.Response.processTemplates(response);

		var newScripts;
		
		if (o.ignorePage) {
			newScripts = [];
			afterScripts();
		} else {
			newScripts = Q.Response.processScripts(response, afterScripts, o);
		}
		
		function afterScripts () {
			
			// WARNING: This function may not be called if one of the scripts is missing or returns an error
			// So the existing page will not be unloaded and the new page will not be loaded, in this case,
			// but some of the new scripts will be added.

			var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action; // old page going out
			var i, newStylesheets, newStyles;

			Q.handle(o.beforeTransition, Q, [response, url, o]);
			
			var domElements = null;
			if (o.ignorePage) {
				newStylesheets = {};
				afterStylesheets();
			} else {
				_doEvents('on', moduleSlashAction);
				newStylesheets = Q.Response.processStylesheets(response, afterStylesheets);
			}
			
			function afterStylesheets() {
				Q.Response.processStyles(response);
				
				afterStyles(); // Synchronous to allow additional scripts to change the styles before allowing the browser reflow.
			
				if (!o.ignoreHash && parts[1] && history.pushState) {
					var e = document.getElementById(parts[1]);
					if (e) {
						location.hash = parts[1];
						// history.back();
						// todo: modify history successfully somehow
						// history.replaceState({}, null, url + '#' + parts[1]);
					}
				}
			}
			
			function afterStyles() {
				
				if (!o.ignorePage) {
					_doEvents('before', moduleSlashAction);
					while (Q.Event.forPage && Q.Event.forPage.length) {
						// keep removing the first element of the array until it is empty
						Q.Event.forPage[0].remove(true);
					}
					var p = Q.Event.jQueryForPage;
					for (i=p.length-1; i >= 0; --i) {
						var off = p[i][0];
						root.jQuery.fn[off].call(p[i][1], p[i][2], p[i][3]);
					}
					Q.Event.jQueryForPage = [];
				}
			
				if (!o.ignorePage && !(response && response.redirect)) {					
					// Mark for removal sundry elements belonging to the slots that are being reloaded
					Q.each(['link', 'style', 'script'], function (i, tag) {
						if (tag !== 'style' && !o.loadExtras) {
							return;
						}
						Q.loadUrl.elementsToRemove[tag] = [];
						Q.each(document.getElementsByTagName(tag), function (k, e) {
							if (tag === 'link' && e.getAttribute('rel').toLowerCase() !== 'stylesheet') {
								return;
							}

							var slot = e.getAttribute('data-slot');
							if (slot && slotNames.indexOf(slot) >= 0) {
								var found = false;
								if (response.stylesheets && response.stylesheets[slot]) {
									var stylesheets = response.stylesheets[slot];
									for (var i=0, l=stylesheets.length; i<l; ++i) {
										var stylesheet = stylesheets[i];
										var href1 = stylesheet && stylesheet.href;
										var href2 = e && (e.href || e.getAttribute('data-href'));
										if (href1 && href2 && href1.split("?")[0] === href2.split("?")[0]
										&& (!stylesheet.media || !e.media || stylesheet.media === e.media)) {
											found = true;
											break;
										}
									}
								}
								if (!found) {
									Q.addStylesheet.loaded[e.href] = false;
									Q.loadUrl.elementsToRemove[tag].push(e);
								}
							}
						});
					});
				}

				// now we can finally yank things out of the slots
				for (var tag in Q.loadUrl.elementsToRemove) {
					Q.each(Q.loadUrl.elementsToRemove[tag], function () {
						Q.removeElement(this);
					});
				}
				Q.loadUrl.elementsToRemove = {};

				// this is where we fill all the slots
				Q.handle(o.beforeFillSlots, Q, [response, url, o]);
				domElements = handler(response, url, o);
				Q.handle(o.onFillSlots, Q, [domElements, response, url, o]);

				if (!o.ignoreHistory) {
					Q.Page.push(url, Q.getObject('slots.title', response));
				}
			
				if (!o.ignorePage && Q.info && Q.info.uri) {
					Q.Page.onLoad(moduleSlashAction).occurred = false;
					Q.Page.onActivate(moduleSlashAction).occurred = false;
					if (Q.info.uriString !== Q.moduleSlashAction) {
						Q.Page.onLoad(Q.info.uriString).occurred = false;
						Q.Page.onActivate(Q.info.uriString).occurred = false;
					}
				}

				Q.Response.processScriptDataAndLines(response);

				if (!o.ignorePage) {
					try {
						Q.Page.beingLoaded = true;
						Q.Page.onLoad('').handle(url, o);
						if (Q.info && Q.info.uri) {
							moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action; // new page coming in
							Q.Page.onLoad(moduleSlashAction).handle(url, o);
							if (Q.info.uriString !== moduleSlashAction) {
								Q.Page.onLoad(Q.info.uriString).handle(url, o);
							}
						}
						Q.Page.beingLoaded = false;
					} catch (e) {
						debugger; // pause here if debugging
						Q.Page.beingLoaded = false;
						throw e;
					}
				}
			
				if (Q.isEmpty(domElements)) {
					_activatedSlot();
				} else if (Q.isPlainObject(domElements)) { // is a plain object with elements
					_activatedSlot.remaining = Object.keys(domElements).length;
					for (var slotName in domElements) {
						Q.activate(domElements[slotName], undefined, _activatedSlot);
					}
				} else { // it's an element
					Q.activate(domElements, undefined, _activatedSlot);
				}
			}
			
			function _doEvents(prefix, moduleSlashAction) {
				var event, f = Q.Page[prefix+'Unload'];
				if (Q.info && Q.info.uri) {
					event = f("Q\t"+moduleSlashAction);
					event.handle(url, o);
					event.removeAllHandlers();
					event = f(moduleSlashAction);
					event.handle(url, o);
					if (Q.info.uriString !== moduleSlashAction) {
						event = f("Q\t"+Q.info.uriString);
						event.handle(url, o);
						event.removeAllHandlers();
						event = f(Q.info.uriString);
						event.handle(url, o);
					}
				}
				event = f("Q\t");
				event.handle(url, o);
				event.removeAllHandlers();
				event = f('');
				event.handle(url, o);
			}

			function _activatedSlot() {
				if (_activatedSlot.remaining !== undefined && --_activatedSlot.remaining > 0) {
					return;
				}
				Q.each([newStylesheets, newStyles, newScripts], function (i, collection) {
					Q.each(collection, function (slotName, arr) {
						if (!slotName) return;
						Q.each(arr, function (i, element) {
							if (!element) return;
							// domElements[slotName].appendChild(element);
							element.setAttribute('data-slot', slotName);
						});
					});
				});
				if (!o.ignorePage) {
					try {
						Q.Page.beingActivated = true;
						Q.Page.onActivate('').handle(url, o);
						if (Q.info && Q.info.uri) {
							var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action;
							Q.Page.onActivate(moduleSlashAction).handle(url, o);
							if (Q.info.uriString !== moduleSlashAction) {
								Q.Page.onActivate(Q.info.uriString).handle(url, o);
							}
						}
						Q.Page.beingActivated = false;
					} catch (e) {
						debugger; // pause here if debugging
						Q.Page.beingActivated = false;
						throw e;
					}
				}

				Q.handle(o.onRequestProcessed, this, [err, response]);
				
				Q.Page.beingProcessed = false;
				Q.handle(onActivate, this, [domElements]);
			}
		}
	}
};

Q.loadUrl.retainedSlots = {};
Q.loadUrl.elementsToRemove = {};

Q.loadUrl.saveScroll = function _Q_loadUrl_saveScroll (fromUrl) {
	var slotNames = Q.info.slotNames, l, elem, i;
	if (typeof slotNames === 'string') {
		slotNames = slotNames.split(',');
	}
	l = slotNames.length;
	for (i=0; i<l; ++i) {
		if ((elem = document.getElementById(slotNames[i] + "_slot"))
		&& ('scrollLeft' in elem)) {
			Q.setObject(['Q', 'scroll', fromUrl], {
				left: elem.scrollLeft,
				top: elem.scrollTop
			}, elem);
		}
	}
};

/**
 * Similar to Q.request but processes the response like loadUrl,
 * handling such scriptData, scriptLines, HTML classes, css, etc.
 * Callback receives (err, data)
 */
Q.loadUrl.request = function (url, slotNames, callback, options) {
	return Q.loadUrl(url, Q.extend({
		ignoreHistory: true,
		ignorePage: true,
		ignoreDialogs: true,
		ignoreRedirect: true,
		ignoreLoadingErrors: true,
		ignoreHash: true,
		dontReload: true,
		handler: function doNothing () { return null; },
		slotNames: slotNames,
		onError: function (err) {
			Q.handle(callback, this, [err]);
		},
		onRequestProcessed: function (err, response) {
			Q.handle(callback, this, [null, response]);
		}
	}, options));
};

Q.loadUrl.loading = {};

/**
 * Used for handling callbacks, whether they come as functions,
 * strings referring to functions (if evaluated), arrays or hashes.
 * @static
 * @method handle
 * @param {Mixed} callables
 *  The callables to call
 *  Can be a function, array of functions, object of functions, Q.Event or URL
 *  If it is a url, simply follow it with options, callback
 * @param {Function} callback
 *  You can pass a function here if callables is a URL
 * @param {Object} context
 *  The context in which to call them
 * @param {Array} args
 *  An array of arguments to pass to them
 * @param {Object} options
 *  If callables is a url, these are the options to pass to Q.loadUrl, if any. Also can include:
 *  @param {boolean} [options.dontReload=false] if this is true and callback is a url matching current url, it is not reloaded
 *  @param {boolean} [options.loadUsingAjax=false] if this is true and callback is a url, it is loaded using Q.loadUrl
 *  @param {Function} [options.externalLoader] when using loadUsingAjax, you can set this to a function to suppress loading of external websites with Q.handle.
 *	Note: this will still not supress loading of external websites done with other means, such as window.location
 *  @param {Object} [options.fields] optional fields to pass with any method other than "get"
 *  @param {String|Function} [options.callback] if a string, adds a '&Q.callback='+encodeURIComponent(callback) to the querystring. If a function, this is the callback.
 *  @param {String} [options.loadExtras="session"] if "all", asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load, can also be "response", "initial", "session" or "initial,session"
 *  @param {String} [options.target] the name of a window or iframe to use as the target. In this case callables is treated as a url.
 *  @param {String|Array} [options.slotNames] a comma-separated list of slot names, or an array of slot names
 *  @param {boolean} [options.quiet] defaults to false. If true, allows visual indications that the request is going to take place.
 *  @param {Function} [options.handleException] pass a function here to handle thrown exceptions instead of rethrowing them
 * @return {number}
 *  The number of handlers executed
 */
 Q.handle = function _Q_handle(callables, /* callback, */ context, args, options) {
	try {
		if (!callables) {
			return 0;
		}
		if (!context) context = root;
		if (!args) args = [];
		var i=0, count=0, k, result;
		if (callables === location) callables = location.href;
		switch (Q.typeOf(callables)) {
			case 'function':
				result = callables.apply(context, args);
				if (result === false) return false;
				return 1;
			case 'array':
				for (i=0; i<callables.length; ++i) {
					result = Q.handle(callables[i], context, args);
					if (result === false) return false;
					count += result;
				}
				return count;
			case 'Q.Event':
				return callables.handle.apply(context, args);
			case 'object':
				for (k in callables) {
					result = Q.handle(callables[k], context, args);
					if (result === false) return false;
					count += result;
				}
				return count;
			case 'string':
				var o = Q.extend({}, Q.handle.options, options);
				if (!callables.isUrl()
				&& (callables[0] != '#')
				&& (!o.target || o.target.toLowerCase() === '_self')) {
					// Assume this is not a URL.
					// Try to evaluate the expression, and execute the resulting function
					var c = Q.getObject(callables, context) || Q.getObject(callables);
					return Q.handle(c, context, args);
				}
				// Assume callables is a URL
				if (o.dontReload && Q.info && Q.info.url === callables) {
					return 0;
				}
				var callback = null;
				if (typeof arguments[1] === 'function') {
					// Some syntactic sugar: (url, callback) omitting context, args, options
					callback = arguments[1];
					o = Q.handle.options;
				} else if (arguments[1] && (arguments[3] === undefined)) {
					// Some more syntactic sugar: (url, options, callback) omitting context, args, options
					o = Q.extend({}, Q.handle.options, arguments[1]);
					if (typeof arguments[2] === 'function') {
						callback = arguments[2];
					}
				} else {
					o = Q.extend({}, Q.handle.options, options);
					if (o.callback) {
						callback = o.callback;
					}
				}
				var baseUrl = Q.baseUrl();
				var sameDomain = callables.sameDomain(baseUrl);
				if (callables[0] === '#') {
					root.location.hash = callables;
				} else if (o.loadUsingAjax && sameDomain
				&& (!o.target || o.target === true || o.target === '_self')) {
					if (callables.search(baseUrl) === 0) {
						// Use AJAX to refresh the page whenever the request is for a local page
						Q.loadUrl(callables, Q.extend({
							// shouldn't need to re-load responseExtras, they're the same across sessions
							loadExtras: 'session',
							ignoreHistory: false,
							onActivate: function () {
								if (callback) callback();
							}
						}, o)).then(function (a) {
							
						}, function (err) {
							if (o && o.handleException) {
								return o.handleException(err);
							}
						});
					} else if (o.externalLoader) {
						o.externalLoader.apply(this, arguments);
					} else {
						root.location = callables;
					}
				} else {
					if (Q.typeOf(o.fields) === 'object') {
						var method = 'POST';
						if (o.method) {
							switch (o.method.toUpperCase()) {
								case "GET":
								case "POST":
									method = o.method;
									break;
								default:
									method = 'POST'; // sadly HTML forms don't support other methods
									break;
							}
						}
						Q.formPost(callables, o.fields, method, {onLoad: o.callback, target: o.target});
					} else {
						if (Q.info && callables === baseUrl) {
							callables+= '/';
						}
						if (!o.target || o.target === true || o.target === '_self') {
							if (root.location.href == callables) {
								root.location.reload(true);
							} else {
								root.location = callables;
							}
						} else {
							root.open(callables, o.target);
						}
					}
				}
				Q.handle.onUrl.handle(callables, o);
				return 1;
			default:
				return 0;
		}
	} catch (exception) {
		if (options && options.handleException) {
			return options.handleException(exception);
		}
		throw exception;
	}
};
Q.handle.options = {
	loadUsingAjax: false,
	externalLoader: null,
	dontReload: false
};
Q.handle.onUrl = new Q.Event(function () {
	var elements = document.getElementsByClassName('Q_error_message');
	Q.each(elements, function () {
		Q.removeElement(this, true);
	});
}, "Q");

/**
 * Parses a querystring
 * @static
 * @method parseQueryString
 * @param {String} queryString  The string to parse
 * @param {Array} keys  Optional array onto which the keys are pushed
 * @return {Object} an object with the resulting {key: value} pairs
 */
Q.parseQueryString = function Q_parseQueryString(queryString, keys) {
	if (!queryString) return {};
	if (queryString[0] === '?' || queryString[0] === '#') {
		queryString = queryString.substring(1);
	}
	var result = {};
	Q.each(queryString.split('&'), function (i, clause) {
		var parts = clause.split('=');
		var key = decodeURIComponent(parts[0]);
		var value = (parts[1] == null) ? null : decodeURIComponent(parts[1]);
		if (!key) return;
		if (keys) keys.push(key);
		result[key] = value;
	});
	return result;
};

function Q_hashChangeHandler() {
	const baseUrl = Q.baseUrl();
	let result = null;

	// Modern replacement for: location.hash.queryField('url')
	let hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
	let urlFromHash = null;

	if (hash.includes('?')) {
		const query = hash.split('?')[1];
		const params = new URLSearchParams(query);
		urlFromHash = params.get('url');
	}

	// Fallback: derive URL from full location.href
	if (urlFromHash === null) {
		urlFromHash = location.href.split('#')[0].slice(baseUrl.length + 1);
	}

	// Check if we should skip this change
	if (Q_hashChangeHandler.ignore) {
		Q_hashChangeHandler.ignore = false;
	} else if (
		urlFromHash !== Q_hashChangeHandler.currentUrl &&
		urlFromHash !== Q_hashChangeHandler.currentUrlTail
	) {
		// Normalize the URL and handle it
		const fullUrl = urlFromHash.startsWith(baseUrl)
			? urlFromHash
			: baseUrl + '/' + urlFromHash;
		Q.handle(fullUrl);
		result = true;
	}

	// Update tracking
	Q_hashChangeHandler.currentUrl = urlFromHash.split('#')[0];
	Q_hashChangeHandler.currentUrlTail = Q_hashChangeHandler.currentUrl.slice(baseUrl.length + 1);
	return result;
}

function Q_popStateHandler() {
	var baseUrl = Q.baseUrl();
	var url = root.location.href.split('#')[0], result = null;
	if (Q.info.url === url) {
		return; // we are already at this url
	}
	var urlTail = url.substring(baseUrl.length + 1);
	if (urlTail != Q_hashChangeHandler.currentUrlTail) {
		Q.handle(
			url.indexOf(baseUrl) === 0 ? url : baseUrl + '/' + url,
			{
				ignoreHistory: true,
				quiet: true,
				unloadedUrl: Q_hashChangeHandler.currentUrl,
				handleException: function () {
					location.reload();
				}
			}
		);
		Q_hashChangeHandler.currentUrlTail = urlTail;
		Q_hashChangeHandler.currentUrl = url;
		result = true;
	}
	return result;
}

// private methods

var _constructors = {};

/**
 * Given a tool's generated container div, constructs the
 * corresponding JS tool object. Used internally.
 * This basically calls the tool's constructor, passing it
 * the correct prefix.
 * @private
 * @static
 * @method _activateTools
 * @param {HTMLElement} toolElement
 *  A tool's generated container div.
 * @param {Object} options
 *  Options that should be passed onto the tool
 * @param {Mixed} shared
 *  A shared object we can use to pass info around while activating tools
 */
function _activateTools(toolElement, options, shared) {
	if (!shared.lazyload &&
	(toolElement instanceof Element)) {
		var attr = toolElement.getAttribute('data-q-lazyload');
		if (attr === 'waiting' || attr === 'removed') {
			return false;
		}
	}
	var pendingParentEvent = _pendingParentStack[_pendingParentStack.length-1];
	var pendingCurrentEvent = new Q.Event();
	pendingCurrentEvent.toolElement = toolElement; // just to keep track for debugging
	_pendingParentStack.push(pendingCurrentEvent); // wait for construct of parent tool
	var toolId = Q.Tool.calculateId(toolElement.id);
	_waitingParentStack.push(toolId); // wait for init of child tools
	_loadToolScript(toolElement,
	function _activateTools_doConstruct(toolElement, toolConstructor, toolName, uniqueToolId, params) {
		if (!_constructors[toolName]) {
			_constructors[toolName] = function Q_Tool(element, options) {
				// support re-entrancy of Q.activate
				var tool = Q.getObject(['Q', 'tools', toolName], element);
				if (this.activating || this.activated || tool) {
					return _activateTools.alreadyActivated;
				}
				this.activating = true
				this.activated = false;
				this.initialized = false;
				try {
					this.options = Q.extend({}, Q.Tool.options.levels, toolConstructor.options);
					if (options) {
						var o2 = {}, k;
						for (k in options) {
							if (k[0] !== '#') {
								o2[k] = options[k];
							}
						}
						Q.extend(this.options, Q.Tool.options.levels, o2);
					}
					this.name = toolName;
					this.constructor = toolConstructor;
					Q.Tool.call(this, element, options);
					this.state = Q.copy(this.options, toolConstructor.stateKeys);
					if (toolConstructor.text) {
						this.text = toolConstructor.text;
					}
					var prevTool = Q.Tool.beingActivated;
					Q.Tool.beingActivated = this;
					// Trigger events in some global event factories
					var normalizedName = Q.normalize.memoized(this.name);
					_constructToolHandlers[""] &&
					_constructToolHandlers[""].handle.call(this, this.options);
					_constructToolHandlers[normalizedName] &&
					_constructToolHandlers[normalizedName].handle.call(this, this.options);
					_constructToolHandlers["id:"+this.id] &&
					_constructToolHandlers["id:"+this.id].handle.call(this, this.options);
					var args = [this.options];
					Q.each(toolConstructor.require, function (i, n) {
						var req = Q.Tool.from(element, n);
						if (!req) {
							throw new Q.Exception("Q.Tool.define: " + toolConstructor.toolName
							+ " requires " + n + " to have been activated on the same element.");
						}
						args.push(req);
					});
					toolConstructor.apply(this, args);
					this.activating = false;
					this.activated = true;
					_activateToolHandlers[""] &&
					_activateToolHandlers[""].handle.call(this, this.options);
					_activateToolHandlers[normalizedName] &&
					_activateToolHandlers[normalizedName].handle.call(this, this.options);
					_activateToolHandlers["id:"+this.id] &&
					_activateToolHandlers["id:"+this.id].handle.call(this, this.options);
					Q.Tool.beingActivated = prevTool;
				} catch (e) {
					debugger; // pause here if debugging
					console.warn(e);
					Q.Tool.beingActivated = prevTool;
				}
				this.activating = false;
				this.activated = true;
			};
			Q.mixin(toolConstructor, Q.Tool);
			Q.mixin(_constructors[toolName], toolConstructor);
		}
		if (shared.canceled) {
			return;
		}
		if (pendingParentEvent) {
			var eventKey = toolId + ' ' + toolName;
			var eventKeyPrefix = 2;
			// in order to avoid replace handlers in pendingParentEvent we need to avoid adding handlers with same keys
			// So while key exists in pendingParentEvent.keys we update new id with counter.
			while(pendingParentEvent.keys.includes(eventKey)) {
				eventKey += '_' + eventKeyPrefix++;
			}
			pendingParentEvent.add(_reallyConstruct, eventKey);
		} else {
			_reallyConstruct();
		}
		function _reallyConstruct() {
			// NOTE: inside the tool constructor, after you add
			// any child elements, call Q.activate() and Qbix
			// will work correctly, whether it's sync or async.
			Q.Tool.onLoadedConstructor(toolName).addOnce(function () {
				var _constructor = _constructors[toolName];
				var result = new _constructor(toolElement, options);
				var tool = Q.getObject(['Q', 'tools', toolName], toolElement);
				shared.tool = tool;
				Q.setObject([toolId, toolName], tool, shared.tools);
				if (uniqueToolId) {
					if (uniqueToolId === shared.firstToolId) {
						shared.firstTool = tool;
					}
					shared.pipe.fill(uniqueToolId)();
					shared.internal && shared.internal.progress && shared.internal.progress(shared);
				}
				if (!tool) {
					return;
				}
				pendingCurrentEvent.handle.call(tool, options, result);
				pendingCurrentEvent.removeAllHandlers();
			});
		}
	}, shared, null, { placeholder: true });
}

_activateTools.alreadyActivated = {};

/**
 * Calls the init method of a tool. Used internally.
 * @private
 * @static
 * @method _initTools
 * @param {HTMLElement} toolElement
 *  A tool's generated container div
 */
function _initTools(toolElement, options, shared) {
	
	if (!shared.lazyload &&
	(toolElement instanceof Element)) {
		var attr = toolElement.getAttribute('data-q-lazyload');
		if (attr === 'waiting' || attr === 'removed') {
			return false;
		}
	}
	
	var currentEvent = _pendingParentStack[_pendingParentStack.length-1];
	_pendingParentStack.pop(); // it was pushed during tool activate
	var currentId = _waitingParentStack.pop();
	var ba = Q.Tool.beingActivated;
	var parentId = _waitingParentStack[_waitingParentStack.length-1]
		|| (ba && ba.id); // if we activated child tools while activating parent
	
	_loadToolScript(toolElement,
	function _initTools_doInit(toolElement, toolConstructor, toolName) {
		currentEvent.add(_doInit, currentId + ' ' + toolName);
	}, null, parentId);
	
	function _doInit() {
		var tool = this;
		var normalizedName = Q.normalize.memoized(tool.name);
		var waiting = _toolsWaitingForInit[tool.id];
		if (tool.initialized || waiting) {
			return;
		}
		tool.initialized = true;
		Q.handle(tool.Q && tool.Q.onInit, tool, [tool.options]);
		_initToolHandlers[""] &&
		_initToolHandlers[""].handle.call(tool, tool.options);
		_initToolHandlers[normalizedName] &&
		_initToolHandlers[normalizedName].handle.call(tool, tool.options);
		_initToolHandlers["id:"+this.id] &&
		_initToolHandlers["id:"+this.id].handle.call(tool, tool.options);
		setTimeout(function () {
			// Let Q.find traverse the rest of the tree first,
			// to make sure that it finds and constructs all the tools,
			// putting them on the list of toolsWaitingForInit.
			var toInit = _toolsToInit[tool.id];
			for (var parentId in toInit) {
				if (!Q.Tool.active[parentId]) {
					return;
				}
				var allInitialized = true;
				var childIds = _toolsWaitingForInit[parentId];
				for (var childId in childIds) {
					var a = Q.Tool.active[childId];
					if (!a) {
						allInitialized = false;
						break;
					}
					for (var childName in a) {
						var c = a[childName];
						if (!c || !c.initialized) {
							allInitialized = false;
							break;
						}
					}
				}
				if (allInitialized) {
					// Initialize parent tools which are ready to be initialized
					delete _toolsWaitingForInit[parentId];
					for (var parentName in Q.Tool.active[parentId]) {
						var p = Q.Tool.active[parentId][parentName];
						_doInit.call(p);
					}
				}
			}
			delete _toolsToInit[tool.id]; 
		}, 0);
	}
}

/**
 * Given a hash of values, returns the hostname and port for connecting to PHP server running Q
 * @static
 * @method baseUrl
 * @param {Object} where
 *  An object of field: value pairs
 * @return {String} Something of the form "scheme://hostname:port" or "scheme://hostname:port/subpath"
 */
Q.baseUrl = function _Q_host(where) {
	var result, i;
	for (i=0; i<Q.baseUrl.routers.length; ++i) {
		if (result = Q.baseUrl.routers[i](where)) {
			return result;
		}
	}
	return Q.info.proxyBaseUrl || Q.info.baseUrl; // By default, return the base url of the app
};
Q.baseUrl.routers = []; // functions returning a custom url

/**
 * Given some optional input identifying objects in the system,
 * returns the hostname and port for connecting to a Qbix Node.js server
 * set up for working with those objects.
 * @static
 * @method nodeUrl
 * @param {Object} where
 *  An object of field: value pairs
 * @return {String} "scheme://hostname:port"
 */
Q.nodeUrl = function _Q_node(where) {
	var result, i;
	for (i=0; i<Q.nodeUrl.routers.length; ++i) {
		if (result = Q.nodeUrl.routers[i](where)) {
			return result;
		}
	}
	return Q.info.nodeUrl && Q.info.nodeUrl.replace(Q.info.baseUrl, Q.baseUrl());
};
Q.nodeUrl.routers = []; // functions returning a custom url

/**
 * Module for templates functionality
 * @class Q.Template
 * @constructor
 */
Q.Template = function () {

};

Q.Template.collection = {};
Q.Template.info = {};


/**
 * Sets the text and/or info of a template in this document's collection, and compiles it.
 * This is e.g. called by Q.loadUrl when the server sends over some templates,
 * so they won't have to be requested later.
 * @static
 * @method set
 * @param {String} name The template's name under which it will be found
 * @param {String} content The content of the template that will be processed by the template engine.
 *   To avoid setting the content (so the template will be loaded on demand later), pass undefined here.
 * @param {Object|String} info You can also pass a string "type" here.
 * @param {String} [info.type="handlebars"] The type of template.
 * @param {Array} [info.text] Array naming sources for text translations, to be sent to Q.Text.get()
 * @param {Array} [info.partials] Relative urls of .js scripts for registering partials.
 *   Can also be names of templates for partials (in which case they shouldn't end in .js)
 * @param {Array} [info.helpers] Relative urls of .js scripts for registering helpers
 * @param {String} [info.dir] The directory in which the template would be located. The URL would be Q.url(dir/name.type)
 * @return {Boolean} Returns false if template info with this name was already set before
 */
Q.Template.set = function (name, content, info, overwriteEvenIfAlreadySet) {
	var T = Q.Template;
	var n = Q.normalize.memoized(name);
	if (!overwriteEvenIfAlreadySet && T.info[n]) {
		return false;
	}
	T.remove(name);
	if (content !== undefined) {
		T.collection[n] = content;
	}
	info = (typeof info === 'string') ? { type: info } : (info || {});
	Q.Text.addedFor('Q.Template.set', n, info);
	info.type = info.type || 'handlebars';
	T.info[n] = info;
	Q.Template.load.forget.each(name);
	return true;
};

/**
 * Removes a template that may have been set before
 * @static
 * @method remove
 * @param {String} name The template's name under which it will be found
 */
Q.Template.remove = function (name) {
	if (typeof name === 'string') {
		delete Q.Template.collection[Q.normalize.memoized(name)];
		Q.Template.load.cache.removeEach([name]);
		return;
	}
	Q.each(name, function (i, name) {
		Q.Template.remove(name);
	});
};

/**
 * This is used to compile a template once Handlebars is loaded
 * @static
 * @method compile
 * @param {String} content The content of the template
 * @param {String} [type="handlebars"] The type of the template
 * @param {Object} [options] Pass any extra options to Handlebars.compile
 * @return {Function} a function that can be called to render the template
 */
Q.Template.compile = function _Q_Template_compile (content, type, options) {
	type = type || 'handlebars';
	var r = Q.Template.compile.results;
	if (!r[content]) {
		if (type === 'handlebars') {
			r[content] = root.Handlebars.compile(content, Q.extend({}, Q.Template.compile.options, options));
		} else {
			r[content] = function (fields, options) {
				return content; // just renders the template's content itself
			};
		}
	}
	return r[content];
};
Q.Template.compile.options = {
	preventIndent: true
};
Q.Template.compile.results = {};

function _processTemplateElements(container) {
	var tpl = Q.Template.collection;
	var tpi = Q.Template.info;
	var trash = [];
	Q.each(container.getElementsByTagName('template'), function () {
		var element = this;
		var id = this.id || this.getAttribute('data-name');
		var type = this.getAttribute('data-type') || 'handlebars';
		var n = Q.normalize.memoized(id);
		tpl[n] = this.innerHTML.decodeHTML().trim();
		tpi[n] = {type: type};
		Q.each(['partials', 'helpers', 'text'], function (i, aspect) {
			var attr = element.getAttribute('data-' + aspect);
			var value = attr && JSON.parse(attr);
			if (value) {
				tpi[n][aspect] = value;
			}
		});
		trash.unshift(element);
	});
	Q.each(trash, function () {
		Q.removeElement(this);
	});
}

/**
 * Load template from server and store to cache
 * @static
 * @method load
 * @param {String} name The template name. Here is how templates are found:
 *   First, load any new templates from the DOM found inside script tags with type "text/"+type.
 *   Then, check the cache. If not there, we try to load the template from dir+'/'+name+'.'+type
 * @param {Function} callback Receives two parameters: (err, templateText)
 * @param {String} [options.type='handlebars'] the type and extension of the template
 * @param {String} [options.dir] the folder under project web folder where templates are located
 * @param {String} [options.name] option to override the name of the template
 * @return {String|undefined}
 */
Q.Template.load = Q.getter(function _Q_Template_load(name, callback, options) {
	if (typeof callback === "object") {
		options = callback;
		callback = undefined;
	}
	options = options || {};
	if (options.name) {
		name = options.name;
	}
	if (!name) {
		console.error('Q.Template.load: name is empty');
		return;
	}
	// defaults to handlebars templates
	var o = Q.extend({}, Q.Template.load.options, options);
	var tpl = Q.Template.collection;

	_processTemplateElements(document);

	// check if template is cached
	var n = Q.normalize.memoized(name);
	var info = Q.Template.info[n];
	if (tpl && typeof tpl[n] === 'string') {
		var result = tpl[n];
		Q.handle(callback, this, [null, result]);
		return true;
	}
	// now try to load template from server
	function _callback(err, content) {
		if (err) {
			Q.Template.onError.handle(err);
			return callback(err, null);
		}
		if (info) {
			info.dir = dir;
			info.type = type;
		}
		tpl[n] = content.trim();
		callback(null, tpl[n]);
	}
	function _fail () {
		var err = 'Failed to load template "'+o.dir+'/'+name+'.'+o.type+'"';
		Q.Template.onError.handle(err);
		callback(err);
	}
	var dir = (info && info.dir) || o.dir;
	var type = (info && info.type) || o.type;
	var url = Q.url(dir + '/' + name + '.' + type);

	Q.request(url, _callback, {parse: false, extend: false, skipNonce: true});
	return true;
}, {
	cache: Q.Cache.document('Q.Template.load', 100),
	throttle: 'Q.Template.load'
});

Q.Template.load.options = {
	type: "handlebars",
	types: {
		"handlebars": true,
		"php": true,
		"json": true,
		"abi.json": true
	},
	dir: "Q/views"
};

Q.Template.onError = new Q.Event(function (err) {
	console.warn("Q.Template: " + Q.firstErrorMessage(err));
}, 'Q.Template');

/**
 * Render template taken from DOM or from file on server with partials
 * @static
 * @method render
 * @param {String|Object} name The name of template (see Q.Template.load).
 *   You can also pass an object of {key: name}, and then the callback receives
 *   {key: arguments} of what the callback would get.
 * @param {Object} [fields] The fields to pass to the template when rendering it.
 * @param {Function} [callback] a callback - receives (error) or (error, html)
 * @param {Object} [options={}] Options for the template engine compiler. Also can include:
 * @param {String} [options.type='handlebars'] the type and extension of the template
 * @param {String} [options.dir] the folder under project web folder where templates are located
 * @param {String} [options.name] option to override the name of the template
 * @param {String} [options.tool] if the rendered HTML will be placed inside a tool, pass it here so that its prefix will be used
 * @param {String} [options.activateInContainer] if passed, the html will be inserted into the container and activated
 * @param {Function} [options.onActivate] if activateInContainer is passed, then you can pass a callback here to be called after activate
 * @return {Promise} can use this instead of callback
 */
Q.Template.render = Q.promisify(function _Q_Template_render(name, fields, callback, options) {
	if (typeof fields === "function") {
		options = callback;
		callback = fields;
		fields = {};
	}
	var isArray = Q.isArrayLike(name);
	if (isArray || Q.isPlainObject(name)) {
		var names = name;
		var p = Q.pipe(isArray ? names : Object.keys(names), callback);
		return Q.each(names, function (key, name) {
			Q.Template.render(
				name, fields, p.fill(isArray ? name : key), options
			);
		});
	}
	var o = options || {};
	var templateName = (o.name) ? o.name : name;
	var tba = (o && o.tool) || Q.Tool.beingActivated;
	var pba = Q.Page.beingActivated;
	Q.loadHandlebars(function () {
		// load the template and its associated info
		var n = Q.normalize.memoized(templateName);
		var info = Q.Template.info[n];
		var p = Q.pipe(['template', 'partials', 'helpers', 'text'], function (params) {
			if (params.template[0]) {
				return callback(params.template[0]);
			}
			// the partials, helpers and text should have already been processed
			if (params.text[1]) {
				// fields should replace any text collisions, to avoid problems
				fields = Q.extend({}, params.text[1], fields);
			}
			var tbaOld = Q.Tool.beingActivated;
			var pbaOld = Q.Page.beingActivated;
			Q.Tool.beingActivated = tba;
			Q.Page.beingActivated = pba;
			var err;
			try {
				var type = (info && info.type) || (o && o.type);
				var compiled = Q.Template.compile(params.template[1], type, o);
				var result = compiled(fields, o);
			} catch (e) {
				err = e;
				console.warn(e);
			}
			if (err) {
				callback(err);
			} else {
				var container = o.activateInContainer;
				if (container) {
					Q.replace(container, result);
					Q.activate(container, o.onActivate);
				}
				callback(null, result);
			}
			Q.Tool.beingActivated = tbaOld;
			Q.Page.beingActivated = pbaOld;
		});
		Q.Template.load(templateName, p.fill('template'), Q.copy(
			o, ['type', 'dir', 'name']
		));
		Q.each(['partials', 'helpers', 'text'], function (j, aspect) {
			if (!info) {
				// template was not defined yet, so no partials/helpers/text to load
				return p.fill(aspect)();
			}
			var ia = info[aspect];
			if (typeof ia === 'string') {
				ia = [ia];
			}
			if (Q.isEmpty(ia)) {
				p.fill(aspect)();
			} else if (aspect === 'text') {
				Q.Text.get(ia, p.fill(aspect));
			} else if (aspect === 'partials') {
				var p2 = Q.pipe(ia, function (params) {
					var result = {};
					var errors = null;
					try {
						Q.each(ia, function (i, pname) {
							var r = result[pname] = params[pname][1];
							root.Handlebars.registerPartial(pname, r);
						});
						p.fill(aspect)([null, result]);
					} catch (e) {
						e.params = params;
						p.fill(aspect)([e]);
					}
				});
				Q.each(ia, function (i, pname) {
					if (pname.split('.').pop() === 'js') {
						Q.addScript(pname, p2.fill(pname));
						ia.push(pname);
					} else {
						Q.Template.load(pname, p2.fill(pname));
					}
				});
			} else {
				Q.addScript(ia, p.fill(aspect));
			}
		});
	});
}, false, 2);

Q.leaves = new Q.Method(); 
Q.Method.define(Q);

/**
 * Methods for working with data
 * @class Q.Data
 */
Q.Data = Q.Method.define({
	digest: new Q.Method(),
	compress: new Q.Method(),
	decompress: new Q.Method(),
	sign: new Q.Method(),
	verify: new Q.Method(),
	all: function (a, b) {
		return a && b;
	},
	toBase64: function (bytes) {
		return btoa(String.fromCharCode.apply(String, new Uint8Array(bytes)));
	},
	fromBase64: function (base64) {
		return Uint8Array.from(atob(base64), function(m) {
			return m.codePointAt(0)
		});
	},
	blobFromDataURL: function (dataURL) {
		var arr = dataURL.split(','), mime = arr[0].match(/:(.*?);/)[1],
		bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
		while(n--){
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new Blob([u8arr], {type:mime});
	}
}, "methods/Q/Data", function() {
	return [Q];
});

/**
 * Module for loading text from files.
 * Used for translations, A/B testing and more.
 * @class Q.Text
 * @constructor
 */
Q.Text = {
	collection: {},
	language: 'en',
	locale: 'US',
	dir: 'Q/text',

	/**
	 * Tests whether the text (typically one or more sample characters)
	 * is written in the alphabet of an RTL language.
	 * @method isRTL
	 * @static
	 * @param {String} text 
	 * @returns {boolean}
	 */
	isRTL: function (text) {
		return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);
	},

	/**
	 * Sets the language and locale to use in Q.Text.get calls.
	 * When Q is initialized, it is set by default from Q.first(Q.info.languages)
	 * @method setLanguage
	 * @static
	 * @param {String} language Something like "en"
	 * @param {String} locale Something like "US", but can also be blank if unknown
	 */
	setLanguage: function (language, locale) {
		Q.Text.language = language.toLowerCase();
		Q.Text.locale = locale && locale.toUpperCase();
		Q.Text.languageLocaleString = Q.Text.language
			+ (Q.Text.useLocale && Q.Text.locale ? '-' + Q.Text.locale : '');
		Q.Text.languageLocale = Q.Text.language
			+ (Q.Text.locale ? '-' + Q.Text.locale : '');
	},

	/**
	 * Sets the text for a specific text source.
	 * @method set
	 * @static
	 * @param {String} name The name of the text source
	 * @param {Object} content The content, a hierarchical object whose leaves are
	 *  the actual text translated into the current language in Q.Text.language
	 * @param {Boolean} [merge=false] If true, merges on top instead of replacing
	 * @return {Object} The content that was set, with any loaded overrides applied
	 */
	set: function (name, content, merge) {
		var obj, override, n, o;
		var lls = Q.Text.languageLocaleString;
		if (Q.Text.override[name]) {
			// override was specified for this content, merge over it
			content = Q.extend({}, content, 10, Q.Text.override[name]);
		}
		if (merge) {
			obj = Q.getObject([lls, name], Q.Text.collection);
		}
		if (obj) {
			Q.extend(obj, 10, content);
		} else {
			Q.setObject([lls, name], content, Q.Text.collection);
		}
		override = (content && content['@override']) || {};
		for (n in override) {
			Q.Text.override[n] = Q.extend(Q.Text.override[n], 10, override[n]);
			if (o = Q.getObject([lls, n], Q.Text.collection)) {
				// content was already loaded, merge over it in text collection
				Q.extend(o, 10, Q.Text.override[n]);
			}
		}
		return content;
	},

	/**
	 * Get the text from a specific text source or sources.
	 * @method get
	 * @static
	 * @param {String|Array} name The name of the text source. Can be an array,
	 *  in which case the text sources are merged in the order they are named there.
	 * @param {Function} callback Receives (err, content), may be called sync or async,
	 *  where content is an Object formed by merging all the named text sources.
	 * @param {Object} [options] Options to use for Q.request . May also include:
	 * @param {Boolean} [options.ignoreCache=false] If true, reloads the text source even if it's been already cached.
	 * @param {Boolean} [options.merge=false] For Q.Text.set if content is loaded
	 * @return {Q.Promise} Returns a promise, that is already resolved if the content
	 *  was already loaded, otherwise resolves later (asynchronously)
	 */
	get: function (name, callback, options) {
		options = options || {};
		return new Q.Promise(function (resolve, reject) {
			var dir = Q.Text.dir;
			var lls = Q.Text.languageLocaleString;
			var content = Q.getObject([lls, name], Q.Text.collection);
			if (content) {
				Q.handle(callback, Q.Text, [null, content]);
				resolve(content);
				return;
			}
			var func = _Q_Text_getter;
			if (options && options.ignoreCache) {
				func = func.force;
			}
			var names = Q.isArrayLike(name) ? name : [name];
			var pipe = Q.pipe(names, function (params, subjects) {
				var result = {};
				var errors = null;
				for (var i=0, l=names.length; i<l; ++i) {
					var name = names[i];
					if (params[name][0]) {
						errors = errors || {};
						errors[name] = params[name][0];
					} else if (params[name][1]) {
						var text = Q.getObject(
							[Q.Text.languageLocaleString, name],
							Q.Text.collection
						) || params[name][1];
						Q.extend(result, 10, text);
					}
				}
				Q.handle(callback, Q.Text, [errors, result]);
				if (Q.isEmpty(errors)) {
					resolve(result);
				} else {
					reject(errors);
				}
			});
			Q.ensure('Q.info.baseUrl', function () {
				Q.each(names, function (i, name) {
					var url = Q.url(dir + '/' + name + '/' + lls + '.json');
					return func(name, url, pipe.fill(name), 
						Q.extend({skipNonce: true}, options)
					);
				});	
			});
		});
	},

	/**
	 * Define text files in bulk for certain methods and name prefixes
	 * @param {String|Array} methods Can be "Q.Tool.define" or "Q.Template.set", or array of them
	 * @param {String} namePrefix The prefix for the names of tools to load the text files for
	 * @param {String|Array} textFileNames any additional files to have for Q.Tool.define
	 */
	addFor: function (methods, namePrefix, textFileNames) {
		if (!Q.isArrayLike(methods)) {
			methods = [methods]
		}
		if (!Q.isArrayLike(textFileNames)) {
			textFileNames = [textFileNames];
		}
		Q.each(methods, function (i, m) {
			Q.Text.addFor.defined = Q.Text.addFor.defined || {};
			var n = Q.normalize.memoized(namePrefix);
			var obj = {};
			obj[m] = obj[m] || {};
			obj[m][n] = textFileNames;
			Q.extend(Q.Text.addFor.defined, 3, obj);
		});
	},

	/**
	 * Get the array of text files added for this normalized name
	 * @param {String|Array} methods Can be "Q.Tool.define" or "Q.Template.set", or array of them
	 * @param {String} normalizedName The prefix for the names of tools to load the text files for
	 * @param {Object} objectToExtend This object's "text" property array will be set or extended.
	 * @return {Array} the array of text files, if any
	 */
	addedFor: function (method, normalizedName, objectToExtend) {
		var d = Q.Text.addFor.defined[method];
		if (!d) {
			return [];
		}
		objectToExtend = objectToExtend || {};
		for (var namePrefix in d) {
			if (!normalizedName.startsWith(namePrefix)) {
				continue;
			}
			if (objectToExtend && objectToExtend.text === false) {
				continue; // asked not to extend
			}
			var text = objectToExtend.text = objectToExtend.text || [];
			Q.each(d[namePrefix], function (i, t) {
				if (text.indexOf(t) < 0) {
					text.push(t);
				}
			});
			break;
		}
		return text;
	},
	
	override: {}
};

Q.Text.addFor.defined = {};

/**
 * Array of text files to load before calling Q.onInit
 * @property {Array} loadBeforeInit
 */
Q.Text.loadBeforeInit = [];

// Set the initial language, but this can be overridden after Q.onInit
var language = location.search.queryField('Q.language') || navigator.language;
Q.Text.setLanguage.apply(Q.Text, language.split('-'));

var _Q_Text_getter = Q.getter(function (name, url, callback, options) {
	var o = Q.extend({extend: false, skipNonce: true}, options);
	return Q.request(url, function (err, content) {
		if (err && !url.endsWith("en.json")) {
			url = url.replace(/[^\/]{2,5}\.json$/, "en.json");
			return _Q_Text_getter.force(name, url, callback, options);
		} else {
			Q.Text.set(name, content, o.merge);
		}
		Q.handle(callback, Q.Text, [err, content]);
	}, o);
}, {
	cache: Q.Cache.document('Q.Text.get', 100),
	throttle: 'Q.Text.get'
});

var _qsockets = {}, _eventHandlers = {}, _connectHandlers = {}, _ioCleanup = [];
var _socketRegister = [];

function _ioOn(obj, evt, callback) {
	// In case we call this function again during a reconnect,
	// and the functions were already bound, remove them first.
	obj.off(evt, callback);
	obj.on(evt, callback);
 	_ioCleanup.push(function () { 
 		obj.off(evt, callback);
 	});
}

Q.isDocumentHidden = function (event) {
	if (event) {
		if (event.type == 'pause' || event.type == 'resign') {
			return true;
		}
		if (event.type == 'resume' || event.type == 'active') {
			return false;
		}
	}
	return document.visibilityState === 'hidden';
};

var maxTouchPoints = (root.navigator && root.navigator.maxTouchPoints) & 0xFF;
var isTouchscreen = ('ontouchstart' in root || !!maxTouchPoints);
var hasNoMouse = root.matchMedia ? !root.matchMedia('(any-hover: hover)').matches : null;
var useTouchEvents = isTouchscreen && (hasNoMouse === true);
var isTablet = navigator.userAgent.match(/tablet|ipad/i)
	|| (useTouchEvents && !navigator.userAgent.match(/mobi/i));
/**
 * Useful info about the page and environment
 * @property {Object} info
 */
Q.info = {
	useTouchEvents: useTouchEvents,
	hasNoMouse: hasNoMouse,
	forceFormFactor: location.search.queryField("Q.formFactor"),
	isTouchscreen: isTouchscreen,
	isTablet: isTablet,
	isIE: function (minVersion, maxVersion) {
		return Q.info.browser.name === 'explorer'
			&& (minVersion == undefined || minVersion <= Q.info.browser.mainVersion)
			&& (maxVersion == undefined || maxVersion >= Q.info.browser.mainVersion);
	},
	isAndroid: function (maxWidth, maxHeight, minVersion, maxVersion) {
		return Q.info.platform === 'android'
			&& (maxWidth == undefined || maxWidth >= Q.Visual.windowWidth())
			&& (maxHeight == undefined || maxHeight >= Q.Visual.windowHeight())	
			&& (minVersion == undefined || minVersion <= Q.info.browser.mainVersion)
			&& (maxVersion == undefined || maxVersion >= Q.info.browser.mainVersion);
	}
};
function _setNotch() {
	var proceed = false;
	var div = document.createElement('div');
	var CSS = window.CSS || null;
	if (CSS && CSS.supports('padding-top: env(safe-area-inset-top)')) {
		div.style.paddingTop = 'env(safe-area-inset-top)';
		proceed = true;
	} else if (CSS && CSS.supports('padding-top: constant(safe-area-inset-top)')) {
		div.style.paddingTop = 'constant(safe-area-inset-top)';
		proceed = true;
	}
	if (CSS && CSS.supports('padding-bottom: env(safe-area-inset-bottom)')) {
		div.style.paddingBottom = 'env(safe-area-inset-bottom)';
		proceed = true;
	} else if (CSS && CSS.supports('padding-bottom: constant(safe-area-inset-bottom)')) {
		div.style.paddingBottom = 'constant(safe-area-inset-bottom)';
		proceed = true;
	}
	if (proceed) {
		document.body.appendChild(div);
		var calculatedPadding = parseInt(div.computedStyle('padding-top'))
			+ parseInt(div.computedStyle('padding-bottom'));
		document.body.removeChild(div);
		if (calculatedPadding > 40) {
			Q.info.hasNotch = true;
		}
	}
	Q.info.hasNotch = false;
}
if (document.readyState === "complete") {
	_setNotch();
} else {
	document.addEventListener("DOMContentLoaded", _setNotch);
}
Q.info.isAndroidStock = !!(Q.info.platform === 'android'
	&& navigator.userAgent.match(/Android .*Version\/[\d]+\.[\d]+/i));
Q.info.isMobile = Q.info.isTouchscreen && !Q.info.isTablet;
Q.info.formFactor = Q.info.isMobile ? 'mobile' : (Q.info.isTablet ? 'tablet' : 'desktop');
var de = document.documentElement;
de.addClass('Q_js');

Q.ignoreBackwardCompatibility = {
	dashboard: false,
	notices: false
};

Q.Page.onLoad('').set(function () {
	de.addClass(Q.info.uri.module + '_' + Q.info.uri.action)
		.addClass(Q.info.uri.module);
}, 'Q');
Q.Page.beforeUnload('').set(function () {
	de.removeClass(Q.info.uri.module + '_' + Q.info.uri.action)
		.removeClass(Q.info.uri.module);
}, 'Q');


function _detectOrientation(e) {
	var w = window;
	var d = document;
	var h = d.documentElement;
	var b = d.getElementsByTagName('body')[0];
	var x = w.innerWidth || h.clientWidth || (b && b.clientWidth);
	var y = w.innerHeight|| h.clientHeight|| (b && b.clientHeight);
	var m = w.matchMedia;
	if ((m && m("(orientation: landscape)").matches) || x > y) {
		h.removeClass('Q_verticalOrientation')
			.addClass('Q_horizontalOrientation');
		Q.info.isVertical = false;
	} else {
		h.removeClass('Q_horizontalOrientation')
			.addClass('Q_verticalOrientation');
		Q.info.isVertical = true;
	}
}

function _setLayoutInterval(e) {
	if (!Q.info.isTouchscreen
	|| !_setLayoutInterval.options.milliseconds) {
		return;
	}
	var w = Q.Visual.windowWidth();
	var h = Q.Visual.windowHeight();
	setInterval(function () {
		var ae = document.activeElement;
		if (ae && ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(ae.tagName.toUpperCase()) >= 0) {
			return;
		}
		var w2 = Q.Visual.windowWidth();
		var h2 = Q.Visual.windowHeight();
		if (w !== w2 || h !== h2) {
			Q.layout();
		}
		w = w2;
		h = h2;
	}, _setLayoutInterval.options.milliseconds);
}

_setLayoutInterval.options = {
	milliseconds: 300
};

function _Q_Pointer_start_end_handler (e) {
	Q.Pointer.startedWhileRecentlyScrolled = false;
	Q.removeEventListener(e.target, Q.Pointer.end, _Q_Pointer_start_end_handler);
	Q.Pointer.stopCancelingClicksOnScroll(e.target);
}

/**
 * Methods for working with pointer and touchscreen events
 * @class Q.Visual
 */
Q.Visual = Q.Pointer = {

	/**
	 * Computes the intersection of two rectangles, if any.
	 * Note that edge intersection may have 0 width or height.
	 * @method intersection
	 * @static
	 * @param {Element|DOMRect} first 
	 * @param {Element|DOMRect} second 
	 * @return {DOMRect|null} The rectangle, or null if no intersection
	 */
	intersection: function (first, second) {
		(first instanceof Element) && (first = first.getBoundingClientRect());
		(second instanceof Element) && (second = second.getBoundingClientRect());
		if (first.left > second.right || second.left > first.right
		|| first.top > second.bottom || second.top > first.bottom) {
			return null;
		}
		var x = Math.max(first.left, second.left);
		var y = Math.max(first.top, second.top);
		return new root.DOMRect(
			x, y, 
			Math.min(first.right, second.right) - x,
			Math.max(first.bottom, second.bottom) - y
		);
	},

	/**
	 * Intelligent pointer start event that also works on touchscreens
	 * @static
	 * @method start
	 */
	start: function _Q_Pointer_start(params) {
		params.eventName =  Q.Pointer.start.eventName;
		return function (e) {
			Q.Pointer.movedTooMuchForClickLastTime = false;
			if (Q.Visual.recentlyScrolled) {
				Q.Pointer.startedWhileRecentlyScrolled = true;
			} else {
				Q.Pointer.canceledClick = false;
			}
			Q.Pointer.startCancelingClicksOnScroll(e.target);
			Q.removeEventListener(e.target, Q.Pointer.end, _Q_Pointer_start_end_handler);
			Q.addEventListener(e.target, Q.Pointer.end, _Q_Pointer_start_end_handler);
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Intelligent pointer end event that also works on touchscreens
	 * @static
	 * @method end
	 */
	end: function _Q_Pointer_end(params) {
		params.eventName = Q.Pointer.end.eventName;
		return params.original;
	},
	/**
	 * Intelligent pointer move event that also works on touchscreens
	 * @static
	 * @method move
	 */
	move: function _Q_Pointer_move(params) {
		params.eventName = Q.Pointer.move.eventName;
		return params.original;
	},
	/**
	 * Intelligent pointer enter event that also works on touchscreens
	 * @static
	 * @method enter
	 */
	enter: function _Q_Pointer_enter(params) {
		params.eventName = Q.Pointer.enter.eventName;
		return params.original;
	},
	/**
	 * Intelligent pointer leave event that also works on touchscreens
	 * @static
	 * @method leave
	 */
	leave: function _Q_Pointer_leave(params) {
		params.eventName = Q.Pointer.leave.eventName;
		return params.original;
	},
	/**
	 * Intelligent pointer cancel event that also works on touchscreens
	 * @static
	 * @method cancel
	 */
	cancel: function _Q_Pointer_cancel(params) {
		params.eventName = 'pointercancel'; // mousecancel can be a custom event
		return params.original;
	},
	/**
	 * Intelligent focusin event that fires only once per focusin
	 * @static
	 * @method focusin
	 * @param {Object} [params={}] if passed, it is filled with "eventName"
	 */
	focusin: function (params) {
		params.eventName = (Q.info.browser.engine === 'gecko' ? 'focus' : 'focusin');
		var justHandled = false;
		return function _Q_focusin_on_wrapper (e) {
			if (justHandled) return;
			justHandled = true;
			setTimeout(function () {
				justHandled = false;
			}, 300);
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Intelligent focusout event that fires only once per focusout
	 * @static
	 * @method focusout
	 * @param {Object} [params={}] if passed, it is filled with "eventName"
	 */
	focusout: function (params) {
		params.eventName = (Q.info.browser.engine === 'gecko' ? 'blur' : 'focusout');
		var justHandled = false;
		return function _Q_focusout_on_wrapper (e) {
			if (justHandled) return;
			justHandled = true;
			setTimeout(function () {
				justHandled = false;
			}, 300);
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Intelligent click event that also works on touchscreens, and respects Q.Pointer.canceledClick
	 * @static
	 * @method click
	 * @param {Object} [params={}] if passed, it is filled with "eventName"
	 */
	click: function _Q_click(params) {
		params.eventName = 'click';
		return function _Q_click_on_wrapper (e) {
			if (Q.Pointer.canceledClick) {
				return Q.Pointer.preventDefault(e);
			}
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Like click event but works on touchscreens even if the viewport moves 
	 * during click, such as when the on-screen keyboard disappears
	 * or a scrolling parent gets scrollTop = 0 because content changed.
	 * Respects Q.Pointer.canceledClick
	 * @static
	 * @method touchclick
	 * @param {Object} [params={}] if passed, it is filled with "eventName"
	 */
	touchclick: function _Q_touchclick (params) {
		if (!Q.info.isTouchscreen) {
			return Q.Pointer.click(params);
		}
		params.eventName = Q.info.useTouchEvents ? 'touchstart' : 'pointerdown';
		return function _Q_touchclick_on_wrapper (e) {
			var _relevantClick = true;
			var t = this, a = arguments;
			function _clickHandler(e) {
				Q.removeEventListener(root, 'click', _clickHandler);
				if (Q.Pointer.canceledClick) {
					return Q.Pointer.preventDefault(e);
				}
				if (_relevantClick) {
					params.original.apply(t, a);
				}
			}
			function _touchendHandler(e) {
				Q.removeEventListener(this, 'touchend', _touchendHandler);
				setTimeout(function () {
					_relevantClick = false;
				}, Q.Pointer.touchclick.duration);
			}
			Q.addEventListener(root, 'click', _clickHandler);
			Q.addEventListener(this, 'touchend', _touchendHandler);
		};
	},
	/**
	 * Whether the user has clicked at least once in the webpage
	 * @static
	 * @property {boolean} clickedAtLeastOnce
	 */
	clickedAtLeastOnce: false,
	/**
	 * Whether the latest click was canceled by Q.Pointer.cancelClick()
	 * @static
	 * @property {boolean} canceledClick
	 */
	canceledClick: false,
	/**
	 * Returns the document's scroll left in pixels, consistently across browsers
	 * @static
	 * @method scrollLeft
	 * @return {number}
	 */
	scrollLeft: function () {
		return root.pageXOffset || document.documentElement.scrollLeft || (document.body && document.body.scrollLeft);
	},
	/**
	 * Returns the document's scroll top in pixels, consistently across browsers
	 * @static
	 * @method scrollTop
	 * @return {number}
	 */
	scrollTop: function () {
		return root.pageYOffset || document.documentElement.scrollTop || (document.body && document.body.scrollTop);
	},
	/**
	 * Returns the document's left position in pixels, consistently across browsers
	 * @static
	 * @method positionLeft
	 * @return {number}
	 */
	positionLeft: function () {
		var documentPosition = document.documentElement.getBoundingClientRect().left;
		var bodyPosition = 0;
		if (document.body) {
			bodyPosition = document.body.getBoundingClientRect().left;
		}

		return root.pageXOffset || documentPosition || bodyPosition;
	},
	/**
	 * Returns the document's top position in pixels, consistently across browsers
	 * @static
	 * @method positionTop
	 * @return {number}
	 */
	positionTop: function () {
		var documentPosition = -document.documentElement.getBoundingClientRect().top;
		var bodyPosition = 0;
		if (document.body) {
			bodyPosition = -document.body.getBoundingClientRect().top;
		}

		return root.pageYOffset || documentPosition || bodyPosition;
	},
	/**
	 * Returns the window's inner width, in pixels, consistently across browsers
	 * @static
	 * @method windowWidth
	 * @return {number}
	 */
	windowWidth: function () {
		return root.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	},
	/**
	 * Returns the window's inner height, in pixels, consistently across browsers
	 * @static
	 * @method windowHeight
	 * @return {number}
	 */
	windowHeight: function () {
		return root.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	},
	/**
	 * Get the rectangle enclosing all the children of the container element
	 * and – for their children with overflow: visible – their overflowed contents.
	 * @static
	 * @method boundingRect
	 * @param {HTMLElement} [container=document.body] The container element
	 * @param {Array} [omitClasses] Put CSS classes of any elements to omit from calculations
	 * @param {boolean} [omitOverflow=false] If true, doesn't use overflowed content in calculations
	 * @return {Object} with properties left, right, top, bottom, width, height
	 */
	boundingRect: function (container, omitClasses, omitOverflow) {
		var rect = {left: 0, top: 0};
		rect.right = Q.Visual.windowWidth();
		rect.bottom = Q.Visual.windowHeight();
		container = container || document.body;
		var sl = Q.Visual.scrollLeft();
		var st = Q.Visual.scrollTop();
		Q.each(container.children || container.childNodes, function () {
			if (this.hasClass && omitClasses) {
				for (var i=0, l=omitClasses.length; i<l; ++i) {
					if (this.hasClass(omitClasses[i])) return;
				}
			}
			var bcr = this.getBoundingClientRect();
			var r = {
				left: bcr.left,
				top: bcr.top,
				right: bcr.right,
				bottom: bcr.bottom
			};
			if (!r) return;
			r.left += sl; r.right += sl;
			r.top += st; r.bottom += st;
			var cs = this.computedStyle();
			if (!omitOverflow && cs.overflow === 'visible') {
				if (this.scrollWidth > r.right - r.left) {
					r.right += this.scrollWidth - (r.right - r.left);
					r.left -= this.scrollLeft;
				}
				if (this.scrollHeight > r.bottom - r.top) {
					r.bottom += this.scrollHeight - (r.bottom - r.top);
					r.top -= this.scrollTop;
				}
			}
			if (r.right - r.left == 0 || r.bottom - r.top == 0) return;
			rect.left = Math.min(rect.left, r.left);
			rect.top = Math.min(rect.top, r.top);
			rect.right = Math.max(rect.right, r.right);
			rect.bottom = Math.max(rect.bottom, r.bottom);
		});
		rect.width = rect.right - rect.left;
		rect.height = rect.bottom - rect.top;
		return rect;
	},
	/**
	 * Call this function to find out whether a click on a link
	 * should typically result in opening a new window on this
	 * operating system. Since the choice of tab or window is
	 * controlled by the browser preferences, this function just
	 * returns a boolean in either case so you can do window.open().
	 * @method shouldOpenInNewWindow
	 * @static
	 * @param {Event} event
	 * @return {Boolean}
	 */
	shouldOpenInNewWindow: function (event) {
		return event && event.shiftKey
			|| (Q.info.platform === 'windows' && event.ctrlKey)
			|| (Q.info.platform === 'mac' && event.metaKey);
	},
	/**
	 * Returns the x coordinate of an event relative to the document
	 * @static
	 * @method getX
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @param {Integer} [touchIndex=0] The index inside array of touches, if any
	 * @return {number}
	 */
	getX: function(e, touchIndex) {
		var oe = e.originalEvent || e;
		touchIndex = touchIndex || 0;
		oe = (oe.touches && oe.touches.length)
			? oe.touches[touchIndex]
			: (oe.changedTouches && oe.changedTouches.length
				? oe.changedTouches[touchIndex]
				: oe
			);
		return Math.max(0, ('pageX' in oe) ? oe.pageX : oe.clientX + Q.Visual.scrollLeft());
	},
	/**
	 * Returns the y coordinate of an event relative to the document
	 * @static
	 * @method getY
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @param {Integer} [touchIndex=0] The index inside array of touches, if any
	 * @return {number}
	 */
	getY: function(e, touchIndex) {
		var oe = e.originalEvent || e;
		touchIndex = touchIndex || 0;
		oe = (oe.touches && oe.touches.length)
			? oe.touches[touchIndex]
			: (oe.changedTouches && oe.changedTouches.length
				? oe.changedTouches[touchIndex]
				: oe
			);
		return Math.max(0, ('pageY' in oe) ? oe.pageY : oe.clientY + Q.Visual.scrollTop());
	},
	/**
	 * Returns the number of touch points of an event
	 * @static
	 * @method touchCount
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {number}
	 */
	touchCount: function (e) {
		var oe = e.originalEvent || e;
 		return oe.touches ? oe.touches.length : (Q.Visual.which(e) > 0 ? 1 : 0);
	},
	/**
	 * Returns which button was pressed - Q.Pointer.which.{LEFT|MIDDLE|RIGHT|NONE}
	 * @static
	 * @method which
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {number}
	 */
	which: function (e) {
		var button = e.button, which = e.which;
		if (!which && button !== undefined ) {
			which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
		}
		return which;
	},
	/**
	 * Return whether button was pressed or at least one finger is touching touchscreen
	 * @static
	 * @method isPressed
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {boolean}
	 */
	isPressed: function (e) {
		return !!(Q.Pointer.which(e) || Q.Pointer.touchCount(e));
	},
	/**
	 * Consistently returns the target of an event across browsers
	 * @static
	 * @method target
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {HTMLElement}
	 */
	target: function (e) {
		var target = e.target || e.srcElement;
		if (target.nodeType === 3) { // Safari bug
			target = target.parentElement;
		}
		return target;
	},
	/**
	 * Consistently returns the related target of an event across browsers
	 * @static
	 * @method relatedTarget
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {HTMLElement}
	 */
	relatedTarget: function (e) {
		return e.relatedTarget = e.relatedTarget || (e.type == 'mouseover' ? e.fromElement : e.toElement);	
	},
	/**
	 * Computes the offset of an element relative to the browser
	 * @static
	 * @method offset
	 * @param {Element} element
	 * @return {Object} An object with "left" and "top" properties.
	 */
	offset: function (element) {
		var offsetLeft = 0, offsetTop = 0;
		do {
			if (!isNaN(element.offsetLeft)) {
				offsetLeft += element.offsetLeft;
			}
			if (!isNaN(element.offsetTop)) {
				offsetTop += element.offsetTop;
			}
		} while (element = element.offsetParent);
		return { left: offsetLeft,  top: offsetTop };
	},
	/**
	 * Consistently prevents the default behavior of an event across browsers
	 * @static
	 * @method preventDefault
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {boolean} Whether the preventDefault succeeded
	 */
	preventDefault: function (e) {
		if (('cancelable' in e) && !e.cancelable) {
			return false;
		}
		e.preventDefault ? e.preventDefault() : e.returnValue = false;
		return true;
	},
	/**
	 * Consistently obtains the element under pageX and pageY relative to document
	 * @static
	 * @method elementFromPoint
	 * @param {Number} pageX horizontal coordinates relative to the page
	 * @param {Number} pageY vertical coordinates relative to the page
	 * @return {HTMLElement}
	 */
	elementFromPoint: function (pageX, pageY) {
		return document.elementFromPoint(
			pageX - Q.Visual.scrollLeft(),
			pageY - Q.Visual.scrollTop()
		);
	},
	clearSelection: function () {
		if (window.getSelection) {
			if (window.getSelection().empty) {  // Chrome
				window.getSelection().empty();
			} else if (window.getSelection().removeAllRanges) {  // Firefox
				window.getSelection().removeAllRanges();
			}
		} else if (document.selection && document.selection.empty) {  // IE?
			document.selection.empty();
		}
	},
	/**
	 * Call this function to begin canceling clicks on the element or its scrolling parent.
	 * This is to good for preventing stray clicks from happening after an accidental scroll,
	 * for instance if content changed after a tab was selected, and scrollTop became 0.
	 * @method startCancelingClicksOnScroll
	 * @param {Element} [element] If you skip this, all scrolling cancels clicks
	 */
	startCancelingClicksOnScroll: function (element) {
		var sp;
		if (element && (sp = element.scrollingParent(true))) {
			Q.addEventListener(sp, 'scroll', _handleScroll);
		} else {
			Q.addEventListener(document.body, 'scroll', _handleScroll, true);
		}
	},
	/**
	 * Call this function to stop canceling clicks on the element or its scrolling parent.
	 * This is to good for preventing stray clicks from happening after an accidental scroll,
	 * for instance if content changed after a tab was selected, and scrollTop became 0.
	 * @method startCancelingClicksOnScroll
	 * @param {
	 */
	stopCancelingClicksOnScroll: function (element) {
		if (element) {
			var sp = element.scrollingParent(true);
			Q.removeEventListener(sp, 'scroll', _handleScroll);
		} else {
			Q.removeEventListener(document.body, 'scroll', _handleScroll);
		}
	},
	/**
	 * This event occurs when a click has been canceled, for one of several possible reasons.
	 * @static
	 * @event onCancelClick
	 */
	onCancelClick: new Q.Event(),
	/**
	 * This event occurs when touching or mouse pressing should have ended anywhere
	 * @static
	 * @event onEnded
	 */
	onEnded: new Q.Event(),
	/**
	 * This event occurs when touching or mouse pressing should have started anywhere
	 * @static
	 * @event onStarted
	 */
	onStarted: new Q.Event(),
	/**
	 * The distance that a finger or mouse has to move for the click to be canceled
	 * @static
	 * @property options.cancelClickDistance
	 */
	options: {
		cancelClickDistance: 10
	}
};

Q.addEventListener(root, 'click', function _clicked() {
	Q.Pointer.clickedAtLeastOnce = true;
	Q.removeEventListener(root, 'click', _clicked);
}, false, true);

var _setRecentlyScrolledFalse = Q.debounce(function () {
	Q.Visual.recentlyScrolled = false;
}, 300);

function _handleScroll(event) {
	// if input element stuff exceeds width of element, blur will lead to scroll element to the start
	// this will lead to cancel first click on submit button because before click fired blur from input
	if (Q.typeOf(event).toLowerCase() === "event"
	&& ["input", "select"].includes(
		Q.getObject("target.tagName", event).toLowerCase())
	) {
		return false;
	}
	if (Q.Pointer.latest.touches.length) {
		// no need to cancel click here, user will have to lift their fingers to click
		return false;
	}
	Q.Visual.recentlyScrolled = true;
	setTimeout(_setRecentlyScrolledFalse, 100);
	var shouldStopCancelClick = !Q.Pointer.movedTooMuchForClickLastTime
		&& !Q.Pointer.startedWhileRecentlyScrolled;
	Q.Pointer.cancelClick(true, null, {
		comingFromScroll: true
	}, shouldStopCancelClick ? 300 : 0);
}

var _useTouchEvents = Q.info.useTouchEvents;
Q.Pointer.start.eventName = _useTouchEvents ? 'touchstart' : 'pointerdown';
Q.Pointer.move.eventName = _useTouchEvents ? 'touchmove' : 'pointermove';
Q.Pointer.end.eventName = _useTouchEvents ? 'touchend' : 'pointerup';
Q.Pointer.cancel.eventName = _useTouchEvents ? 'touchcancel' : 'pointercancel';
Q.Pointer.enter.eventName = _useTouchEvents ? 'touchenter' : 'pointerenter';
Q.Pointer.leave.eventName = _useTouchEvents ? 'touchleave' : 'pointerleave';

Q.Pointer.which.NONE = 0;
Q.Pointer.which.LEFT = 1;
Q.Pointer.which.MIDDLE = 2;
Q.Pointer.which.RIGHT = 3;
Q.Pointer.touchclick.duration = 400;

Q.Pointer.latest = {
	which: Q.Visual.which.NONE,
	touches: []
};

Q.addEventListener(document.body, 'pointerdown', function (e) {
	Q.Pointer.latest.which = Q.Visual.which(e);
	Q.Pointer.latest.touches = e.touches || [];
}, false, true);

Q.addEventListener(document.body, 'pointerup pointercancel', function (e) {
	Q.Pointer.latest.which = Q.Visual.which(e);
	Q.Pointer.latest.touches = e.touches || [];
}, false, true);

var _pos, _dist, _last, _lastTimestamp, _lastVelocity;
function _Q_PointerStartHandler(e) {
	Q.Pointer.started = Q.Pointer.target(e);
	Q.Pointer.canceledClick = false;
	Q.addEventListener(window, Q.Pointer.move, _onPointerMoveHandler, false, true);
	Q.addEventListener(window, Q.Pointer.end, _onPointerEndHandler, false, true);
	Q.addEventListener(window, Q.Pointer.cancel, _onPointerEndHandler, false, true);
	Q.addEventListener(window, Q.Pointer.click, _onPointerClickHandler, false, true);
	Q.handle(Q.Pointer.onStarted, this, arguments);
	var screenX = Q.Pointer.getX(e) - Q.Visual.scrollLeft();
	var screenY = Q.Pointer.getY(e) - Q.Visual.scrollTop();
	_pos = { // first movement
		x: screenX,
		y: screenY
	};
	_dist = _last = _lastTimestamp = _lastVelocity = null;
	Q.Pointer.movement = {
		times: [],
		positions: [],
		velocities: [],
		movingAverageVelocity: null,
		accelerations: [],
		timeout: 300
	};
}

var _pointerMoveTimeout = null;
function _onPointerMoveHandler(evt) { // see http://stackoverflow.com/a/2553717/467460
	clearTimeout(_pointerMoveTimeout);
	var screenX = Q.Visual.getX(evt) - Q.Visual.scrollLeft();
	var screenY = Q.Visual.getY(evt) - Q.Visual.scrollTop();
	if (!screenX || !screenY || Q.Pointer.canceledClick
	|| (!evt.button && (evt.touches && !evt.touches.length))) {
		return;
	}
	var ccd = Q.Pointer.options.cancelClickDistance;
	if (_pos && (
		(_pos.x && Math.abs(_pos.x - screenX) > ccd)
	 || (_pos.y && Math.abs(_pos.y - screenY) > ccd)
	)) {
		// finger moved more than the threshhold
		if (false !== Q.Pointer.cancelClick(true, evt, {
			fromX: _pos.x,
			fromY: _pos.y,
			toX: screenX,
			toY: screenY,
			comingFromPointerMovement: true
		})) {
			_pos = false;
			Q.Pointer.movedTooMuchForClickLastTime = true;
		}
	}
	var _timestamp = Q.milliseconds();
	Q.Pointer.movement.times.push(_timestamp);
	if (_last && _lastTimestamp) {
		_dist = {
			x: screenX - _last.x,
			y: screenY - _last.y
		};
		var _timeDiff = _timestamp - _lastTimestamp;
		var velocity = {
			x: _dist.x / _timeDiff,
			y: _dist.y / _timeDiff
		};
		Q.Pointer.movement.velocities.push(velocity);
		if (_lastVelocity != null) {
			Q.Pointer.movement.accelerations.push({
				x: (velocity.x - _lastVelocity.x) / _timeDiff,
				y: (velocity.y - _lastVelocity.y) / _timeDiff
			});
		}
		_lastVelocity = velocity;
		var times = Q.Pointer.movement.times;
		var velocities = Q.Pointer.movement.velocities;
		var totalX = 0, totalY = 0;
		var t = _timestamp;
		for (var i=times.length-1; i>=1; --i) {
			var tNext = times[i];
			if (tNext < _timestamp - 100) break;
			var v = velocities[i-1];
			totalX += v.x * (t-tNext);
			totalY += v.y * (t-tNext);
			t = tNext;
		}
		var tDiff = _timestamp - t;
		Q.Pointer.movement.movingAverageVelocity = tDiff
			? { x: totalX / tDiff, y: totalY / tDiff }
			: Q.Pointer.movement.velocities[velocities.length-1];
		_pointerMoveTimeout = setTimeout(function () {
			// no movement for a while
			_timeDiff = Q.milliseconds() - _lastTimestamp;
			var noMovement = {x: 0, y: 0};
			var movement = Q.Pointer.movement;
			movement.times.push(_timestamp);
			movement.velocities.push(noMovement);
			movement.movingAverageVelocity = noMovement;
			movement.accelerations.push({
				x: -velocity.x / _timeDiff,
				y: -velocity.y / _timeDiff
			});
		}, Q.Pointer.movement.timeout);
	}
	_lastTimestamp = _timestamp;
	_last = {
		x: screenX,
		y: screenY
	};
	Q.Pointer.movement.positions.push(_last);

}

/**
 * Removes event listeners that are activated when the pointer has started.
 * This method is called automatically when the mouse or fingers are released
 * on the window. However, in the code that stops propagation of the Q.Visual.end
 * event (pointerup or touchend), you'd have to call this method manually.
 * @method ended
 * @static
 */
var _onPointerEndHandler = Q.Pointer.ended = function _onPointerEndHandler() {
	setTimeout(function () {
		Q.Pointer.started = null;
	}, 0);
	clearTimeout(_pointerMoveTimeout);
	Q.removeEventListener(window, Q.Pointer.move, _onPointerMoveHandler);
	Q.removeEventListener(window, Q.Pointer.end, _onPointerEndHandler);
	Q.removeEventListener(window, Q.Pointer.cancel, _onPointerEndHandler);
	Q.removeEventListener(window, Q.Pointer.click, _onPointerClickHandler);
	Q.handle(Q.Pointer.onEnded, this, arguments);
	_pos = false;
	setTimeout(function () {
		Q.Pointer.canceledClick = false;
	}, 100);
};

function _onPointerClickHandler(e) {
	if (Q.Pointer.canceledClick) {
		e.preventDefault();
	}
	Q.removeEventListener(window, Q.Pointer.click, _onPointerClickHandler);
}

Q.info.useFullscreen = Q.info.isMobile && Q.info.isAndroid(1000)
	&& Q.info.isAndroidStock && Q.info.browserMainVersion < 11;

Q.addEventListener(window, Q.Pointer.start, _Q_PointerStartHandler, false, true);

function noop() {}
if (!root.console) {
	root.console = {
		debug: noop,
		dir: noop,
		error: noop,
		group: noop,
		groupCollapsed: noop,
		groupEnd: noop,
		info: noop,
		log: noop,
		time: noop,
		timeEnd: noop,
		trace: noop,
		warn: noop
	};
}
root.console.log.register = function (name) {
	return root.console.log[name] = function() {
		var params = Array.prototype.slice.call(arguments);
		params.unshift('%c' + name + ':', "background: gray; color: white; font-weight: bold;");
		console.log.apply(console, params);
	};
};
root.console.log.unregister = function (name) {
	root.console.log[name] = function () { }
};
var log = root.console.log.register('Q');

Q.addEventListener(window, 'load', Q.onLoad.handle);
Q.onLoad.add(function () {
    document.documentElement.addClass('Q_loaded');
}, 'Q');
Q.onInit.add(function () {
	console.log("%c"+(Q.info.app||'App')+" - powered by Qbix", "color: blue; font-size: 20px");
	console.log("%c"+"Visit https://qbix.com/platform to learn how this open source platform works.", "color: gray; font-size: 12px; font-weight: bold;");
	console.log("%c"+"You too can build apps for communities, and make money from clients worldwide.", "color: gray; font-size: 12px; font-weight: bold;");
	de.addClass(Q.info.isTouchscreen  ? 'Q_touchscreen' : 'Q_notTouchscreen');
	de.addClass(Q.info.isMobile ? 'Q_mobile' : 'Q_notMobile');
	de.addClass(Q.info.isAndroid() ? 'Q_android' : 'Q_notAndroid');
	de.addClass(Q.info.isStandalone ? 'Q_standalone' : 'Q_notStandalone');
	de.addClass(Q.info.isWebView ? 'Q_webView' : 'Q_notWebView');
	de.removeClass(Q.info.isTouchscreen  ? 'Q_notTouchscreen' : 'Q_touchscreen');
	de.removeClass(Q.info.isMobile ? 'Q_notMobile' : 'Q_mobile');
	de.removeClass(Q.info.isAndroid() ? 'Q_notAndroid' : 'Q_android');
	de.removeClass(Q.info.isStandalone ? 'Q_notStandalone' : 'Q_standalone');
	de.removeClass(Q.info.isWebView ? 'Q_notWebView' : 'Q_webView');
	if (Q.info.browser && Q.info.browser.device == 'iPad') {
		de.addClass('Q_ipad');
	}
	if (Q.info.isAndroidStock) {
		de.addClass('Q_androidStock');
	}
	if (Q.info.hasNotch) {
		de.addClass('Q_notch');
	}
	Q_hashChangeHandler.currentUrl = root.location.href.split('#')[0];
	Q_hashChangeHandler.currentUrlTail = Q_hashChangeHandler.currentUrl
		.substring(Q.baseUrl().length + 1);
	if (window.history.pushState) {
		Q.onPopState.set(Q_popStateHandler, 'Q.loadUrl');
	} else {
		Q.onHashChange.set(Q_hashChangeHandler, 'Q.loadUrl');
	}

	var QtQw = Q.text.Q.words;
	Q.Pointer.ClickOrTap = QtQw.ClickOrTap = useTouchEvents ? QtQw.Tap : QtQw.Click;
	Q.Pointer.clickOrTap = QtQw.clickOrTap = useTouchEvents ? QtQw.tap : QtQw.click;
	Q.Pointer.CLICKORTAP = QtQw.CLICKORTAP = QtQw.clickOrTap.toUpperCase();
	
	if (['en', 'en-US'].indexOf(Q.Text.languageLocale) < 0) {
		Q.Text.get('Q/content', function (err, text) {
			if (!text) {
				return;
			}
			Q.extend(Q.text.Q, 10, text);
			var QtQw = Q.text.Q.words;
			QtQw.ClickOrTap = useTouchEvents ? QtQw.Tap : QtQw.Click;
			QtQw.clickOrTap = useTouchEvents ? QtQw.tap : QtQw.click;
			Q.layout(null, true);
		});
	}

	// hook beforeunload event
	Q.addEventListener(window, 'beforeunload', function (e) {
		if (!e.defaultPrevented) {
			_documentIsUnloading = true; // WARN: a later handler might cancel the event
		}
	});
}, 'Q');

// Q.Text.addFor(
// 	['Q.Tool.define', 'Q.Template.set'],
// 	'Q/', ["Q/content"]
// );
Q.Tool.define({
	"Q/lazyload": "{{currentScriptPath}}/tools/Q/lazyload.js"
/*
	"Q/tabs": {
		js: "{{Q}}/js/tools/tabs.js",
		css: "{{Q}}/css/tools/tabs.css"
	}
*/
});

function _addHandlebarsHelpers() {
	var Handlebars = root.Handlebars;
	/**
	 * Call this in your helpers to parse the args into a useful array
	 * You must call it like this: Handlebars.prepareArgs.call(this, arguments)
	 * @method prepareArgs
	 * @static
	 * @param {Array} arguments to helper function
	 * @return {array}
	 */
	Handlebars.prepareArgs = function(args) {
		var arr = Array.prototype.slice.call(args, 0);
		var last = arr.pop(); // last parameter is for the hash
		arr.shift(); // the pattern
		var result = Q.isEmpty(last.hash) ? {} : Q.copy(last.hash);
		Q.each(arr, function (i, item) {
			result[i] = item;
		});
		return Q.extend(result, this);
	};
	if (!Handlebars.helpers.call) {
		Handlebars.registerHelper('call', function(path) {
			if (!path) {
				return "{{call missing method name}}";
			}
			var args = Handlebars.prepareArgs.call(this, arguments);
			var parts = path.split('.');
			var subparts = parts.slice(0, -1);
			var i=0;
			var params = [];
			do {
				params.push(args[i]);
			} while (args[++i]);
			var f = Q.getObject(parts, this);
			if (typeof f === 'function') {
				return f.apply(Q.getObject(subparts, this), params);
			}
			var f = Q.getObject(parts);
			if (typeof f === 'function') {
				return f.apply(Q.getObject(subparts), params);
			}
			return "{{call "+path+" not found}}";
		});
	}
	if (!Handlebars.helpers.ifEquals) {
		/* helper to compare two arguemnts for equal: {{#ifEquals arg1 arg2}} */
		Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
			return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
		});
	}
	if (!Handlebars.helpers.getObject) {
		Handlebars.registerHelper('getObject', function() {
			var args = Array.prototype.slice.call(arguments);
			var result = args.pop().data.root;
			Q.each(args, function (i, key) {
				if (typeof key === 'string' || typeof key === 'number') {
					result = result[key];
				}
			});
			return result;
		});
	}
	if (!Handlebars.helpers.tool) {
		Handlebars.registerHelper('idPrefix', function () {
			var ba = Q.Tool.beingActivated;
			return (ba ? ba.prefix : '');
		});
		Handlebars.registerHelper('join', function(array, sep, options) {
		    return array.map(function(item) {
		        return options.fn(item);
		    }).join(sep);
		});
		Handlebars.registerHelper('tool', function (name, id, tag, retain, options) {
			if (!name) {
				return "{{tool missing name}}";
			}
			if (Q.isPlainObject(retain)) {
				options = retain;
				retain = false;
			}
			if (Q.isPlainObject(tag)) {
				options = tag;
				tag = undefined;
			}
			if (Q.isPlainObject(id)) {
				options = id;
				id = undefined;
			}
			tag = tag || 'div';
			var ba = Q.Tool.beingActivated;
			var prefix = (ba ? ba.prefix : '');
			var o = {};
			var hash = (options && options.hash);
			var className;
			if (hash) {
				for (var k in hash) {
					if (k === 'class') {
						className = hash[k];
					} else if (!Q.isInteger(k)) {
						Q.setObject(k, hash[k], o, '-');
					}
				}
			}
			if (this && this[name]) {
				Q.extend(o, this[name]);
			}
			if (typeof id === 'string' || typeof id === 'number') {
				id = name.split('/').join('_') + (id !== '' ? '-'+id : '');
				if (this && this['id:'+id]) {
					Q.extend(o, this['id:'+id]);
				}
			}
			var attributes = {'class': className};
			if (retain) {
				attributes['data-Q-retain'] = true;
			}
			return Q.Tool.prepareHTML(tag, name, o, id, prefix, attributes);
		});
	}
	if (!Handlebars.helpers.url) {
		Handlebars.registerHelper('toUrl', function (url) {
			if (Q.isPlainObject(url)) {
				// we meant to pass a variable, not call a helper
				url = Q.getObject('data.root.toUrl', url);
			}
			if (!url) {
				return "{{url missing}}";
			}
			return Q.url(url);
		});
	}
	if (!Handlebars.helpers.toCapitalized) {
		Handlebars.registerHelper('toCapitalized', function(text) {
			if (Q.isPlainObject(text)) {
				// we meant to pass a variable, not call a helper
				text = Q.getObject('data.root.toCapitalized', text);
			}
			text = text || '';
			return text.charAt(0).toUpperCase() + text.slice(1);
		});
	}
	if (!Handlebars.helpers.json) {
		Handlebars.registerHelper('json', function(context) {
			if (typeof context == "object") {
				return JSON.stringify(context);
			}
			return context;
		});
	}
	if (!Handlebars.helpers.interpolate) {
		Handlebars.registerHelper('interpolate', function(expression) {
			if (!expression || arguments.length < 2) {
				return '';
			}
			var args = Handlebars.prepareArgs.call(this, arguments);
			return expression.interpolate(args);
		});
	}
	if (!Handlebars.helpers.option) {
		Handlebars.registerHelper('option', function(value, html, selectedValue) {
			var attr = value == selectedValue ? ' selected="selected"' : '';
			return new Handlebars.SafeString(
				'<option value="'+value.encodeHTML()+'"'+attr+'>'+html+"</option>"
			);
		});
	}
	if (!Handlebars.helpers.replace) {
		Handlebars.registerHelper('replace', function(find, replace, options) {
			return options.fn(this).replace(find, replace);
		});
	}
}

function _Q_trigger_recursive(tool, eventName, args) {
	if (!tool) {
		return false;
	}
	var obj = Q.getObject(eventName, tool);
	if (obj) {
		Q.handle(obj, tool, args);
	}
	var children = tool.children('', 1);
	for (var id in children) {
		for (var n in children[id]) {
			_Q_trigger_recursive(children[id][n], eventName, args);
		}
	}
}

Q.loadUrl.fillSlots = function _Q_loadUrl_fillSlots (res, url, options) {
	var elements = {}, name, elem, pos;
	var o = options || {};
	var osc = o.slotContainer;
	if (Q.isPlainObject(osc)) {
		o.slotContainer = function (slotName) {
			return osc[slotName] || document.getElementById(slotName+"_slot");
		};
	}
	for (name in res.slots) {
		// res.slots should not contain the slots that have
		// already been "cached", but even the server sends them,
		// we won't use them -- the client is the boss in this case!
		if (Q.loadUrl.retainedSlots[name]) {
			// Slots, unlike tools, won't have the equivalent of data-Q-replace
			// PS: this is especially needed after handling response.redirect
			continue;
		}

		if (name.toUpperCase() === 'TITLE') {
			document.title = res.slots[name];
		} else if (elem = o.slotContainer(name, res)) { 
			try {
				Q.replace(elem, res.slots[name], options);
				if (!o.dontRestoreScrollPosition['']
				&& !o.dontRestoreScrollPosition[url]
				&& (pos = Q.getObject(['Q', 'scroll', url], elem))
				) {
					elem.scrollLeft = pos.left;
					elem.scrollTop = pos.top;
				} else {
					// reset scrolling to top left corner by default
					elem.scrollLeft = o.scrollLeft || 0;
					elem.scrollTop = o.scrollTop || 0;
				}
			} catch (e) {
				debugger; // pause here if debugging
				console.warn('slot ' + name + ' could not be filled');
				console.warn(e);
			}
			elements[name] = elem;
		}
	}
	return elements;
}

Q.loadUrl.options = {
	quiet: false,
	onError: new Q.Event(),
	onResponse: new Q.Event(),
	onLoadStart: new Q.Event(),
	onLoadEnd: new Q.Event(),
	beforeUnloadUrl: new Q.Event(Q.loadUrl.saveScroll, 'Q'),
	onLoad: new Q.Event(),
	onActivate: new Q.Event(),
	slotNames: [],
	dontRestoreScrollPosition: {},
	slotContainer: function (slotName) {
		return document.getElementById(slotName+"_slot");
	},
	handler: Q.loadUrl.fillSlots,
	key: 'Q'
};

Q.request.options = {
	duplicate: true,
	quiet: true,
	asJSON: false,
	parse: 'json',
	timeout: 5000,
	onRedirect: new Q.Event(function (url) {
		if (!url.startsWith(Q.baseUrl())) {
			location.href = url; // just redirect to another site
		} else {
			Q.loadUrl(url, {
				target: '_self',
				quiet: true,
				dontTransformUrl: true
			});
		}
	}, "Q"),
	resultFunction: "result",
	beforeRequest: [],
	onLoadStart: new Q.Event(),
	onShowCancel: new Q.Event(),
	onLoadEnd: new Q.Event(),
	onResponse: new Q.Event(),
	onProcessed: new Q.Event(),
	onCancel: new Q.Event(function (error) {
		var msg = Q.firstErrorMessage(error);
		if (msg) {
			console.warn(msg);
		}
	}, 'Q')
};

Q.beforeInit.addOnce(function () {
	if (!Q.baseUrl()) {
		throw new Q.Error("Please set Q.info.baseUrl before calling Q.init()");
	}
	if (_appId) {
		Q.info.appId = _appId;
		Q.cookie('Q_appId', _appId);
	}
	if (_udid) {
		Q.info.udid = _udid;
		Q.cookie('Q_udid', _udid);
	}
	if (Q.getObject('Q.info.cookies.indexOf') && Q.info.cookies.indexOf('Q_dpr')) {
		Q.cookie('Q_dpr', window.devicePixelRatio);
	}
	var e;
	var slotNames = ['dashboard', 'notices'];
	for (var i=0; i<slotNames.length; ++i) {
		var sn = slotNames[i];
		if (Q.ignoreBackwardCompatibility === true
		|| !Q.ignoreBackwardCompatibility[sn]) {
			if (e = document.getElementById(sn+'_slot')) {
				var r = e.getBoundingClientRect();
				if (r.top < window.innerHeight / 10) {
					e.removeClass('Q_fixed_bottom').addClass('Q_fixed_top');
				} else if (r.bottom > window.innerHeight * 9 / 10) {
					e.removeClass('Q_fixed_top').addClass('Q_fixed_bottom');
				}
			}
		}
	}

	if (Q.info.languages && Q.info.languages.length) {
		var found = false;
		Q.each(Q.info.languages, function (i, entry) {
			if (entry[0] === language) {
				found = true;
			}
		});
		if (!found) {
			Q.Text.setLanguage(Q.info.languages[0][0], Q.info.languages[0][1]);
		}
	}

	if (Q.info.text) {
		Q.Text.loadBeforeInit = Q.info.text.loadBeforeInit || Q.Text.loadBeforeInit;
		Q.Text.useLocale = Q.info.text.useLocale || Q.Text.useLocale;
	}

	Q.ensure('Promise');
}, 'Q');

/**
 * @module Q
 */
if (typeof root.module !== 'undefined' && root.module.exports) {
	// Assume we are in a Node.js environment, e.g. running tests
	root.module.exports = Q;
} else if (!dontSetGlobals) {
	// We are in a browser environment
	/**
	 * This method restores the old window.Q and returns an instance of itself.
     * @method noConflict
	 * @param {boolean} extend
	 *  If true, extends the old Q with methods and properties from the Q Platform.
	 *  Otherwise, the old Q is untouched.
	 * @return {Function}
	 *  Returns the Q instance on which this method was called
	 */
	Q.noConflict = function (extend) {
		if (extend) {
			Q.extend(oldQ, Q);
		}
		root.Q = oldQ;
		return Q;
	};
	var oldQ = root.Q;
	root.Q = Q;
}

Q.globalNames = Object.keys(root); // to find stray globals

/**
 * This function is useful to make sure your code is not polluting the global namespace
 * @method globalNamesAdded
 * @static
 */
Q.globalNamesAdded = function () {
    var result = [];
    for (var k in root) {
        if (root.hasOwnProperty(k)) {
            if (Q.globalNames.indexOf(k) < 0) {
                result.push(k);
            }
        }
    }
	return result;
};

/**
 * This function is useful for debugging, e.g. calling it in breakpoint conditions
 * But you can also use console.trace()
 * @method stackTrace
 * @static
 */
Q.stackTrace = function() {
	var obj = {};
	if (Error.captureStackTrace) {
		Error.captureStackTrace(obj, Q.stackTrace);
	} else {
		obj = new Error();
	}
	return obj.stack.replace('Error', 'Stack Trace');
};

var _udid = location.search.queryField('Q.udid');
var _appId = location.search.queryField('Q.appId');

document.addEventListener("DOMContentLoaded", function () {
    // After all synchronous scripts have loaded
    Q.init();
});

// [
//     Object,
//     Object.prototype,
//     Function,
//     Function.prototype,
//     Array,
//     Array.prototype,
//     String,
//     String.prototype,
//     Number,
//     Number.prototype,
//     Boolean,
//     Boolean.prototype,
// ].forEach(Object.freeze);

return Q;

}).call(window || this);