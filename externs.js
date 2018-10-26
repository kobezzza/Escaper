/*!
 * Escaper
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 */

/** @const */
var Escaper = {
	/** @type {!Array} */
	VERSION: [],

	/** @type {!Object} */
	cache: {},

	/** @type {!Array} */
	content: [],

	/** @type {!RegExp} */
	symbols: /symbols/,

	/**
	 * @param {string} str
	 * @param {(Object<string, (Array|Object|boolean|number)>|Array|number)=} [how]
	 * @param {Array=} [content]
	 * @return {string}
	 */
	replace: function (str, how, content) {},

	/**
	 * @param {string} str
	 * @param {Array=} [content]
	 * @param {RegExp=} [rgxp]
	 * @return {string}
	 */
	paste: function (str, content, rgxp) {}
};
