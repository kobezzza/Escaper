var __NEJS_THIS__ = this;
var Program = require('commander');
var Escaper = require('./escaper');

Program
	.version(Escaper.VERSION)
	.option('-s, --source [src]', 'source file')
	.option('-o, --output [src]', 'output file')
	.option('-c, --comment', 'with comment')
	.parse(process.argv);

var fs = require('fs');
fs.writeFileSync(
	Program.output,
	Escaper.replace(
		String(fs.readFileSync(Program.source)), !!Program.comment
	)
);