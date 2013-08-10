var __NEJS_THIS__ = this;
var Program = require('commander');

Program
	.version('0.0.1')
	.option('-s, --source [src]', 'source file')
	.option('-o, --output [src]', 'output file')
	.option('-c, --comment', 'with comment')
	.parse(process.argv);

var fs = require('fs');
fs.writeFileSync(
	Program.output,
	require('./escaper').replace(
		String(fs.readFileSync(Program.source)), !!Program.comment
	)
);