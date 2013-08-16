var __NEJS_THIS__ = this;
var Escaper = {
	VERSION: '0.0.5',
	isLocal: false
};

if (typeof window === 'undefined' && !Escaper.isLocal) {
	module.exports = exports = Escaper;
}

(function () {
	var __NEJS_THIS__ = this;
	var escapeMap = {
		'"': true,
		'\'': true,
		'/': true
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

	/**
	 * Стек содержимого
	 * @type {!Array}
	 */
	Escaper.quotContent = [];

	/**
	 * Заметить блоки вида ' ... ', " ... ", / ... /, // ..., /* ... *\/ на
	 * __ESCAPER_QUOT__номер
	 *
	 * @this {Object}
	 * @param {string} str - исходная строка
	 * @param {?boolean=} [opt_withComment=false] - если true, то также вырезаются комментарии
	 * @param {Array=} [opt_quotContent] - стек содержимого
	 * @return {string}
	 */
	Escaper.replace = function (str, opt_withComment, opt_quotContent) {
		var __NEJS_THIS__ = this;
		opt_withComment = !!opt_withComment;
		var stack = this.quotContent || opt_quotContent;

		var begin,
			end = true,

			escape = false,
			comment,

			selectionStart = 0,
			block = false;

		var cut,
			label;

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
					begin = false;

					cut = str.substring(selectionStart, i + 1);
					label = '__ESCAPER_QUOT__' + stack.length;

					stack.push(cut);
					str = str.substring(0, selectionStart) + label + str.substring(i + 1);

					i += label.length - cut.length;
				}

			} else if ((next === '\n' && comment === '//') || (el === '/' && prev === '*' && comment === '/*')) {
				comment = false;

				if (opt_withComment) {
					cut = str.substring(selectionStart, i + 1);
					label = '__ESCAPER_QUOT__' + stack.length;

					stack.push(cut);
					str = str.substring(0, selectionStart) + label + str.substring(i + 1);

					i += label.length - cut.length;
				}
			}
		}

		return str;
	};

	/**
	 * Заметить __ESCAPER_QUOT__номер в строке на реальное содержимое
	 *
	 * @this {Object}
	 * @param {string} str - исходная строка
	 * @param {Array=} [opt_quotContent] - стек содержимого
	 * @return {string}
	 */
	Escaper.paste = function (str, opt_quotContent) {
		var __NEJS_THIS__ = this;
		var stack = this.quotContent || opt_quotContent;
		return str.replace(/__ESCAPER_QUOT__(\d+)/gm, function (sstr, pos) {
			return stack[pos];});
	};
})();