Escaper
=======

Escaper is a small JavaScript library to replace string literals, regular expressions, and comments from the JavaScript syntax.

[Russian documentation](https://github.com/kobezzza/Escaper/blob/master/README.ru.md)

[![NPM version](http://img.shields.io/npm/v/escaper.svg?style=flat)](http://badge.fury.io/js/escaper)
[![NPM devDependencies](http://img.shields.io/david/dev/kobezzza/Escaper.svg?style=flat)](https://david-dm.org/kobezzza/Escaper?type=dev)
[![Build Status](https://github.com/kobezzza/Escaper/workflows/build/badge.svg?branch=master)](https://github.com/kobezzza/Escaper/actions?query=workflow%3Abuild)
[![Coverage Status](http://img.shields.io/coveralls/kobezzza/Escaper.svg?style=flat)](https://coveralls.io/r/kobezzza/Escaper?branch=master)

**Supports:**

* `' ... '`
* `" ... "`
* `` ` ... ` ``, `` ` ... ${...} ` ``
* `/ ... /`
* `// ...`, `//* ...`, `//! ...`, `//# ...`, `//@ ...`, `//$ ...`
* `/* ... */`, `/** ... */`, `/*! ... */`, `/*# ... */`, `/*@ ... */`, `/*$ ... */`

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
const
  str = 'Hello "world" and \'friends\'',
  content = [];

// Replaces all found matches
// 'Hello __ESCAPER_QUOT__0_ and __ESCAPER_QUOT__1_'
Escaper.replace(str, content)

// Replaces only single quotes
// 'Hello "world" and __ESCAPER_QUOT__0_'
Escaper.replace(str, ["'"])

// Cuts all found matches
// 'Hello and '
Escaper.replace(str, -1)

// Replaces all and cuts single quotes
// 'Hello __ESCAPER_QUOT__0_ and '
Escaper.replace(str, {"'": -1})

// Replaces all but strings
// 'Hello __ESCAPER_QUOT__0_ and \'friends\''
Escaper.replace(str, {strings: false})

// Replaces all, but strings can be only single quotes
// 'Hello "world" and __ESCAPER_QUOT__0_'
Escaper.replace(str, {strings: ["'"]})

// Replaces all, but strings can be only single quotes and it will be cut
// 'Hello "world" and '
Escaper.replace(str, {strings: {"'": -1}})

// Replaces all found escape blocks to a real content
// 'Hello "world" and \'friends\''
Escaper.paste(str, content);
```

## API
### Escaper.replace(str, how?, store?): string

Replaces all found blocks `' ... '`, `" ... "`, `` ` ... ` ``, `/ ... /`, `// ...`, `/* ... */` to
escape blocks from the specified string and returns a new string.

**Arguments**

* `string` `str` — source string;
* `string[] | Record<string, string[] | Record<string, boolean | -1> | false | -1> | false | -1` `how?` —  parameters:

**Possible values**

If a value is set to `-1`, then all found matches will be removed from the final string.
If the value is set to `boolean` it will be replaced/passed.

```js
// Label of replacement, by default __ESCAPER_QUOT__${pos}_
'label'

// Singleline comment
'singleComments'

// Multiline comments
'multComments'

// All kinds of comments
'comments'

// All kinds of strings
'strings'

// All kinds of literals (except strings and comments)
'literals'

// Literals
"'"
'"'
'`'
'/'
'//'
'//*'
'//!'
'//#'
'//@'
'//$'
'/*'
'/**'
'/*!'
'/*#'
'/*@'
'/*$'
```

The parameters can be specified as an array (escapes only explicitly specified sequences)
or like an object (disables/excludes by a literal or group). Also, if you set the parameter value as `-1`,
then all found sequences will be removed from the string.

* `string[]` `store = Escaper.content` — store for matches.

### Escaper.paste(str, store?, rgxp?): string

Replaces all found escape blocks to real content from the specified string and returns a new string.

**Arguments**

* `string` `str` — source string;
* `string[]` `store = Escaper.content` — store of matches;
* `RegExp` `rgxp?` — RegExp to search, e.g. `/__ESCAPER_QUOT__(\d+)_/g`.

## [License](https://github.com/kobezzza/Escaper/blob/master/LICENSE)

The MIT License.
