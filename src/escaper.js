'use strict';

/*!
 * Escaper
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 */

let Escaper;
export default Escaper = {
	VERSION: [3, 0, 0],
	content: [],
	cache: Object.create(null),
	symbols: /[!$a-z_]/i,
	replace,
	paste
};

const singleComments = [
	'//',
	'//*',
	'//!',
	'//#',
	'//@',
	'//$'
];

const multComments = [
	'/*',
	'/**',
	'/*!',
	'/*#',
	'/*@',
	'/*$'
];

const
	strings = ['"', '\'', '`'],
	literals = ['/'];

const all = [
	...singleComments,
	...multComments,
	...strings,
	...literals
];

const
	singleCommentsMap = createMap(singleComments),
	multCommentsMap = createMap(multComments),
	allMap = createMap(all);

const defMap = {
	'true': true,
	'null': true,
	'undefined': true,
	'-1': true
};

const
	rgxpFlagsMap = Object.assign(Object.create(null), {'g': true, 'm': true, 'i': true, 'y': true, 'u': true}),
	rgxpFlags = Object.keys(rgxpFlagsMap);

const endSymbols = Object.assign(Object.create(null), {
	'-': true,
	'+': true,
	'*': true,
	'%': true,
	'~': true,
	'>': true,
	'<': true,
	'^': true,
	',': true,
	';': true,
	'=': true,
	'|': true,
	'&': true,
	'!': true,
	'?': true,
	':': true,
	'(': true,
	'{': true,
	'[': true
});

const endWords = Object.assign(Object.create(null), {
	'return': true,
	'yield': true,
	'await': true,
	'typeof': true,
	'void': true,
	'instanceof': true,
	'delete': true,
	'in': true,
	'new': true,
	'of': true
});

const
	notSpaceRgxp = /[^\s/]/,
	wordRgxp = /[a-z]/,
	spaceRgxp = /\s/,
	nextLineRgxp = /[\r\n]/,
	posRgxp = /\${pos}/g;

/**
 * @param {!Array} arr
 * @return {!Object}
 */
function createMap(arr) {
	const
		map = Object.create(null);

	for (let i = 0; i < arr.length; i++) {
		map[arr[i]] = true;
	}

	return map;
}

/** @return {{get: !Function, set: !Function}} */
function createCache() {
	if (typeof Map === 'function') {
		return new Map();
	}

	const
		cache = Object.create(null);

	return {
		get(key) {
			return cache[key];
		},

		set(key, value) {
			cache[key] = value;
			return this;
		}
	};
}

const restrictedKeys = Object.assign(Object.create(null), {
	'label': true,
	'filters': true,
	'singleComments': true,
	'multComment': true,
	'comments': true,
	'strings': true,
	'literals': true
});

/**
 * @param {(!Object|!Array)} from
 * @param {!Object} to
 * @param {?=} [value]
 * @return {boolean}
 */
function mix(from, to, value) {
	if (!from || typeof from !== 'object') {
		return false;
	}

	const
		isArr = Array.isArray(from),
		customValue = arguments.length > 2,
		keys = isArr ? from : Object.keys(from);

	for (let i = 0; i < keys.length; i++) {
		const
			key = keys[i];

		if (restrictedKeys[key]) {
			continue;
		}

		if (key in to === false) {
			const v = customValue ? value : isArr ? true : from[key];
			to[key] = v != null ? v : true;
		}
	}

	return true;
}

/**
 * @param {!Object} params
 * @param {number} pos
 * @return {string}
 */
function mark(params, pos) {
	const
		label = params['label'];

	if (label) {
		return label.replace(posRgxp, pos);
	}

	return `__ESCAPER_QUOT__${pos}_`;
}

/**
 * Replaces all found blocks ' ... ', " ... ", ` ... `, / ... /, // ..., /* ... *\/ to
 * escape blocks in a string and returns a new string
 *
 * @param {string} str - source string
 * @param {(Object<string, (Array|Object|boolean|number)>|Array|number)=} [how=true] - parameters:
 *
 *     (if a parameter value is set to -1, then all found matches will be removed from the final string,
 *      or if the value will be set to false they will be excluded)
 *
 *     *) label          - template for replacement, e.g. __ESCAPER_QUOT__${pos}_
 *     *) singleComments - replaces all kinds of single comments
 *     *) multComments   - replaces all kinds of multiline comments
 *     *) comments       - replaces all kinds of comments
 *     *) strings        - replaces all kinds of string literals
 *     *) literals       - replaces all kinds of literals (except string literals)
 *
 *     *)`
 *     *) '
 *     *) "
 *     *) /
 *     *) //
 *     *) //*
 *     *) //!
 *     *) //#
 *     *) //@
 *     *) //$
 *     *) /*
 *     *) /**
 *     *) /*!
 *     *) /*#
 *     *) /*@
 *     *) /*$
 *
 * @param {Array=} [content=Escaper.content] - array for matches
 * @return {string}
 *
 * @example
 * // Replaces all found matches
 * Escaper.replace('Hello "world" and \'friends\'')
 *
 * // Replaces only single quotes
 * Escaper.replace('Hello "world" and \'friends\'', ["'"])
 *
 * // Cuts all
 * Escaper.replace('Hello "world" and \'friends\'', -1)
 *
 * // Replaces all and cuts single quotes
 * Escaper.replace('Hello "world" and \'friends\'', {"'": -1})
 *
 * // Replaces all but strings
 * Escaper.replace('Hello "world" and \'friends\'', {strings: false})
 *
 * // Replaces all, but strings can be only single quotes
 * Escaper.replace('Hello "world" and \'friends\'', {strings: ["'"]})
 *
 * // Replaces all, but strings can be only single quotes and it will be cut
 * Escaper.replace('Hello "world" and \'friends\'', {strings: {"'": -1}})
 */
export function replace(str, how, content) {
	const
		p = Object.create(null),
		{cache, content: staticContent} = Escaper;

	if (Array.isArray(how)) {
		if (how.length || Array.isArray(content)) {
			mix(how, p);

		} else {
			content = content || how;
			mix(all, p, true);
		}

	} else if (how && typeof how === 'object') {
		mix(how, p);

		if (how['filters']) {
			p.filters = true;
		}

		p.label = how['label'];

		const
			singleCommentsOpt = how['singleComments'],
			multCommentsOpt = how['multComments'],
			commentsOpt = how['comments'];

		let
			skipComments = false;

		if (singleCommentsOpt !== false) {
			if (defMap[singleCommentsOpt]) {
				mix(singleComments, p, singleCommentsOpt);
				skipComments = singleCommentsOpt != null;

			} else if (mix(singleCommentsOpt, p)) {
				skipComments = true;
			}
		}

		if (multCommentsOpt !== false) {
			if (defMap[multCommentsOpt]) {
				mix(singleComments, p, multCommentsOpt);
				skipComments = skipComments || multCommentsOpt != null;

			} else if (mix(multCommentsOpt, p)) {
				skipComments = true;
			}
		}

		if (!skipComments && commentsOpt !== false) {
			if (defMap[commentsOpt]) {
				mix(multComments, p, commentsOpt);
				mix(singleComments, p, commentsOpt);

			} else {
				mix(commentsOpt, p);
			}
		}

		const
			stringsOpt = how['strings'],
			literalsOpt = how['literals'];

		if (stringsOpt !== false) {
			if (defMap[stringsOpt]) {
				mix(strings, p, stringsOpt);

			} else {
				mix(stringsOpt, p);
			}
		}

		if (literalsOpt !== false) {
			if (defMap[literalsOpt]) {
				mix(literals, p, literalsOpt);

			} else {
				mix(literalsOpt, p);
			}
		}

	} else {
		mix(all, p, how === -1 ? -1 : true);
	}

	content = content || staticContent;

	const
		cacheStr = str,
		canCache = content === staticContent,
		cacheKey = canCache && Object.keys(p).join(),
		cacheVal = canCache && cacheKey in cache && cache[cacheKey].get(cacheStr);

	if (cacheVal) {
		return cacheVal;
	}

	const
		symbols = Escaper.symbols;

	let
		/** @type {(boolean|string)} */ begin = false,
		end = true;

	let
		escape = false,
		comment = false;

	let
		selectionStart = 0,
		block = false;

	let
		templateVar = 0,
		filterStart = false;

	let
		cut,
		label;

	let
		part = '',
		rPart = '';

	for (let i = -1; ++i < str.length;) {
		let
			el = str.charAt(i);

		const
			next = str.charAt(i + 1),
			word = str.substr(i, 2),
			extWord = str.substr(i, 3);

		if (!comment) {
			if (!begin) {
				if (el === '/') {
					if (singleCommentsMap[word] || multCommentsMap[word]) {
						if (singleCommentsMap[extWord] || multCommentsMap[extWord]) {
							comment = extWord;

						} else {
							comment = word;
						}
					}

					if (comment) {
						selectionStart = i;
						continue;
					}
				}

				if (endSymbols[el] || endWords[rPart]) {
					end = true;
					rPart = '';

				} else if (notSpaceRgxp.test(el)) {
					end = false;
				}

				if (wordRgxp.test(el)) {
					part += el;

				} else {
					rPart = part;
					part = '';
				}

				let
					skip = false;

				if (p.filters) {
					if (el === '|' && symbols.test(next)) {
						filterStart = true;
						end = false;
						skip = true;

					} else if (filterStart && spaceRgxp.test(el)) {
						filterStart = false;
						end = true;
						skip = true;
					}
				}

				if (!skip) {
					if (endSymbols[el]) {
						end = true;

					} else if (notSpaceRgxp.test(el)) {
						end = false;
					}
				}
			}

			// [] inside RegExp
			if (begin === '/' && !escape) {
				if (el === '[') {
					block = true;

				} else if (el === ']') {
					block = false;
				}
			}

			if (!begin && templateVar) {
				if (el === '}') {
					templateVar--;

				} else if (el === '{') {
					templateVar++;
				}

				if (!templateVar) {
					el = '`';
				}
			}

			if (begin === '`' && !escape && word === '${') {
				el = '`';
				i++;
				templateVar++;
			}

			if (allMap[el] && (el !== '/' || end) && !begin) {
				begin = el;
				selectionStart = i;

			} else if (begin && (el === '\\' || escape)) {
				escape = !escape;

			} else if (allMap[el] && begin === el && !escape && (begin !== '/' || !block)) {
				if (el === '/') {
					for (let j = -1; ++j < rgxpFlags.length;) {
						if (rgxpFlagsMap[str.charAt(i + 1)]) {
							i++;
						}
					}
				}

				begin = false;
				end = false;

				if (p[el]) {
					cut = str.substring(selectionStart, i + 1);

					if (p[el] === -1) {
						label = '';

					} else {
						label = mark(p, content.length);
						content.push(cut);
					}

					str = str.substring(0, selectionStart) + label + str.substring(i + 1);
					i += label.length - cut.length;
				}
			}

		} else if (((i === str.length - 1 || nextLineRgxp.test(next)) && singleCommentsMap[comment]) ||
			(multCommentsMap[el + str.charAt(i - 1)] && i - selectionStart > 2 && multCommentsMap[comment])

		) {
			if (p[comment]) {
				cut = str.substring(selectionStart, i + 1);

				if (p[comment] === -1) {
					label = '';

				} else {
					label = mark(p, content.length);
					content.push(cut);
				}

				str = str.substring(0, selectionStart) + label + str.substring(i + 1);
				i += label.length - cut.length;
			}

			comment = false;
		}
	}

	if (canCache) {
		const c = cache[cacheKey] = cache[cacheKey] || createCache();
		c.set(cacheStr, str);
	}

	return str;
}

const
	pasteRgxp = /__ESCAPER_QUOT__(\d+)_/g;

/**
 * Replaces all found escape blocks to a real content in a string
 * and returns a new string
 *
 * @param {string} str - source string
 * @param {Array=} [content=Escaper.content] - array of matches
 * @param {RegExp=} [rgxp] - RegExp for searching, e.g. /__ESCAPER_QUOT__(\d+)_/g
 * @return {string}
 */
export function paste(str, content, rgxp) {
	return str.replace(rgxp || pasteRgxp, (str, pos) => (content || Escaper.content)[pos]);
}
