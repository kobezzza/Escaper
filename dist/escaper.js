/*!
 * Escaper v2.4.14
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 *
 * Date: Mon, 07 Dec 2015 11:44:59 GMT
 */

'use strict';

/*istanbul ignore next*/
(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define('Escaper', ['exports'], factory);
	} else if (typeof exports !== "undefined") {
		factory(exports);
	} else {
		var mod = {
			exports: {}
		};
		factory(mod.exports);
		global.Escaper = mod.exports;
	}
})(this, function (exports) {
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.replace = replace;
	exports.paste = paste;

	function _typeof(obj) {
		return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
	}

	var Escaper = {
		VERSION: [2, 4, 14],
		content: [],
		cache: {},
		snakeskinRgxp: null,
		symbols: null,
		replace: replace,
		paste: paste
	};
	exports.default = Escaper;
	var stringLiterals = {
		'"': true,
		'\'': true,
		'`': true
	};
	var literals = {
		'/': true
	};

	for (var key in stringLiterals) {
		if (!stringLiterals.hasOwnProperty(key)) {
			continue;
		}

		literals[key] = true;
	}

	var singleComments = {
		'//': true,
		'//*': true,
		'//!': true,
		'//#': true,
		'//@': true,
		'//$': true
	};
	var multComments = {
		'/*': true,
		'/**': true,
		'/*!': true,
		'/*#': true,
		'/*@': true,
		'/*$': true
	};
	var keyArr = [],
	    finalMap = {};

	for (var key in literals) {
		if (!literals.hasOwnProperty(key)) {
			continue;
		}

		keyArr.push(key);
		finalMap[key] = true;
	}

	for (var key in singleComments) {
		if (!singleComments.hasOwnProperty(key)) {
			continue;
		}

		keyArr.push(key);
		finalMap[key] = true;
	}

	for (var key in multComments) {
		if (!multComments.hasOwnProperty(key)) {
			continue;
		}

		keyArr.push(key);
		finalMap[key] = true;
	}

	var rgxpFlags = [],
	    rgxpFlagsMap = {
		'g': true,
		'm': true,
		'i': true,
		'y': true,
		'u': true
	};

	for (var key in rgxpFlagsMap) {
		if (!rgxpFlagsMap.hasOwnProperty(key)) {
			continue;
		}

		rgxpFlags.push(key);
	}

	var escapeEndMap = {
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
	};
	var escapeEndWordMap = {
		'typeof': true,
		'void': true,
		'instanceof': true,
		'delete': true,
		'in': true,
		'new': true,
		'of': true
	};

	function mix(obj, p, val) {
		for (var key in obj) {
			if (!obj.hasOwnProperty(key)) {
				continue;
			}

			if (key in p === false) {
				p[key] = val;
			}
		}
	}

	var symbols = void 0,
	    snakeskinRgxp = void 0;
	var uSRgxp = /[^\s\/]/,
	    wRgxp = /[a-z]/,
	    sRgxp = /\s/,
	    nRgxp = /\r|\n/,
	    posRgxp = /\$\{pos}/g;
	var objMap = {
		'object': true,
		'function': true
	};

	function replace(str, opt_withCommentsOrParams, opt_content, opt_snakeskin) {
		symbols = symbols || Escaper.symbols || 'a-z';
		snakeskinRgxp = snakeskinRgxp || Escaper.snakeskinRgxp || new RegExp('[!$' + symbols + '_]', 'i');
		var cache = Escaper.cache;
		var content = Escaper.content;
		var isObj = Boolean(opt_withCommentsOrParams && objMap[typeof opt_withCommentsOrParams === 'undefined' ? 'undefined' : _typeof(opt_withCommentsOrParams)]);
		var p = isObj ? Object(opt_withCommentsOrParams) : {};

		function mark(pos) {
			if (p['@label']) {
				return p['@label'].replace(posRgxp, pos);
			}

			return '__ESCAPER_QUOT__' + pos + '_';
		}

		var withComments = false;

		if (typeof opt_withCommentsOrParams === 'boolean') {
			withComments = Boolean(opt_withCommentsOrParams);
		}

		if ('@comments' in p) {
			mix(multComments, p, p['@comments']);
			mix(singleComments, p, p['@comments']);
			delete p['@comments'];
		}

		if ('@strings' in p) {
			mix(stringLiterals, p, p['@strings']);
			delete p['@strings'];
		}

		if ('@literals' in p) {
			mix(literals, p, p['@literals']);
			delete p['@literals'];
		}

		if ('@all' in p) {
			mix(finalMap, p, p['@all']);
			delete p['@all'];
		}

		var cacheKey = '';

		for (var i = -1; ++i < keyArr.length;) {
			var el = keyArr[i];

			if (multComments[el] || singleComments[el]) {
				p[el] = withComments || p[el];
			} else {
				p[el] = p[el] || !isObj;
			}

			cacheKey += p[el] + ',';
		}

		var initStr = str,
		    stack = opt_content || content;

		if (stack === content && cache[cacheKey] && cache[cacheKey][initStr]) {
			return cache[cacheKey][initStr];
		}

		var begin = false,
		    end = true;
		var escape = false,
		    comment = false;
		var selectionStart = 0,
		    block = false;
		var templateVar = 0,
		    filterStart = false;
		var cut = void 0,
		    label = void 0;
		var part = '',
		    rPart = '';

		for (var i = -1; ++i < str.length;) {
			var el = str.charAt(i);
			var next = str.charAt(i + 1),
			    word = str.substr(i, 2),
			    extWord = str.substr(i, 3);

			if (!comment) {
				if (!begin) {
					if (el === '/') {
						if (singleComments[word] || multComments[word]) {
							if (singleComments[extWord] || multComments[extWord]) {
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

					if (escapeEndMap[el] || escapeEndWordMap[rPart]) {
						end = true;
						rPart = '';
					} else if (uSRgxp.test(el)) {
						end = false;
					}

					if (wRgxp.test(el)) {
						part += el;
					} else {
						rPart = part;
						part = '';
					}

					var skip = false;

					if (opt_snakeskin) {
						if (el === '|' && snakeskinRgxp.test(next)) {
							filterStart = true;
							end = false;
							skip = true;
						} else if (filterStart && sRgxp.test(el)) {
							filterStart = false;
							end = true;
							skip = true;
						}
					}

					if (!skip) {
						if (escapeEndMap[el]) {
							end = true;
						} else if (uSRgxp.test(el)) {
							end = false;
						}
					}
				}

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

				if (finalMap[el] && (el !== '/' || end) && !begin) {
					begin = el;
					selectionStart = i;
				} else if (begin && (el === '\\' || escape)) {
					escape = !escape;
				} else if (finalMap[el] && begin === el && !escape && (begin !== '/' || !block)) {
					if (el === '/') {
						for (var j = -1; ++j < rgxpFlags.length;) {
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
							label = mark(stack.length);
							stack.push(cut);
						}

						str = str.substring(0, selectionStart) + label + str.substring(i + 1);
						i += label.length - cut.length;
					}
				}
			} else if (nRgxp.test(next) && singleComments[comment] || multComments[el + str.charAt(i - 1)] && i - selectionStart > 2 && multComments[comment]) {
				if (p[comment]) {
					cut = str.substring(selectionStart, i + 1);

					if (p[comment] === -1) {
						label = '';
					} else {
						label = mark(stack.length);
						stack.push(cut);
					}

					str = str.substring(0, selectionStart) + label + str.substring(i + 1);
					i += label.length - cut.length;
				}

				comment = false;
			}
		}

		if (stack === content) {
			cache[cacheKey] = cache[cacheKey] || {};
			cache[cacheKey][initStr] = str;
		}

		return str;
	}

	var pasteRgxp = /__ESCAPER_QUOT__(\d+)_/g;

	function paste(str, opt_content, opt_rgxp) {
		return str.replace(opt_rgxp || pasteRgxp, function (sstr, pos) {
			return (opt_content || Escaper.content)[pos];
		});
	}
});