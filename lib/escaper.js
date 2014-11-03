/*!
 * Escaper
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 */

var Escaper = {
	VERSION: [1, 4, 12],
	isLocal: false
};

(() => {
	var isNode = false;

	try {
		isNode = 'object' === typeof process && Object.prototype.toString.call(process) === '[object process]';

	} catch (ignore) {

	}

	/* istanbul ignore next */
	if (isNode) {
		Escaper.isLocal = Boolean(global.EscaperIsLocal || global['EscaperIsLocal']);

		if (!Escaper.isLocal) {
			module.exports = exports = Escaper;
		}
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

	for (let key in escapeMap) {
		/* istanbul ignore if */
		if (!escapeMap.hasOwnProperty(key)) {
			continue;
		}

		keyArr.push(key);
		finalMap[key] = true;
	}

	for (let key in sCommentsMap) {
		/* istanbul ignore if */
		if (!sCommentsMap.hasOwnProperty(key)) {
			continue;
		}

		keyArr.push(key);
		finalMap[key] = true;
	}

	for (let key in mCommentsMap) {
		/* istanbul ignore if */
		if (!mCommentsMap.hasOwnProperty(key)) {
			continue;
		}

		keyArr.push(key);
		finalMap[key] = true;
	}

	var rgxpFlagsMap = {
		'g': true,
		'm': true,
		'i': true,
		'y': true,
		'u': true
	};

	var rgxpFlags = [];
	for (let key in rgxpFlagsMap) {
		/* istanbul ignore if */
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
		for (let key in obj) {
			/* istanbul ignore if */
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
		wRgxp = /[a-z]/,
		sRgxp = /\s/,
		nRgxp = /\r|\n/;

	var symbols,
		filterRgxp;

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
		symbols = symbols || Escaper.symbols || Escaper['symbols'] || 'a-z';
		filterRgxp = filterRgxp || new RegExp(`[!$${symbols}_]`);

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
		for (let i = -1; ++i < keyArr.length;) {
			let el = keyArr[i];

			if (mCommentsMap[el] || sCommentsMap[el]) {
				p[el] = withComments || p[el];

			} else {
				p[el] = p[el] || !isObj;
			}

			cacheKey += `${p[el]},`;
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

		for (let i = -1; ++i < str.length;) {
			let el = str.charAt(i),
				next = str.charAt(i + 1);

			let word = str.substr(i, 2),
				extWord = str.substr(i, 3);

			if (!comment) {
				if (!begin) {
					if (el === '/') {
						if (sCommentsMap[word] || mCommentsMap[word]) {
							if (sCommentsMap[extWord] || mCommentsMap[extWord]) {
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

					let skip = false;
					if (opt_snakeskin) {
						if (el === '|' && filterRgxp.test(next)) {
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

				// Блоки [] внутри регулярного выражения
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

				if (finalMap[el] && (el === '/' ? end : true) && !begin) {
					begin = el;
					selectionStart = i;

				} else if (begin && (el === '\\' || escape)) {
					escape = !escape;

				} else if (finalMap[el] && begin === el && !escape && (begin === '/' ? !block : true)) {
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
							label = `__ESCAPER_QUOT__${stack.length}_`;
							stack.push(cut);
						}

						str = str.substring(0, selectionStart) + label + str.substring(i + 1);
						i += label.length - cut.length;
					}
				}

			} else if ((nRgxp.test(next) && sCommentsMap[comment]) ||
				(mCommentsMap[el + str.charAt(i - 1)] && i - selectionStart > 2 && mCommentsMap[comment])

			) {
				if (p[comment]) {
					cut = str.substring(selectionStart, i + 1);

					if (p[comment] === -1) {
						label = '';

					} else {
						label = `__ESCAPER_QUOT__${stack.length}_`;
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

	/**
	 * Заметить __ESCAPER_QUOT__номер_ в указанной строке на реальное содержимое
	 *
	 * @param {string} str - исходная строка
	 * @param {Array=} [opt_quotContent=Escaper.quotContent] - стек содержимого
	 * @return {string}
	 */
	Escaper.paste = function (str, opt_quotContent) {
		var stack = opt_quotContent || content;
		return str.replace(/__ESCAPER_QUOT__(\d+)_/gm, (sstr, pos) => stack[pos]);
	};
})();
