#!/usr/bin/env node

var __NEJS_THIS__ = this;
/**!
 * @status stable
 * @version 1.0.2
 */

var Program = require('commander');
var Escaper = require('./escaper');

Program
	.version(Escaper.VERSION.toString('.'))
	.option('-i, --input [src]', 'input text')
	.option('-s, --source [src]', 'source file')
	.option('-o, --output [src]', 'output file')
	.option('-c, --comment', 'with comment')
	.parse(process.argv);

if (!Program.input && !Program.source) {
	Program.help();
}

var fs = require('fs');
var text = Program.input || String(fs.readFileSync(Program.source));

if (Program.output) {
	fs.writeFileSync(Program.output, Escaper.replace(text, !!Program.comment));

} else {
	console.log(Escaper.replace(text, !!Program.comment));
}