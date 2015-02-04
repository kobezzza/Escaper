# Escaper

Escaper is a small JavaScript library for replacing string literals, regular expressions and comments in the syntax of JavaScript.

[Russian documentation](https://github.com/kobezzza/Escaper/blob/master/README.ru.md)

[![NPM version](http://img.shields.io/npm/v/escaper.svg?style=flat)](http://badge.fury.io/js/escaper)
[![NPM dependencies](http://img.shields.io/david/kobezzza/Escaper.svg?style=flat)](https://david-dm.org/kobezzza/Escaper#info=dependencies&view=table)
[![NPM devDependencies](http://img.shields.io/david/dev/kobezzza/Escaper.svg?style=flat)](https://david-dm.org/kobezzza/Escaper#info=devDependencies&view=table)
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

The method replaces all found blocks `' ... '`, `" ... "`, `` ` ... ` ``, `/ ... /`, `// ...`, `/* ... */` to
`__ESCAPER_QUOT__number_` in a string and returns a new string.

**Arguments**

* `string` `str` — the source string;
* `(Object|boolean)=` `opt_withCommentsOrParams = false` — parameters:

```js
{
	'@all'     : true, // Replaces all found matches
	'@comments': true, // Replaces all kinds of comments
	'@strings' : true, // Replaces all kinds of string literals
	'@literals': true, // Replaces all kinds of string literals
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

If a parameter value is set to `-1`, then all found matches will be removed from the final string, or if the value will be set to
`true`/`false` they will be included/excluded.

If parameter `opt_withCommentsOrParams` is boolean:

```js
true  // Replaces all found matches
false // Replaces all kinds of string literals and regular expressions
```

* `Array=` `opt_quotContent = Escaper.quotContent` — an array for matches.

`@return {string}`

### Escaper.paste(str, opt_quotContent)

The method replaces all found blocks `__ESCAPER_QUOT__number_` to real content in a string and returns a new string.

**Arguments**

* `string` `str` — the source string;
* `Array=` `opt_quotContent = Escaper.quotContent` — an array of matches.

`@return {string}`

## [License](https://github.com/kobezzza/Escaper/blob/master/LICENSE)

The MIT License.
