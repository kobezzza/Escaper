var Escaper = {
	VERSION: [2, 1, 7]
};

if (typeof define === 'function' && (define.amd || define['amd'])) {
	define([], () => Escaper);

} else if (typeof exports === 'object') {
	module.exports =
		exports = Escaper;

} else {
	this.Escaper = Escaper;
}

var stringLiterals = {
	'"': true,
	"'" : true,
	'`': true
};

var literals = {
	'/': true
};

for (let key in stringLiterals) {
	if (!stringLiterals.hasOwnProperty(key)) {
		continue;
	}

	literals[key] = true;
}

var singleComments = {
	'//': true
};

var multComments = {
	'/*': true,
	'/**': true,
	'/*!': true
};

var keyArr = [],
	finalMap = {};

for (let key in literals) {
	if (!literals.hasOwnProperty(key)) {
		continue;
	}

	keyArr.push(key);
	finalMap[key] = true;
}

for (let key in singleComments) {
	if (!singleComments.hasOwnProperty(key)) {
		continue;
	}

	keyArr.push(key);
	finalMap[key] = true;
}

for (let key in multComments) {
	if (!multComments.hasOwnProperty(key)) {
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
	for (let key in obj) {
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
	snakeskinRgxp;

Escaper.snakeskinRgxp = Escaper.snakeskinRgxp || null;
Escaper.symbols = Escaper.symbols || null;

/**
 * Заметить блоки вида ' ... ', " ... ", ` ... `, / ... /, // ..., /* ... *\/ на
 * __ESCAPER_QUOT__номер_ в указанной строке
 *
 * @param {string} str - исходная строка
 * @param {(Object.<string, boolean>|boolean)=} [opt_withCommentsOrParams=false] - таблица вырезаемых последовательностей:
 *
 *     (если установить значение параметру -1, то он будет полностью вырезаться,
 *     т.е. без возможности обратной замены, иначе true/false - включить/исключить последовательность)
 *
 *     *) @all - вырезаются все последовательности
 *     *) @comments - вырезаются все виды комментариев
 *     *) @strings - вырезаются все виды литералов строк
 *     *) @literals - вырезаются все виды литералов строк и регулярных выражений
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
	symbols = symbols ||
		Escaper.symbols ||
		Escaper['symbols'] ||
		'a-z';

	snakeskinRgxp = snakeskinRgxp ||
		Escaper.snakeskinRgxp ||
		Escaper['snakeskinRgxp'] ||
		new RegExp(`[!$${symbols}_]`, 'i');

	var isObj = opt_withCommentsOrParams instanceof Object;
	var p = isObj ?
		Object(opt_withCommentsOrParams) : {};

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
	for (let i = -1; ++i < keyArr.length;) {
		let el = keyArr[i];

		if (multComments[el] || singleComments[el]) {
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

				let skip = false;
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

			if (finalMap[el] && (el !== '/' || end) && !begin) {
				begin = el;
				selectionStart = i;

			} else if (begin && (el === '\\' || escape)) {
				escape = !escape;

			} else if (finalMap[el] && begin === el && !escape && (begin !== '/' || !block)) {
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

		} else if ((nRgxp.test(next) && singleComments[comment]) ||
			(multComments[el + str.charAt(i - 1)] && i - selectionStart > 2 && multComments[comment])

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

var pasteRgxp = /__ESCAPER_QUOT__(\d+)_/g;

/**
 * Заметить __ESCAPER_QUOT__номер_ в указанной строке на реальное содержимое
 *
 * @param {string} str - исходная строка
 * @param {Array=} [opt_quotContent=Escaper.quotContent] - стек содержимого
 * @return {string}
 */
Escaper.paste = function (str, opt_quotContent) {
	var stack = opt_quotContent || content;
	return str.replace(pasteRgxp, (sstr, pos) => stack[pos]);
};
