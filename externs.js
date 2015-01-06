/** @type {!Object} */
var Escaper = {
	/** @type {!Array} */
	VERSION: [],

	/** @type {!Array} */
	quotContent: [],

	/** @type {RegExp} */
	snakeskinRgxp: null,

	/** @type {?string} */
	symbols: null,

	/**
	 * @abstract
	 * @param {string} str
	 * @param {(Object|boolean)=} [opt_withCommentsOrParams]
	 * @param {Array=} [opt_quotContent]
	 * @param {?boolean=} [opt_snakeskin]
	 * @return {string}
	 */
	replace: function (str, opt_withCommentsOrParams, opt_quotContent, opt_snakeskin) {},

	/**
	 * @abstract
	 * @param {string} str
	 * @param {Array=} [opt_quotContent]
	 * @return {string}
	 */
	paste: function (str, opt_quotContent) {}
};
