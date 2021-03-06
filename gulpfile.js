'use strict';

/* eslint-disable eqeqeq, prefer-template, no-loop-func */

/*!
 * Escaper
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 */

const
	gulp = require('gulp'),
	plumber = require('gulp-plumber'),
	$ = require('gulp-load-plugins')();

const
	fs = require('fs'),
	path = require('path');

const
	{Transform} = require('stream');

const
	headRgxp = /(\/\*![\s\S]*?\*\/\n{2})/;

gulp.task('predefs:build', () =>
	gulp.src('./predefs/src/index.js')
		.pipe(plumber())
		.pipe($.monic())
		.pipe(gulp.dest('./predefs/build'))
);

gulp.task('predefs:externs', () =>
	$.download([
		'https://raw.githubusercontent.com/google/closure-compiler/master/contrib/externs/jasmine.js'
	])
		.pipe(plumber())
		.pipe(gulp.dest('./predefs/src/ws'))
);

gulp.task('predefs', gulp.parallel(
	'predefs:build',
	'predefs:externs'
));

gulp.task('build:js', () => {
	const
		File = require('vinyl'),
		through = require('through2'),
		rollup = require('rollup');

	const fullHead =
		getHead(true) +
		' *\n' +
		` * Date: ${new Date().toUTCString()}\n` +
		' */\n\n';

	const stream = new Transform({
		readableObjectMode: true
	});

	rollup.rollup({
		input: './src/escaper.js',
		plugins: [require('rollup-plugin-babel')()]
	})
		.then((bundle) => bundle.generate({
			name: 'Escaper',
			format: 'umd',
			exports: 'named',
			amd: {id: 'Escaper'}
		}))

		.then(({output}) => {
			for (let i = 0; i < output.length; i++) {
				const
					el = output[i];

				stream.push(new File({
					path: el.facadeModuleId,
					base: path.dirname(el.facadeModuleId),
					contents: Buffer.from(el.code)
				}));
			}

			stream.push(null);
		})

		.catch((err) => {
			stream.push(err);
			stream.push(null);
		});

	return stream
		.pipe(plumber())
		.pipe(through.obj((data, enc, cb) => {
			if (data instanceof File) {
				cb(null, data);

			} else {
				cb(data);
			}
		}))

		.pipe($.header(fullHead))
		.pipe($.eol('\n'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('build', gulp.series(gulp.parallel('predefs', 'build:js'), compile));
gulp.task('build:fast', gulp.series('build:js', compile));

gulp.task('test', test(true));
gulp.task('build:test', gulp.series('build', test(false)));

gulp.task('test:dev', test(true, true));
gulp.task('build:test:dev', gulp.series('build:js', test(false, true)));
gulp.task('yaspeller', () => $.run('yaspeller ./').exec().on('error', console.error));

gulp.task('bump', () =>
	gulp.src('./@(package-lock|package).json')
		.pipe(plumber())
		.pipe($.bump({version: getVersion()}))
		.pipe(gulp.dest('./'))
);

gulp.task('npmignore', () =>
	gulp.src('./.npmignore')
		.pipe(plumber())
		.pipe($.replace(/([\s\S]*?)(?=# NPM ignore list)/, `${require('fs').readFileSync('./.gitignore')}\n`))
		.pipe(gulp.dest('./'))
);

gulp.task('head', () => {
	const
		fullHead = `${getHead()} */\n\n`;

	const paths = [
		'./@(src|spec)/*.js',
		'./@(externs|gulpfile).js',
		'./escaper.d.ts',
		'./predefs/src/index.js'
	];

	return gulp.src(paths, {base: './'})
		.pipe(plumber())
		.pipe($.ignore.include(filter))
		.pipe($.replace(headRgxp, ''))
		.pipe($.header(fullHead))
		.pipe(gulp.dest('./'));

	function filter(file) {
		return !headRgxp.exec(file.contents.toString()) || RegExp.$1 !== fullHead;
	}
});

gulp.task('default', gulp.parallel(
	gulp.series(
		gulp.parallel('bump', 'head'),
		'build:test'
	),

	'yaspeller',
	'npmignore'
));

gulp.task('dev', gulp.parallel(
	gulp.series(
		gulp.parallel('bump', 'head'),
		'build:test:dev'
	),

	'yaspeller',
	'npmignore'
));

gulp.task('watch', gulp.series('default', () => {
	gulp.watch('./src/escaper.js', gulp.series('bump', 'build'));
	gulp.watch('./spec/*.js', gulp.series('test'));
	gulp.watch('./*.md', gulp.series('yaspeller'));
	gulp.watch('./.gitignore', gulp.series('npmignore'));
}));

gulp.task('watch:dev', gulp.series('dev', () => {
	gulp.watch('./src/escaper.js', gulp.series('bump', 'build:dev'));
	gulp.watch('./spec/*.js', gulp.series('test'));
	gulp.watch('./*.md', gulp.series('yaspeller'));
	gulp.watch('./.gitignore', gulp.series('npmignore'));
}));

function compile() {
	const
		glob = require('glob'),
		config = require('./gcc.json');

	return gulp.src('./dist/escaper.js')
		.pipe(plumber())
		.pipe($.closureCompiler(Object.assign(config, {compilerPath: glob.sync(config.compilerPath)[0]})))
		.pipe($.replace(/^\/\*[\s\S]*?\*\//, ''))
		.pipe($.wrap('(function(){\'use strict\';<%= contents %>}).call(this);'))
		.pipe($.header(`/*! Escaper v${getVersion()} | https://github.com/kobezzza/Escaper/blob/master/LICENSE */\n`))
		.pipe($.eol('\n'))
		.pipe(gulp.dest('./dist'));
}

function test(die, dev) {
	return (cb) => {
		gulp.src(`./dist/escaper${dev ? '' : '.min'}.js`)
			.pipe(plumber())
			.pipe($.istanbul())
			.pipe($.istanbul.hookRequire())
			.on('finish', runTests);

		function runTests() {
			return gulp.src(`./spec/${dev ? 'dev' : 'index'}-spec.js`)
				.pipe(plumber())
				.pipe($.jasmine())
				.on('error', (err) => die ? cb(err) : cb())
				.pipe($.istanbul.writeReports())
				.on('finish', cb);
		}
	};
}

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
