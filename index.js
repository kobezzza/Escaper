#!/usr/bin/env node

/*!
 * Escaper v1.1.6
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 */

var Program = require('commander');
var Escaper = require('./escaper');

Program
	.version(Escaper.VERSION.join('.'))
	.option('-s, --source [src]', 'source file')
	.option('-o, --output [src]', 'output file')
	.option('-c, --comment', 'with comment')
	.parse(process.argv);

var input;

if (!Program.source) {
	input = process.argv[2];
}

if (!input && !Program.source) {
	Program.help();
}

var fs = require('fs');
var text = Program.source ? String(fs.readFileSync(Program.source)) : input;

if (Program.output) {
	fs.writeFileSync(Program.output, Escaper.replace(text, !!Program.comment));

} else {
	console.log(Escaper.replace(text, !!Program.comment));
}