/*!
 * Escaper v3.0.1
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 *
 * Date: Mon, 21 Jan 2019 13:55:01 GMT
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define('Escaper', ['exports'], factory) :
	(factory((global.Escaper = {})));
}(this, (function (exports) { 'use strict';

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

var Escaper;
var escaper = Escaper = {
  VERSION: [3, 0, 1],
  content: [],
  cache: Object.create(null),
  symbols: /[!$a-z_]/i,
  replace: replace,
  paste: paste
};
var singleComments = ['//', '//*', '//!', '//#', '//@', '//$'];
var multComments = ['/*', '/**', '/*!', '/*#', '/*@', '/*$'];
var strings = ['"', '\'', '`'];
var literals = ['/'];
var all = [].concat(singleComments, multComments, strings, literals);
var singleCommentsMap = createMap(singleComments);
var multCommentsMap = createMap(multComments);
var allMap = createMap(all);
var defMap = {
  'true': true,
  'null': true,
  'undefined': true,
  '-1': true
};
var rgxpFlags = ['g', 'm', 'i', 'y', 'u'];
var rgxpFlagsMap = createMap(rgxpFlags);
var endSymbols = createMap(['-', '+', '*', '%', '~', '>', '<', '^', ',', ';', '=', '|', '&', '!', '?', ':', '(', '{', '[']);
var endWords = createMap(['return', 'yield', 'await', 'typeof', 'void', 'instanceof', 'delete', 'in', 'new', 'of']);
var notSpaceRgxp = /[^\s/]/;
var wordRgxp = /[a-z]/;
var spaceRgxp = /\s/;
var nextLineRgxp = /[\r\n]/;
var posRgxp = /\${pos}/g;
/**
 * @param {!Array} arr
 * @return {!Object}
 */

function createMap(arr) {
  var map = Object.create(null);

  for (var i = 0; i < arr.length; i++) {
    map[arr[i]] = true;
  }

  return map;
}
/** @return {{get: !Function, set: !Function}} */


function createCache() {
  if (typeof Map === 'function') {
    return new Map();
  }

  var cache = Object.create(null);
  return {
    get: function get(key) {
      return cache[key];
    },
    set: function set(key, value) {
      cache[key] = value;
      return this;
    }
  };
}

var restrictedKeys = createMap(['label', 'filters', 'singleComments', 'multComment', 'comments', 'strings', 'literals']);
/**
 * @param {(!Object|!Array)} from
 * @param {!Object} to
 * @param {?=} [value]
 * @return {boolean}
 */

function mix(from, to, value) {
  if (!from || _typeof(from) !== 'object') {
    return false;
  }

  var isArr = Array.isArray(from),
      customValue = arguments.length > 2,
      keys = isArr ? from : Object.keys(from);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];

    if (restrictedKeys[key]) {
      continue;
    }

    if (key in to === false) {
      var v = customValue ? value : isArr ? true : from[key];
      to[key] = v != null ? v : true;
    }
  }

  return true;
}
/**
 * @param {!Object} params
 * @param {number} pos
 * @return {string}
 */


function mark(params, pos) {
  var label = params['label'];

  if (label) {
    return label.replace(posRgxp, pos);
  }

  return "__ESCAPER_QUOT__".concat(pos, "_");
}
/**
 * Replaces all found blocks ' ... ', " ... ", ` ... `, / ... /, // ..., /* ... *\/ to
 * escape blocks in a string and returns a new string
 *
 * @param {string} str - source string
 * @param {(Object<string, (Array|Object|boolean|number)>|Array|number)=} [how=true] - parameters:
 *
 *     (if a parameter value is set to -1, then all found matches will be removed from the final string,
 *      or if the value will be set to false they will be excluded)
 *
 *     *) label          - template for replacement, e.g. __ESCAPER_QUOT__${pos}_
 *     *) singleComments - replaces all kinds of single comments
 *     *) multComments   - replaces all kinds of multiline comments
 *     *) comments       - replaces all kinds of comments
 *     *) strings        - replaces all kinds of string literals
 *     *) literals       - replaces all kinds of literals (except string literals)
 *
 *     *)`
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
 * @param {Array=} [content=Escaper.content] - array for matches
 * @return {string}
 *
 * @example
 * // Replaces all found matches
 * // 'Hello __ESCAPER_QUOT__0_ and __ESCAPER_QUOT__1_'
 * Escaper.replace('Hello "world" and \'friends\'')
 *
 * // Replaces only single quotes
 * // 'Hello "world" and __ESCAPER_QUOT__0_'
 * Escaper.replace('Hello "world" and \'friends\'', ["'"])
 *
 * // Cuts all found matches
 * // 'Hello and '
 * Escaper.replace('Hello "world" and \'friends\'', -1)
 *
 * // Replaces all and cuts single quotes
 * // 'Hello __ESCAPER_QUOT__0_ and '
 * Escaper.replace('Hello "world" and \'friends\'', {"'": -1})
 *
 * // Replaces all but strings
 * // 'Hello __ESCAPER_QUOT__0_ and \'friends\''
 * Escaper.replace('Hello "world" and \'friends\'', {strings: false})
 *
 * // Replaces all, but strings can be only single quotes
 * // 'Hello "world" and __ESCAPER_QUOT__0_'
 * Escaper.replace('Hello "world" and \'friends\'', {strings: ["'"]})
 *
 * // Replaces all, but strings can be only single quotes and it will be cut
 * // 'Hello "world" and '
 * Escaper.replace('Hello "world" and \'friends\'', {strings: {"'": -1}})
 */


function replace(str, how, content) {
  var p = Object.create(null),
      _Escaper = Escaper,
      cache = _Escaper.cache,
      staticContent = _Escaper.content;

  if (Array.isArray(how)) {
    if (how.length || Array.isArray(content)) {
      mix(how, p);
    } else {
      content = content || how;
      mix(all, p, true);
    }
  } else if (how && _typeof(how) === 'object') {
    mix(how, p);

    if (how['filters']) {
      p.filters = true;
    }

    p.label = how['label'];
    var singleCommentsOpt = how['singleComments'],
        multCommentsOpt = how['multComments'],
        commentsOpt = how['comments'];
    var skipComments = false;

    if (singleCommentsOpt !== false) {
      if (defMap[singleCommentsOpt]) {
        mix(singleComments, p, singleCommentsOpt);
        skipComments = singleCommentsOpt != null;
      } else if (mix(singleCommentsOpt, p)) {
        skipComments = true;
      }
    }

    if (multCommentsOpt !== false) {
      if (defMap[multCommentsOpt]) {
        mix(singleComments, p, multCommentsOpt);
        skipComments = skipComments || multCommentsOpt != null;
      } else if (mix(multCommentsOpt, p)) {
        skipComments = true;
      }
    }

    if (!skipComments && commentsOpt !== false) {
      if (defMap[commentsOpt]) {
        mix(multComments, p, commentsOpt);
        mix(singleComments, p, commentsOpt);
      } else {
        mix(commentsOpt, p);
      }
    }

    var stringsOpt = how['strings'],
        literalsOpt = how['literals'];

    if (stringsOpt !== false) {
      if (defMap[stringsOpt]) {
        mix(strings, p, stringsOpt);
      } else {
        mix(stringsOpt, p);
      }
    }

    if (literalsOpt !== false) {
      if (defMap[literalsOpt]) {
        mix(literals, p, literalsOpt);
      } else {
        mix(literalsOpt, p);
      }
    }
  } else {
    mix(all, p, how === -1 ? -1 : true);
  }

  content = content || staticContent;
  var cacheStr = str,
      canCache = content === staticContent,
      cacheKey = canCache && Object.keys(p).join(),
      cacheVal = canCache && cacheKey in cache && cache[cacheKey].get(cacheStr);

  if (cacheVal) {
    return cacheVal;
  }

  var symbols = Escaper.symbols;
  var
  /** @type {(boolean|string)} */
  begin = false,
      end = true;
  var escape = false,
      comment = false;
  var selectionStart = 0,
      block = false;
  var templateVar = 0,
      filterStart = false;
  var cut, label;
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
          if (singleCommentsMap[word] || multCommentsMap[word]) {
            if (singleCommentsMap[extWord] || multCommentsMap[extWord]) {
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

        if (endSymbols[el] || endWords[rPart]) {
          end = true;
          rPart = '';
        } else if (notSpaceRgxp.test(el)) {
          end = false;
        }

        if (wordRgxp.test(el)) {
          part += el;
        } else {
          rPart = part;
          part = '';
        }

        var skip = false;

        if (p.filters) {
          if (el === '|' && symbols.test(next)) {
            filterStart = true;
            end = false;
            skip = true;
          } else if (filterStart && spaceRgxp.test(el)) {
            filterStart = false;
            end = true;
            skip = true;
          }
        }

        if (!skip) {
          if (endSymbols[el]) {
            end = true;
          } else if (notSpaceRgxp.test(el)) {
            end = false;
          }
        }
      } // [] inside RegExp


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

      if (allMap[el] && (el !== '/' || end) && !begin) {
        begin = el;
        selectionStart = i;
      } else if (begin && (el === '\\' || escape)) {
        escape = !escape;
      } else if (allMap[el] && begin === el && !escape && (begin !== '/' || !block)) {
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
            label = mark(p, content.length);
            content.push(cut);
          }

          str = str.substring(0, selectionStart) + label + str.substring(i + 1);
          i += label.length - cut.length;
        }
      }
    } else if ((i === str.length - 1 || nextLineRgxp.test(next)) && singleCommentsMap[comment] || multCommentsMap[el + str.charAt(i - 1)] && i - selectionStart > 2 && multCommentsMap[comment]) {
      if (p[comment]) {
        cut = str.substring(selectionStart, i + 1);

        if (p[comment] === -1) {
          label = '';
        } else {
          label = mark(p, content.length);
          content.push(cut);
        }

        str = str.substring(0, selectionStart) + label + str.substring(i + 1);
        i += label.length - cut.length;
      }

      comment = false;
    }
  }

  if (canCache) {
    var c = cache[cacheKey] = cache[cacheKey] || createCache();
    c.set(cacheStr, str);
  }

  return str;
}
var pasteRgxp = /__ESCAPER_QUOT__(\d+)_/g;
/**
 * Replaces all found escape blocks to a real content in a string
 * and returns a new string
 *
 * @param {string} str - source string
 * @param {Array=} [content=Escaper.content] - array of matches
 * @param {RegExp=} [rgxp] - RegExp for searching, e.g. /__ESCAPER_QUOT__(\d+)_/g
 * @return {string}
 */

function paste(str, content, rgxp) {
  return str.replace(rgxp || pasteRgxp, function (str, pos) {
    return (content || Escaper.content)[pos];
  });
}

exports['default'] = escaper;
exports.replace = replace;
exports.paste = paste;

Object.defineProperty(exports, '__esModule', { value: true });

})));
