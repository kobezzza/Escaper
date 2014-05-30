# Escaper

Микробиблиотека для "экранирования" литералов строк, регулярных выражений и комментариев в синтаксисе JavaScript.

## Установка

	https://github.com/kobezzza/Escaper/blob/master/lib/escaper.js

или

	npm install escaper

или

	bower install escaper

или

	git clone git://github.com/kobezzza/Escaper.git

## Использование

```js
var str = '"foo" 1 /foo/ 2 /* 1 */ 3';
var content = [];

str = Escaper.replace(str, true, content);

console.log(str); // '__ESCAPER_QUOT__0_ 1 __ESCAPER_QUOT__1_ 2 __ESCAPER_QUOT__2_ 3'
console.log(Escaper.paste(str, content)); // '"foo" 1 /foo/ 2 /* 1 */ 3'
```

### Использование в консоли

	-s --source [src] ссылка на исходный файл
	-o --output [src] адрес для сохранения полученного результата (если не указан, то выводится на экран)
	-c --comment дополнительно экранируются комментарии

	escaper -s myFile.js -c
	escaper '"fooBar" + 1'

## API

### Escaper.replace(str, opt_withComment, opt_quotContent)

	Заметить блоки вида ' ... ', " ... ", / ... /, // ..., /* ... *\/ на
	__ESCAPER_QUOT__номер_ в указанной строке

---

**Аргументы**

* {string} `str` - исходная строка
* {?boolean=} [`opt_withComment`=false] - если true, то также вырезаются комментарии
* {Array=} [`opt_quotContent`=Escaper.quotContent] - стек содержимого
	
`@return` {string}

### Escaper.paste(str, opt_quotContent)

	Заметить __ESCAPER_QUOT__номер_ в указанной строке на реальное содержимое

---

**Аргументы**

	{string} str - исходная строка
	{Array=} [opt_quotContent**=Escaper.quotContent] - стек содержимого

	@return {string}

## Лицензия

The MIT License (MIT)

Copyright (c) 2014 Андрей Кобец (Kobezzza) <<kobezzza@mail.ru>>

Данная лицензия разрешает лицам, получившим копию данного программного обеспечения и
сопутствующей документации (в дальнейшем именуемыми «Программное Обеспечение»),
безвозмездно использовать Программное Обеспечение без ограничений, включая неограниченное право на использование,
копирование, изменение, добавление, публикацию, распространение, сублицензирование и/или
продажу копий Программного Обеспечения, также как и лицам, которым предоставляется данное
Программное Обеспечение, при соблюдении следующих условий:

Указанное выше уведомление об авторском праве и данные условия должны быть включены во все копии или
значимые части данного Программного Обеспечения.

ДАННОЕ ПРОГРАММНОЕ ОБЕСПЕЧЕНИЕ ПРЕДОСТАВЛЯЕТСЯ «КАК ЕСТЬ», БЕЗ КАКИХ-ЛИБО ГАРАНТИЙ, ЯВНО ВЫРАЖЕННЫХ ИЛИ ПОДРАЗУМЕВАЕМЫХ,
ВКЛЮЧАЯ, НО НЕ ОГРАНИЧИВАЯСЬ ГАРАНТИЯМИ ТОВАРНОЙ ПРИГОДНОСТИ, СООТВЕТСТВИЯ ПО ЕГО КОНКРЕТНОМУ НАЗНАЧЕНИЮ И
ОТСУТСТВИЯ НАРУШЕНИЙ ПРАВ. НИ В КАКОМ СЛУЧАЕ АВТОРЫ ИЛИ ПРАВООБЛАДАТЕЛИ НЕ НЕСУТ ОТВЕТСТВЕННОСТИ ПО ИСКАМ О
ВОЗМЕЩЕНИИ УЩЕРБА, УБЫТКОВ ИЛИ ДРУГИХ ТРЕБОВАНИЙ ПО ДЕЙСТВУЮЩИМ КОНТРАКТАМ, ДЕЛИКТАМ ИЛИ ИНОМУ, ВОЗНИКШИМ ИЗ,
ИМЕЮЩИМ ПРИЧИНОЙ ИЛИ СВЯЗАННЫМ С ПРОГРАММНЫМ ОБЕСПЕЧЕНИЕМ ИЛИ ИСПОЛЬЗОВАНИЕМ ПРОГРАММНОГО ОБЕСПЕЧЕНИЯ ИЛИ
ИНЫМИ ДЕЙСТВИЯМИ С ПРОГРАММНЫМ ОБЕСПЕЧЕНИЕМ.