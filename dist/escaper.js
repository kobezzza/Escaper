/*!
 * Escaper v2.4.4
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 *
 * Date: Sat, 13 Jun 2015 08:52:20 GMT
 */

(function (global, factory) {
	if (typeof define === 'function' && define.amd) {
		define('Escaper', ['exports', 'module'], factory);
	} else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
		factory(exports, module);
	} else {
		var mod = {
			exports: {}
		};
		factory(mod.exports, mod);
		global.Escaper = mod.exports;
	}
})(this, function (exports, module) {
	'use strict';

	var Escaper = { VERSION: [2, 4, 4] };
	module.exports = Escaper;

	var stringLiterals = {
		'"': true,
		'\'': true,
		'`': true
	},
	    literals = {
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
	},
	    multComments = {
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

	var cache = {},
	    content = [];

	/**
  * @param {!Object} obj
  * @param {!Object} p
  * @param {(boolean|number)} val
  */
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

	/** @type {!Array} */
	Escaper.quotContent = content;

	var uSRgxp = /[^\s\/]/,
	    wRgxp = /[a-z]/,
	    sRgxp = /\s/,
	    nRgxp = /\r|\n/;

	var symbols = undefined,
	    snakeskinRgxp = undefined;

	Escaper.symbols = null;
	Escaper.snakeskinRgxp = null;

	var objMap = {
		'object': true,
		'function': true
	};

	/**
  * Replaces all found blocks ' ... ', " ... ", ` ... `, / ... /, // ..., /* ... *\/ to
  * __ESCAPER_QUOT__number_ in a string and returns a new string
  *
  * @param {string} str - the source string
  * @param {(Object.<string, boolean>|boolean)=} [opt_withCommentsOrParams=false] - parameters:
  *
  *     (if a parameter value is set to -1, then all found matches will be removed from the final string,
  *          or if the value will be set to true/false they will be included/excluded)
  *
  *     *) @label    - template for replacement, e.g. __ESCAPER_QUOT__${pos}_
  *     *) @all      - replaces all found matches
  *     *) @comments - replaces all kinds of comments
  *     *) @strings  - replaces all kinds of string literals
  *     *) @literals - replaces all kinds of string literals and regular expressions
  *     *) `
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
  *     OR if the value is boolean, then will be replaced all found comments (true) / literals (false)
  *
  * @param {Array=} [opt_quotContent=Escaper.quotContent] - an array for matches
  * @param {?boolean=} [opt_snakeskin] - a private parameter for using with Snakeskin
  * @return {string}
  */
	Escaper.replace = function (str, opt_withCommentsOrParams, opt_quotContent, opt_snakeskin) {
		symbols = symbols || Escaper.symbols || 'a-z';

		snakeskinRgxp = snakeskinRgxp || Escaper.snakeskinRgxp || new RegExp('[!$' + symbols + '_]', 'i');

		var isObj = Boolean(opt_withCommentsOrParams && objMap[typeof opt_withCommentsOrParams]),
		    p = isObj ? Object(opt_withCommentsOrParams) : {};

		var posRgxp = /\$\{pos}/g;
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

			cacheKey += '' + p[el] + ',';
		}

		var initStr = str,
		    stack = opt_quotContent || content;

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

		var cut = undefined,
		    label = undefined;

		var part = '',
		    rPart = '';

		for (var i = -1; ++i < str.length;) {
			var el = str.charAt(i),
			    next = str.charAt(i + 1);

			var word = str.substr(i, 2),
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
	};

	var pasteRgxp = /__ESCAPER_QUOT__(\d+)_/g;

	/**
  * Replaces all found blocks __ESCAPER_QUOT__number_ to real content in a string
  * and returns a new string
  *
  * @param {string} str - the source string
  * @param {Array=} [opt_quotContent=Escaper.quotContent] - an array of matches
  * @param {RegExp=} [opt_rgxp] - RegExp for searching, e.g. /__ESCAPER_QUOT__(\d+)_/g
  * @return {string}
  */
	Escaper.paste = function (str, opt_quotContent, opt_rgxp) {
		return str.replace(opt_rgxp || pasteRgxp, function (sstr, pos) {
			return (opt_quotContent || content)[pos];
		});
	};
});