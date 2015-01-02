# Escaper

Библиотека для «экранирования» литералов строк, регулярных выражений и комментариев в синтаксисе JavaScript.

[![NPM version](http://img.shields.io/npm/v/escaper.svg?style=flat)](http://badge.fury.io/js/escaper)
[![NPM dependencies](http://img.shields.io/david/kobezzza/Escaper.svg?style=flat)](https://david-dm.org/kobezzza/escaper)
[![Build Status](http://img.shields.io/travis/kobezzza/Escaper.svg?style=flat&branch=master)](https://travis-ci.org/kobezzza/Escaper)
[![Coverage Status](http://img.shields.io/coveralls/kobezzza/Escaper.svg?style=flat)](https://coveralls.io/r/kobezzza/Escaper?branch=master)

**Поддерживаются литералы:**

* `' ... '`
* `" ... "`
* `` ` ... ` ``, `` ` ... ${...} ` ``
* `/ ... /`
* `// ...`
* `/* ... */`, `/** ... */`, `/*! ... */`

## Установка

https://github.com/kobezzza/Escaper/blob/master/dist/escaper.min.js

или

```bash
npm install escaper
```

или

```bash
bower install escaper
```

или

```bash
git clone https://github.com/kobezzza/Escaper
```

## Использование

```js
var str = '"foo" 1 + /foo/ + 2 /* 1 */ 3',
	content = [];

// __ESCAPER_QUOT__0_ 1 + __ESCAPER_QUOT__1_ + 2 __ESCAPER_QUOT__2_ 3
str = Escaper.replace(str, true, content);

// "foo" 1 + /foo/ + 2 /* 1 */ 3
Escaper.paste(str, content);
```

### Поддержка

`IE 6+`, `FF`, `Chrome`.

## API

### Escaper.replace(str, opt_withComment, opt_quotContent)

Заметить блоки вида `' ... '`, `" ... "`, `` ` ... ` ``, `/ ... /`, `// ...`, `/* ... */` на
`__ESCAPER_QUOT__номер_` в указанной строке.

**Аргументы**

* `string` `str` — исходная строка
* `(Object|boolean)=` `opt_withCommentsOrParams = false` — таблица вырезаемых последовательностей:

Если установить значение параметру `-1`, то он будет полностью вырезаться,
т.е. без возможности обратной замены, иначе `true`/`false` — включить/исключить последовательность.

```js
{
	'@all'     : true // Специальная команда для выделения всех последовательностей
	'@comments': true // Специальная команда для выделения всех видов комментариев
	'@literals': true // Специальная команда для выделения литералов строк
	                  // и регулярных выражений

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

ИЛИ если логическое значение, то

```js
true  // вырезаются литералы с комментариями
false // вырезаются одни литералы
```

* `Array=` `opt_quotContent = Escaper.quotContent` — стек содержимого

`@return {string}`

### Escaper.paste(str, opt_quotContent)

Заметить `__ESCAPER_QUOT__номер_` в указанной строке на реальное содержимое.

**Аргументы**

* `string` `str` — исходная строка
* `Array=` `opt_quotContent = Escaper.quotContent` — стек содержимого

`@return {string}`

## [Лицензия](https://github.com/kobezzza/Escaper/blob/master/LICENSE)

The MIT License.