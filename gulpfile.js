'use strict';

/*!
 * Escaper
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 */

const
	gulp = require('gulp'),
	fs = require('fs'),
	async = require('async'),
	through = require('through2');

const
	babel = require('rollup-plugin-babel'),
	monic = require('gulp-monic'),
	rollup = require('gulp-rollup'),
	bump = require('gulp-bump'),
	gcc = require('gulp-closure-compiler'),
	header = require('gulp-header'),
	wrap = require('gulp-wrap'),
	replace = require('gulp-replace'),
	cached = require('gulp-cached'),
	download = require('gulp-download'),
	istanbul = require('gulp-istanbul'),
	jasmine = require('gulp-jasmine'),
	run = require('gulp-run');

function getVersion() {
	const file = fs.readFileSync('./src/escaper.js');
	return /VERSION\s*(?::|=)\s*\[(\d+,\s*\d+,\s*\d+)]/.exec(file)[1]
		.split(/\s*,\s*/)
		.join('.');
}

function getHead(opt_version) {
	return '' +
		'/*!\n' +
		` * Escaper${opt_version ? ` v${getVersion()}` : ''}\n` +
		' * https://github.com/kobezzza/Escaper\n' +
		' *\n' +
		' * Released under the MIT license\n' +
		' * https://github.com/kobezzza/Escaper/blob/master/LICENSE\n';
}

function error(cb) {
	return (err) => {
		console.error(err.message);
		cb();
	};
}

const
	headRgxp = /(\/\*![\s\S]*?\*\/\n{2})/;

let
	readyToWatcher = null;

gulp.task('copyright', (cb) => {
	gulp.src('./LICENSE')
		.pipe(replace(/(Copyright \(c\) )(\d+)-?(\d*)/, (sstr, intro, from, to) => {
			const year = new Date().getFullYear();
			return intro + from + (to || from != year ? `-${year}` : '');
		}))

		.pipe(gulp.dest('./'))
		.on('end', cb);
});

gulp.task('head', (cb) => {
	readyToWatcher = false;

	const
		fullHead = `${getHead()} */\n\n`;

	gulp.src(['./@(src|spec)/*.js', './@(externs|gulpfile).js', './predefs/src/index.js'], {base: './'})
		.pipe(through.obj(function (file, enc, cb) {
			if (!headRgxp.exec(file.contents.toString()) || RegExp.$1 !== fullHead) {
				this.push(file);
			}

			return cb();
		}))

		.pipe(replace(headRgxp, ''))
		.pipe(header(fullHead))
		.pipe(gulp.dest('./'))
		.on('end', () => {
			readyToWatcher = true;
			cb();
		});
});

gulp.task('build', (cb) => {
	const fullHead =
		getHead(true) +
		' *\n' +
		` * Date: ${new Date().toUTCString()}\n` +
		' */\n\n';

	gulp.src('./src/escaper.js')
		.pipe(cached('build'))
		.pipe(rollup({
			format: 'umd',
			moduleId: 'Escaper',
			moduleName: 'Escaper',
			plugins: [babel()]
		}))

		.on('error', error(cb))
		.pipe(replace(headRgxp, ''))
		.pipe(header(fullHead))
		.pipe(wrap('<%= contents %>\n\n'))
		.pipe(gulp.dest('./dist'))
		.on('end', cb);
});

gulp.task('bump', (cb) => {
	gulp.src('./*.json')
		.pipe(bump({version: getVersion()}))
		.pipe(gulp.dest('./'))
		.on('end', cb);
});

gulp.task('npmignore', (cb) => {
	gulp.src('./.npmignore')
		.pipe(replace(/([\s\S]*?)(?=# NPM ignore list)/, `${fs.readFileSync('./.gitignore')}\n`))
		.pipe(gulp.dest('./'))
		.on('end', cb);
});

gulp.task('predefs', (cb) => {
	async.parallel([
		(cb) => {
			download([
				'https://raw.githubusercontent.com/google/closure-compiler/master/contrib/externs/jasmine.js'
			])
				.on('error', error(cb))
				.pipe(gulp.dest('./predefs/src/ws'))
				.on('end', function () {
					gulp.src('./predefs/src/index.js')
						.pipe(monic())
						.on('error', error(cb))
						.pipe(gulp.dest('./predefs/build'))
						.on('end', cb);
				});
		},

		(cb) => {
			run('bower install').exec()
				.on('error', error(cb))
				.on('finish', cb);
		}

	], cb);
});

function compile(cb) {
	gulp.src('./dist/escaper.js')
		.pipe(cached('compile'))
		.pipe(gcc({
			fileName: 'escaper.min.js',
			compilerPath: './bower_components/closure-compiler/compiler.jar',
			continueWithWarnings: true,
			compilerFlags: {
				compilation_level: 'ADVANCED',
				use_types_for_optimization: null,

				language_in: 'ES6',
				language_out: 'ES5',

				externs: [
					'./predefs/build/index.js'
				],

				jscomp_off: [
					'nonStandardJsDocs'
				],

				jscomp_warning: [
					'invalidCasts',
					'accessControls',
					'checkDebuggerStatement',
					'checkRegExp',
					'checkTypes',
					'const',
					'constantProperty',
					'deprecated',
					'externsValidation',
					'missingProperties',
					'visibility',
					'missingReturn',
					'duplicate',
					'internetExplorerChecks',
					'suspiciousCode',
					'uselessCode',
					'misplacedTypeAnnotation',
					'typeInvalidation'
				]
			}
		}))

		.on('error', error(cb))
		.pipe(wrap('(function(){\'use strict\';<%= contents %>}).call(this);\n\n'))
		.pipe(header(`/*! Escaper v${getVersion()} | https://github.com/kobezzza/Escaper/blob/master/LICENSE */\n`))
		.pipe(gulp.dest('./dist'))
		.on('end', cb);
}

gulp.task('compile', ['predefs', 'build'], compile);
gulp.task('fast-compile', ['build'], compile);
gulp.task('full-build', ['compile'], test);

function test(cb) {
	gulp.src('./dist/escaper.min.js')
		.pipe(istanbul())
		.pipe(istanbul.hookRequire())
		.on('finish', () => {
			gulp.src('./spec/index_spec.js')
				.pipe(jasmine())
				.on('error', error(cb))
				.pipe(istanbul.writeReports())
				.on('end', cb);
		});
}

gulp.task('test-dev', ['fast-compile'], test);
gulp.task('test', test);
gulp.task('yaspeller', (cb) => {
	run('yaspeller ./').exec()
		.on('error', error(cb))
		.on('finish', cb);
});

gulp.task('watch', ['default'], () => {
	function unbind(name) {
		return (e) => {
			if (e.type === 'deleted') {
				delete cached.caches[name][e.path];
			}
		};
	}

	async.whilst(
		() =>
			readyToWatcher === false,

		(cb) =>
			setTimeout(cb, 500),

		() => {
			gulp.watch('./src/escaper.js', ['test-dev', 'bump']).on('change', unbind('build'));
			gulp.watch('./spec/*.js', ['test']);
			gulp.watch('./*.md', ['yaspeller']);
			gulp.watch('./.gitignore', ['npmignore']);
		}

	);
});

gulp.task('default', ['copyright', 'head', 'full-build', 'bump', 'yaspeller', 'npmignore']);
