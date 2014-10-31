/*!
 * Escaper
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 */

var Escaper = {
	VERSION: [1, 4, 6],
	isLocal: false
};

(function()  {
	var isNode = false;

	try {
		isNode = 'object' === typeof process && Object.prototype.toString.call(process) === '[object process]';

	} catch (ignore) {

	}

	if (isNode) {
		module.exports = exports = Escaper;
		Escaper.isLocal = Boolean(global.EscaperIsLocal || global['EscaperIsLocal']);
	}

	var escapeMap = {
		'"': true,
		"'" : true,
		'/': true,
		'`': true
	};

	var sCommentsMap = {
		'//': true
	};

	var mCommentsMap = {
		'/*': true,
		'/**': true,
		'/*!': true
	};

	var keyArr = [],
		finalMap = {};

	for (var key in escapeMap) {
		if (!escapeMap.hasOwnProperty(key)) {
			continue;
		}

		keyArr.push(key);
		finalMap[key] = true;
	}

	for (var key$0 in sCommentsMap) {
		if (!sCommentsMap.hasOwnProperty(key$0)) {
			continue;
		}

		keyArr.push(key$0);
		finalMap[key$0] = true;
	}

	for (var key$1 in mCommentsMap) {
		if (!mCommentsMap.hasOwnProperty(key$1)) {
			continue;
		}

		keyArr.push(key$1);
		finalMap[key$1] = true;
	}

	var rgxpFlagsMap = {
		'g': true,
		'm': true,
		'i': true,
		'y': true,
		'u': true
	};

	var rgxpFlags = [];
	for (var key$2 in rgxpFlagsMap) {
		if (!rgxpFlagsMap.hasOwnProperty(key$2)) {
			continue;
		}

		rgxpFlags.push(key$2);
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
		'instaceof': true,
		'delete': true,
		'in': true,
		'new': true
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

	/**
	 * Стек содержимого
	 * @type {!Array}
	 */
	Escaper.quotContent = content;

	var uSRgxp = /[^\s\/]/,
		wRgxp = /[a-z]/i,
		sRgxp = /\s/,
		nRgxp = /\r|\n/;

	/**
	 * Заметить блоки вида ' ... ', " ... ", ` ... `, / ... /, // ..., /* ... *\/ на
	 * __ESCAPER_QUOT__номер_ в указанной строке
	 *
	 * @param {string} str - исходная строка
	 * @param {(Object|boolean)=} [opt_withCommentsOrParams=false] - таблица вырезаемых последовательностей:
	 *
	 *     (если установить значение параметру -1, то он будет полностью вырезаться,
	 *     т.е. без возможности обратной замены, иначе true/false - включить/исключить последовательность)
	 *
	 *     *) @all - специальная команда для выделения всех последовательностей
	 *     *) @comments - специальная команда для выделения всех видов комментариев
	 *     *) @literals - специальная команда для выделения литералов строк и регулярных выражений
	 *     *) `
	 *     *) '
	 *     *) "
	 *     *) /
	 *     *) //
	 *     *) /*
	 *     *) /**
	 *     *) /*!
	 *
	 *     ИЛИ если логическое значение, то вырезаются литералы с комментариями (true) / литералы (false)
	 *
	 * @param {Array=} [opt_quotContent=Escaper.quotContent] - стек содержимого
	 * @param {?boolean=} [opt_snakeskin] - если true, то при экранировании учитываются конструкции Snakeskin
	 * @return {string}
	 */
	Escaper.replace = function (str, opt_withCommentsOrParams, opt_quotContent, opt_snakeskin) {
		var isObj = opt_withCommentsOrParams instanceof Object;
		var p = isObj ?
			Object(opt_withCommentsOrParams) : {};

		var withComments = false;
		if (typeof opt_withCommentsOrParams === 'boolean') {
			withComments = Boolean(opt_withCommentsOrParams);
		}

		if ('@comments' in p) {
			mix(mCommentsMap, p, p['@comments']);
			mix(sCommentsMap, p, p['@comments']);
			delete p['@comments'];
		}

		if ('@literals' in p) {
			mix(escapeMap, p, p['@literals']);
			delete p['@literals'];
		}

		if ('@all' in p) {
			mix(finalMap, p, p['@all']);
			delete p['@all'];
		}

		var cacheKey = '';
		for (var i = -1; ++i < keyArr.length;) {
			var el = keyArr[i];

			if (mCommentsMap[el] || sCommentsMap[el]) {
				p[el] = withComments || p[el];

			} else {
				p[el] = p[el] || !isObj;
			}

			cacheKey += (("" + (p[el])) + ",");
		}

		var initStr = str;
		var stack = opt_quotContent ||
			content;

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

		var cut,
			label;

		var part = '',
			rPart = '';

		for (var i$0 = -1; ++i$0 < str.length;) {
			var el$0 = str.charAt(i$0),
				next = str.charAt(i$0 + 1);

			var word = str.substr(i$0, 2),
				extWord = str.substr(i$0, 3);

			if (!comment) {
				if (!begin) {
					if (el$0 === '/') {
						if (sCommentsMap[word] || mCommentsMap[word]) {
							if (sCommentsMap[extWord] || mCommentsMap[extWord]) {
								comment = extWord;

							} else {
								comment = word;
							}
						}

						if (comment) {
							selectionStart = i$0;
							continue;
						}
					}

					if (escapeEndMap[el$0] || escapeEndWordMap[rPart]) {
						end = true;
						rPart = '';

					} else if (uSRgxp.test(el$0)) {
						end = false;
					}

					if (wRgxp.test(el$0)) {
						part += el$0;

					} else {
						rPart = part;
						part = '';
					}

					var skip = false;
					if (opt_snakeskin) {
						if (el$0 === '|' && wRgxp.test(next)) {
							filterStart = true;
							end = false;
							skip = true;

						} else if (filterStart && sRgxp.test(el$0)) {
							filterStart = false;
							end = true;
							skip = true;
						}
					}

					if (!skip) {
						if (escapeEndMap[el$0]) {
							end = true;

						} else if (uSRgxp.test(el$0)) {
							end = false;
						}
					}
				}

				// Блоки [] внутри регулярного выражения
				if (begin === '/' && !escape) {
					if (el$0 === '[') {
						block = true;

					} else if (el$0 === ']') {
						block = false;
					}
				}

				if (!begin && templateVar) {
					if (el$0 === '}') {
						templateVar--;

					} else if (el$0 === '{') {
						templateVar++;
					}

					if (!templateVar) {
						el$0 = '`';
					}
				}

				if (begin === '`' && !escape && word === '${') {
					el$0 = '`';
					i$0++;
					templateVar++;
				}

				if (finalMap[el$0] && (el$0 === '/' ? end : true) && !begin) {
					begin = el$0;
					selectionStart = i$0;

				} else if (begin && (el$0 === '\\' || escape)) {
					escape = !escape;

				} else if (finalMap[el$0] && begin === el$0 && !escape && (begin === '/' ? !block : true)) {
					if (el$0 === '/') {
						for (var j = -1; ++j < rgxpFlags.length;) {
							if (rgxpFlagsMap[str.charAt(i$0 + 1)]) {
								i$0++;
							}
						}
					}

					begin = false;
					end = false;

					if (p[el$0]) {
						cut = str.substring(selectionStart, i$0 + 1);

						if (p[el$0] === -1) {
							label = '';

						} else {
							label = (("__ESCAPER_QUOT__" + (stack.length)) + "_");
							stack.push(cut);
						}

						str = str.substring(0, selectionStart) + label + str.substring(i$0 + 1);
						i$0 += label.length - cut.length;
					}
				}

			} else if ((nRgxp.test(next) && sCommentsMap[comment]) ||
				(mCommentsMap[el$0 + str.charAt(i$0 - 1)] && i$0 - selectionStart > 2 && mCommentsMap[comment])

			) {
				if (p[comment]) {
					cut = str.substring(selectionStart, i$0 + 1);

					if (p[comment] === -1) {
						label = '';

					} else {
						label = (("__ESCAPER_QUOT__" + (stack.length)) + "_");
						stack.push(cut);
					}

					str = str.substring(0, selectionStart) + label + str.substring(i$0 + 1);
					i$0 += label.length - cut.length;
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

	/**
	 * Заметить __ESCAPER_QUOT__номер_ в указанной строке на реальное содержимое
	 *
	 * @param {string} str - исходная строка
	 * @param {Array=} [opt_quotContent=Escaper.quotContent] - стек содержимого
	 * @return {string}
	 */
	Escaper.paste = function (str, opt_quotContent) {
		var stack = opt_quotContent || content;
		return str.replace(/__ESCAPER_QUOT__(\d+)_/gm, function(sstr, pos)  {return stack[pos]});
	};
})();
