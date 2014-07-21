/*!
 * Escaper v1.2.0
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 */

var Escaper = {
	VERSION: [1, 2, 0],
	isLocal: typeof window === 'undefined' && typeof global !== 'undefined' ?
		Boolean(global.EscaperIsLocal || global['EscaperIsLocal']) : false
};

if (typeof window === 'undefined' && typeof module !== 'undefined' && !Escaper.isLocal) {
	module.exports = exports = Escaper;
}

(() => {
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

	var keyArr = [];

	for (let key in escapeMap) {
		if (!escapeMap.hasOwnProperty(key)) {
			continue;
		}

		keyArr.push(key);
	}

	for (let key in sCommentsMap) {
		if (!sCommentsMap.hasOwnProperty(key)) {
			continue;
		}

		keyArr.push(key);
	}

	for (let key in mCommentsMap) {
		if (!mCommentsMap.hasOwnProperty(key)) {
			continue;
		}

		keyArr.push(key);
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
		if (!rgxpFlagsMap.hasOwnProperty(key)) {
			continue;
		}

		rgxpFlags.push(key);
	}

	var escapeEndMap = {
		'-': true,
		'+': true,
		'*': true,
		',': true,
		';': true,
		'=': true,
		'|': true,
		'&': true,
		'?': true,
		':': true,
		'(': true,
		'{': true
	};

	var cache = {},
		content = [];

	/**
	 * Стек содержимого
	 * @type {!Array}
	 */
	Escaper.quotContent = content;

	/**
	 * Заметить блоки вида ' ... ', " ... ", ` ... `, / ... /, // ..., /* ... *\/ на
	 * __ESCAPER_QUOT__номер_ в указанной строке
	 *
	 * @param {string} str - исходная строка
	 * @param {(Object|boolean)=} [opt_withCommentsOrParams=false] - таблица вырезаемых последовательностей:
	 *
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

		var cacheKey = '';
		for (let i = -1; ++i < keyArr.length;) {
			let el = keyArr[i];

			if (mCommentsMap[el] || sCommentsMap[el]) {
				p[el] = Boolean(withComments || p[el]);

			} else {
				p[el] = Boolean(p[el] || !isObj);
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

		var uSRgxp = /[^\s\/]/,
			wRgxp = /[a-z]/i,
			sRgxp = /\s/;

		for (let i = -1; ++i < str.length;) {
			let el = str.charAt(i),
				prev = str.charAt(i - 1),
				next = str.charAt(i + 1);

			let word = el + next,
				lWord = word + str.charAt(i + 2);

			if (!comment) {
				if (!begin) {
					if (el === '/') {
						if (sCommentsMap[word] || mCommentsMap[word]) {
							if (sCommentsMap[lWord] || mCommentsMap[lWord]) {
								comment = lWord;

							} else {
								comment = word;
							}
						}

						if (comment) {
							selectionStart = i;
							continue;
						}
					}

					if (escapeEndMap[el]) {
						end = true;

					} else if (uSRgxp.test(el)) {
						end = false;
					}

					let skip = false;

					if (opt_snakeskin) {
						if (el === '|' && wRgxp.test(next)) {
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

				if (p[el] && (el === '/' ? end : true) && !begin) {
					begin = el;
					selectionStart = i;

				} else if (begin && (el === '\\' || escape)) {
					escape = !escape;

				} else if (p[el] && begin === el && !escape && (begin === '/' ? !block : true)) {
					if (el === '/') {
						for (let j = -1; ++j < rgxpFlags.length;) {
							if (rgxpFlagsMap[str.charAt(i + 1)]) {
								i++;
							}
						}
					}

					begin = false;

					cut = str.substring(selectionStart, i + 1);
					label = `__ESCAPER_QUOT__${stack.length}_`;

					stack.push(cut);
					str = str.substring(0, selectionStart) + label + str.substring(i + 1);

					i += label.length - cut.length;
				}

			} else if ((next === '\n' && sCommentsMap[comment]) ||
				(el === '/' && prev === '*' && i - selectionStart > 2 && mCommentsMap[comment])

			) {
				if (p[comment]) {
					cut = str.substring(selectionStart, i + 1);
					label = `__ESCAPER_QUOT__${stack.length}_`;

					stack.push(cut);
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