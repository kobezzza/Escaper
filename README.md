# Escaper

Library for "escaping" literal strings, regular expressions and comments in the syntax of JavaScript.

[![NPM version](http://img.shields.io/npm/v/escaper.svg?style=flat)](http://badge.fury.io/js/escaper)
[![NPM dependencies](http://img.shields.io/david/kobezzza/Escaper.svg?style=flat)](https://david-dm.org/kobezzza/escaper)
[![Build Status](http://img.shields.io/travis/kobezzza/Escaper.svg?style=flat&branch=master)](https://travis-ci.org/kobezzza/Escaper)
[![Coverage Status](http://img.shields.io/coveralls/kobezzza/Escaper.svg?style=flat)](https://coveralls.io/r/kobezzza/Escaper?branch=master)

**Supported:**

* `' ... '`
* `" ... "`
* `` ` ... ` ``, `` ` ... ${...} ` ``
* `/ ... /`
* `// ...`
* `/* ... */`, `/** ... */`, `/*! ... */`

## Install

https://raw.githubusercontent.com/kobezzza/Escaper/master/dist/escaper.min.js

or

```bash
npm install escaper
```

or

```bash
bower install escaper
```

or

```bash
git clone https://github.com/kobezzza/Escaper
```

## Usage

```js
var str = '"foo" 1 + /foo/ + 2 /* 1 */ 3',
	content = [];

// __ESCAPER_QUOT__0_ 1 + __ESCAPER_QUOT__1_ + 2 __ESCAPER_QUOT__2_ 3
str = Escaper.replace(str, true, content);

// "foo" 1 + /foo/ + 2 /* 1 */ 3
Escaper.paste(str, content);
```

## API

### Escaper.replace(str, opt_withComment, opt_quotContent)

Replace blocks `' ... '`, `" ... "`, `` ` ... ` ``, `/ ... /`, `// ...`, `/* ... */` on
`__ESCAPER_QUOT__number_` in the specified string.

**Arguments**

* `string` `str` — source string
* `(Object|boolean)=` `opt_withCommentsOrParams = false` — parameters:

```js
{
	'@all'     : true // Replace all sequences
	'@comments': true // Replace all kinds of comments
	'@literals': true // Replace all kinds of string literals
	                  // and regular expressions

	"'"        : true,
	'"'        : true,
	'`'        : true,
	'/'        : true,
	'//'       : true,
	'/*'       : true,
	'/**'      : true,
	'/*!'      : true
}
```

If set value to -1, it will be removal, without the possibility of replacing back,
or true /false - include / exclude.

If parameter `opt_withCommentsOrParams` is boolean:

```js
true  // Replace all sequences
false // Replace all kinds of string literals and regular expressions
```

* `Array=` `opt_quotContent = Escaper.quotContent` — content store

`@return {string}`

### Escaper.paste(str, opt_quotContent)

Replace `__ESCAPER_QUOT__number_` in the specified string on the real content.

**Arguments**

* `string` `str` — source string
* `Array=` `opt_quotContent = Escaper.quotContent` — content store

`@return {string}`

## [License](https://github.com/kobezzza/Escaper/blob/master/LICENSE)

The MIT License.
