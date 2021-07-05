Escaper
=======

Библиотека для «экранирования» литералов строк, регулярных выражений и комментариев в синтаксисе JavaScript.

[Документация на английском](https://github.com/kobezzza/Escaper/blob/master/README.md)

[![NPM version](http://img.shields.io/npm/v/escaper.svg?style=flat)](http://badge.fury.io/js/escaper)
[![NPM devDependencies](http://img.shields.io/david/dev/kobezzza/Escaper.svg?style=flat)](https://david-dm.org/kobezzza/Escaper?type=dev)
[![Build Status](https://github.com/kobezzza/Escaper/workflows/build/badge.svg?branch=master)](https://github.com/kobezzza/Escaper/actions?query=workflow%3Abuild)
[![Coverage Status](http://img.shields.io/coveralls/kobezzza/Escaper.svg?style=flat)](https://coveralls.io/r/kobezzza/Escaper?branch=master)

**Поддерживаются литералы:**

* `' ... '`
* `" ... "`
* `` ` ... ` ``, `` ` ... ${...} ` ``
* `/ ... /`
* `// ...`, `//* ...`, `//! ...`, `//# ...`, `//@ ...`, `//$ ...`
* `/* ... */`, `/** ... */`, `/*! ... */`, `/*# ... */`, `/*@ ... */`, `/*$ ... */`

## Установка

https://raw.githubusercontent.com/kobezzza/Escaper/master/dist/escaper.min.js

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
const
  str = 'Hello "world" and \'friends\'',
  content = [];

// Заменяет все найденные последовательности
// 'Hello __ESCAPER_QUOT__0_ and __ESCAPER_QUOT__1_'
Escaper.replace(str, content)

// Заменяет только одинарные кавычки
// 'Hello "world" and __ESCAPER_QUOT__0_'
Escaper.replace(str, ["'"])

// Вырезает все найденные последовательности
// 'Hello and '
Escaper.replace(str, -1)

// Заменяет все найденные последовательности, но вырезает одинарные кавычки
// 'Hello __ESCAPER_QUOT__0_ and '
Escaper.replace(str, {"'": -1})

// Заменяет все найденные последовательности кроме одинарных кавычек
// 'Hello __ESCAPER_QUOT__0_ and \'friends\''
Escaper.replace(str, {strings: false})

// Заменяет все найденные последовательности, но строки только как одинарные кавычки
// 'Hello "world" and __ESCAPER_QUOT__0_'
Escaper.replace(str, {strings: ["'"]})

// Заменяет все найденные последовательности, но строки только как одинарные кавычки и они будут вырезаны
// 'Hello "world" and '
Escaper.replace(str, {strings: {"'": -1}})

// Обратная замена
// 'Hello "world" and \'friends\''
Escaper.paste(str, content);
```

## API
### Escaper.replace(str, how?, content?): string

Заметить блоки вида `' ... '`, `" ... "`, `` ` ... ` ``, `/ ... /`, `// ...`, `/* ... */` на
экранированные последовательности в указанной строке и вернуть новую строку.

**Аргументы**

* `string` `str` — исходная строка;
* `string[] | Record<string, string[] | Record<string, boolean | -1> | false | -1> | false | -1` `how?` — параметры экранирования:

**Возможные значения**

Если установить значение параметру `-1`, то последовательность будет удаляться
(т.е. без возможности обратной замены), иначе `boolean` — включить/исключить последовательность.

```js
// Шаблон замены, по умолчанию __ESCAPER_QUOT__${pos}_
'label'

// Однострочные комментарии
'singleComments'

// Многострочные комментарии
'multComments'

// Все виды комментариев
'comments'

// Все виды литералов строк
'strings'

// Все виды литералов (кроме строк и комментариев)
'literals'

// Литералы
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

Параметры могут быть заданы как в виде массива (экранировать только явно указанные последовательности),
так и в виде объекта (отключение/исключение по литералу или группе). Также если задать значение параметра как `-1`,
то все найденные последовательности будут удаляться из строки.

* `string[]` `content = Escaper.content` — список содержимого;

### Escaper.paste(str, content?, rgxp?): string

Заметить экранированные последовательности в указанной строке на реальное содержимое и вернуть новую строку.

**Аргументы**

* `string` `str` — исходная строка;
* `string[]` `content = Escaper.content` — список содержимого;
* `RegExp` `rgxp?` — регулярное выражение для поиска, например `/__ESCAPER_QUOT__(\d+)_/g`.

## [Лицензия](https://github.com/kobezzza/Escaper/blob/master/LICENSE)

The MIT License.
