var Escaper = {
	VERSION: [1, 0, 9],
	isLocal: typeof window === 'undefined' ?
		Boolean(global.EscaperIsLocal || global['EscaperIsLocal']) : false
};

if (typeof window === 'undefined' && !Escaper.isLocal) {
	module.exports = exports = Escaper;
}

(function()  {
	var escapeMap = {
		'"': true,
		"'" : true,
		'/': true,
		'`': true
	};

	var rgxpFlagsMap = {
		'g': true,
		'm': true,
		'i': true
	};

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

	var cache = {};

	/**
	 * Стек содержимого
	 * @type {!Array}
	 */
	Escaper.quotContent = [];

	/**
	 * Заметить блоки вида ' ... ', " ... ", ` ... `, / ... /, // ..., /* ... *\/ на
	 * __ESCAPER_QUOT__номер_ в указанной строке
	 *
	 * @param {string} str - исходная строка
	 * @param {?boolean=} [opt_withComment=false] - если true, то также вырезаются комментарии
	 * @param {Array=} [opt_quotContent=this.quotContent] - стек содержимого
	 * @param {?boolean=} [opt_snakeskin] - если true, то при экранировании учитываются конструкции Snakeskin
	 * @return {string}
	 */
	Escaper.replace = function (str, opt_withComment, opt_quotContent, opt_snakeskin) {
		opt_withComment = Boolean(opt_withComment);

		var cacheKey = str;
		var stack = opt_quotContent || this.quotContent;

		if (stack === this.quotContent && cache[cacheKey] && cache[cacheKey][opt_withComment]) {
			return cache[cacheKey][opt_withComment];
		}

		var begin = false,
			end = true;

		var escape = false,
			comment = false;

		var selectionStart = 0,
			block = false;

		var cut,
			label;

		var filterStart = false;

		for (var i = 0; i < str.length; i++) {
			var el = str.charAt(i),
				prev = str.charAt(i - 1),
				next = str.charAt(i + 1);

			if (!comment) {
				if (!begin) {
					if (el === '/') {
						switch (next) {
							case '*': {
								comment = '/*';
							} break;

							case '/': {
								comment = '//';
							} break;
						}

						if (comment) {
							selectionStart = i;
							continue;
						}
					}

					if (escapeEndMap[el]) {
						end = true;

					} else if (/[^\s\/]/.test(el)) {
						end = false;
					}

					var skip = false;

					if (opt_snakeskin) {
						if (el === '|' && /[a-z]/i.test(next)) {
							filterStart = true;
							end = false;
							skip = true;

						} else if (filterStart && /\s/.test(el)) {
							filterStart = false;
							end = true;
							skip = true;
						}
					}

					if (!skip) {
						if (escapeEndMap[el]) {
							end = true;

						} else if (/[^\s\/]/.test(el)) {
							end = false;
						}
					}
				}

				// Блоки [] внутри регулярного выражения
				if (begin === '/' && !escape) {
					switch (el) {
						case '[': {
							block = true;
						} break;

						case ']': {
							block = false;
						} break;
					}
				}

				// Анализ содержимого
				if (escapeMap[el] && (el === '/' ? end : true) && !begin) {
					begin = el;
					selectionStart = i;

				} else if (begin && (el === '\\' || escape)) {
					escape = !escape;

				} else if (escapeMap[el] && begin === el && !escape && (begin === '/' ? !block : true)) {
					if (el === '/') {
						for (var key = void 0 in rgxpFlagsMap) {
							if (!rgxpFlagsMap.hasOwnProperty(key)) {
								continue;
							}

							if (rgxpFlagsMap[str.charAt(i + 1)]) {
								i++;
							}
						}
					}

					begin = false;

					cut = str.substring(selectionStart, i + 1);
					label = (("__ESCAPER_QUOT__" + (stack.length)) + "_");

					stack.push(cut);
					str = str.substring(0, selectionStart) + label + str.substring(i + 1);

					i += label.length - cut.length;
				}

			} else if ((next === '\n' && comment === '//') || (el === '/' && prev === '*' && comment === '/*')) {
				comment = false;

				if (opt_withComment) {
					cut = str.substring(selectionStart, i + 1);
					label = (("__ESCAPER_QUOT__" + (stack.length)) + "_");

					stack.push(cut);
					str = str.substring(0, selectionStart) + label + str.substring(i + 1);

					i += label.length - cut.length;
				}
			}
		}

		if (stack === this.quotContent) {
			cache[cacheKey] = cache[cacheKey] || {};
			cache[cacheKey][opt_withComment] = str;
		}

		return str;
	};

	/**
	 * Заметить __ESCAPER_QUOT__номер_ в указанной строке на реальное содержимое
	 *
	 * @param {string} str - исходная строка
	 * @param {Array=} [opt_quotContent=this.quotContent] - стек содержимого
	 * @return {string}
	 */
	Escaper.paste = function (str, opt_quotContent) {
		var stack = opt_quotContent || this.quotContent;
		return str.replace(/__ESCAPER_QUOT__(\d+)_/gm, function(sstr, pos)  {return stack[pos]});
	};
})();