'use strict';

/* eslint-disable eqeqeq, prefer-template */

/*!
 * Escaper
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 */

const
	gulp = require('gulp'),
	$ = require('gulp-load-plugins')(),
	fs = require('fs');

const
	headRgxp = /(\/\*![\s\S]*?\*\/\n{2})/;

function getVersion() {
	const file = fs.readFileSync('./src/escaper.js');
	return /VERSION\s*[:=]\s*\[(\d+,\s*\d+,\s*\d+)]/.exec(file)[1]
		.split(/\s*,\s*/)
		.join('.');
}

function getHead(opt_version) {
	return (
		'/*!\n' +
		` * Escaper${opt_version ? ` v${getVersion()}` : ''}\n` +
		' * https://github.com/kobezzza/Escaper\n' +
		' *\n' +
		' * Released under the MIT license\n' +
		' * https://github.com/kobezzza/Escaper/blob/master/LICENSE\n'
	);
}

gulp.task('predefs:build', () =>
	gulp.src('./predefs/src/index.js')
		.pipe($.plumber())
		.pipe($.monic())
		.pipe(gulp.dest('./predefs/build'))
);

gulp.task('predefs:externs', () =>
	$.download([
		'https://raw.githubusercontent.com/google/closure-compiler/master/contrib/externs/jasmine.js'
	])
		.pipe($.plumber())
		.pipe(gulp.dest('./predefs/src/ws'))
);

gulp.task('predefs:bower', () =>
	$.run('bower install').exec()
);

gulp.task('predefs', gulp.parallel([
	'predefs:build',
	'predefs:externs',
	'predefs:bower'
]));

gulp.task('build:js', () => {
	const fullHead =
		getHead(true) +
		' *\n' +
		` * Date: ${new Date().toUTCString()}\n` +
		' */\n\n';

	return gulp.src('./src/escaper.js')
		.pipe($.plumber())
		.pipe($.rollup({
			input: './src/escaper.js',
			output: {
				name: 'Escaper',
				format: 'umd',
				exports: 'named'
			},
			amd: {id: 'Escaper'},
			plugins: [require('rollup-plugin-babel')()]
		}))

		.pipe($.replace(headRgxp, ''))
		.pipe($.header(fullHead))
		.pipe($.eol('\n'))
		.pipe(gulp.dest('./dist'));
});

function compile() {
	const
		glob = require('glob'),
		config = require('./gcc.json');

	return gulp.src('./dist/escaper.js')
		.pipe($.plumber())
		.pipe($.closureCompiler(Object.assign(config, {compilerPath: glob.sync(config.compilerPath)})))
		.pipe($.replace(/^\/\*[\s\S]*?\*\//, ''))
		.pipe($.wrap('(function(){\'use strict\';<%= contents %>}).call(this);'))
		.pipe($.header(`/*! Escaper v${getVersion()} | https://github.com/kobezzza/Escaper/blob/master/LICENSE */\n`))
		.pipe($.eol('\n'))
		.pipe(gulp.dest('./dist'));
}

gulp.task('build:compile', gulp.series([gulp.parallel(['predefs', 'build:js']), compile]));
gulp.task('build:compile:fast', gulp.series(['build:js', compile]));
gulp.task('build', gulp.series(['build:compile', test]));

function test() {
	const
		dev = arguments[0] === true;

	function exec() {
		return gulp.src(`./dist/escaper${!dev ? '.min' : ''}.js`)
			.pipe($.istanbul())
			.pipe($.istanbul.hookRequire())
			.on('finish', runTests);

		function runTests() {
			return gulp.src(`./spec/${dev ? 'dev' : 'index'}_spec.js`)
				.pipe($.plumber())
				.pipe($.jasmine())
				.pipe($.istanbul.writeReports());
		}
	}

	if (dev) {
		return exec;
	}

	return exec();
}

gulp.task('test', test);
gulp.task('test:dev', gulp.series(['build:js', test(true)]));
gulp.task('yaspeller', () => $.run('yaspeller ./').exec().on('error', console.error));

gulp.task('copyright', () =>
	gulp.src('./LICENSE')
		.pipe($.plumber())
		.pipe($.replace(/(Copyright \(c\) )(\d+)-?(\d*)/, (str, intro, from, to) => {
			const year = new Date().getFullYear();
			return intro + from + (to || from != year ? `-${year}` : '');
		}))

		.pipe(gulp.dest('./'))
);

gulp.task('bump', () =>
	gulp.src('./@(package-lock|package|bower).json')
		.pipe($.plumber())
		.pipe($.bump({version: getVersion()}))
		.pipe(gulp.dest('./'))
);

gulp.task('npmignore', () =>
	gulp.src('./.npmignore')
		.pipe($.plumber())
		.pipe($.replace(/([\s\S]*?)(?=# NPM ignore list)/, `${require('fs').readFileSync('./.gitignore')}\n`))
		.pipe(gulp.dest('./'))
);

gulp.task('head', () => {
	const
		fullHead = `${getHead()} */\n\n`;

	function filter(file) {
		return !headRgxp.exec(file.contents.toString()) || RegExp.$1 !== fullHead;
	}

	const paths = [
		'./@(src|spec)/*.js',
		'./@(externs|gulpfile).js',
		'./escaper.d.ts',
		'./predefs/src/index.js'
	];

	return gulp.src(paths, {base: './'})
		.pipe($.plumber())
		.pipe($.ignore.include(filter))
		.pipe($.replace(headRgxp, ''))
		.pipe($.header(fullHead))
		.pipe(gulp.dest('./'));
});

gulp.task('default', gulp.parallel([
	'copyright',
	'head',
	'build',
	'bump',
	'yaspeller',
	'npmignore'
]));

gulp.task('watch', gulp.series(['default', () => {
	gulp.watch('./src/escaper.js', gulp.parallel(['test', 'bump']));
	gulp.watch('./spec/*.js', gulp.series('test'));
	gulp.watch('./*.md', gulp.series('yaspeller'));
	gulp.watch('./.gitignore', gulp.series('npmignore'));
}]));

gulp.task('watch:dev', gulp.series([gulp.parallel(['build:js', 'bump', 'yaspeller', 'npmignore']), () => {
	gulp.watch('./src/escaper.js', gulp.parallel(['test:dev', 'bump']));
	gulp.watch('./spec/*.js', gulp.series('test'));
	gulp.watch('./*.md', gulp.series('yaspeller'));
	gulp.watch('./.gitignore', gulp.series('npmignore'));
}]));
