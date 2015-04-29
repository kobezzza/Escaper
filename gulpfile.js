var
	gulp = require('gulp'),
	path = require('path'),
	fs = require('fs'),
	async = require('async');

var
	babel = require('gulp-babel'),
	monic = require('gulp-monic'),
	bump = require('gulp-bump'),
	gcc = require('gulp-closure-compiler'),
	header = require('gulp-header'),
	replace = require('gulp-replace'),
	changed = require('gulp-changed'),
	download = require('gulp-download'),
	istanbul = require('gulp-istanbul'),
	jasmine = require('gulp-jasmine');

function getVersion() {
	var file = fs.readFileSync(path.join(__dirname, 'lib/escaper.js'));
	return /VERSION\s*(?::|=)\s*\[(\d+,\s*\d+,\s*\d+)]/.exec(file)[1]
		.split(/\s*,\s*/)
		.join('.');
}

function getHead(opt_version) {
	return '' +
		'/*!\n' +
		' * Escaper' + (opt_version ? ' v' + getVersion() : '') + '\n' +
		' * https://github.com/kobezzza/Escaper\n' +
		' *\n' +
		' * Released under the MIT license\n' +
		' * https://github.com/kobezzza/Escaper/blob/master/LICENSE\n';
}

var
	headRgxp = /\/\*![\s\S]*?\*\/\n{2}/;

gulp.task('copyright', function () {
	gulp.src('./LICENSE')
		.pipe(replace(/(Copyright \(c\) )(\d+)-?(\d*)/, function (sstr, intro, from, to) {
			var year = new Date().getFullYear();
			return intro + from + (to || from != year ? '-' + year : '');
		}))

		.pipe(gulp.dest('./'));
});

gulp.task('head', function (cb) {
	var fullHead =
		getHead() +
		' */\n\n';

	async.parallel([
		function (cb) {
			var dest = './lib';
			gulp.src('./lib/*.js')
				.pipe(changed(dest))
				.pipe(replace(headRgxp, ''))
				.pipe(header(fullHead))
				.pipe(gulp.dest(dest))
				.on('end', cb);
		},

		function (cb) {
			var dest = './';
			gulp.src('./externs.js')
				.pipe(changed(dest))
				.pipe(replace(headRgxp, ''))
				.pipe(header(fullHead))
				.pipe(gulp.dest(dest))
				.on('end', cb);
		},

		function (cb) {
			gulp.src('./predefs/src/index.js')
				.pipe(replace(headRgxp, ''))
				.pipe(header(fullHead))
				.pipe(gulp.dest('./predefs/src'))
				.on('end', cb);
		}
	], cb);
});

gulp.task('build', function (cb) {
	var dest = './dist';
	var fullHead =
		getHead(true) +
		' *\n' +
		' * Date: ' + new Date().toUTCString() + '\n' +
		' */\n\n';

	gulp.src('./lib/escaper.js')
		.pipe(changed(dest))
		.pipe(babel({
			compact: false,
			auxiliaryComment: 'istanbul ignore next',

			modules: 'umd',
			moduleId: 'Escaper',

			loose: 'all',
			blacklist: [
				'es3.propertyLiterals',
				'es3.memberExpressionLiterals'
			],

			optional: [
				'spec.undefinedToVoid'
			]
		}))

		.pipe(header(fullHead))
		.pipe(gulp.dest(dest))
		.on('end', cb);
});

gulp.task('bump', ['build'], function () {
	gulp.src('./*.json')
		.pipe(bump({version: getVersion()}))
		.pipe(gulp.dest('./'));
});

gulp.task('predefs', function (cb) {
	download([
		'https://raw.githubusercontent.com/google/closure-compiler/master/contrib/externs/jasmine.js'
	])
		.pipe(gulp.dest('./predefs/src/ws'))
		.on('end', function () {
			gulp.src('./predefs/src/index.js')
				.pipe(monic())
				.pipe(gulp.dest('./predefs/build'))
				.on('end', cb);
		});
});

gulp.task('compile', ['predefs', 'build'], function (cb) {
	gulp.src('./dist/escaper.js')
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

		.pipe(header('/*! Escaper v' + getVersion() + ' | https://github.com/kobezzza/Escaper/blob/master/LICENSE */\n'))
		.pipe(gulp.dest('./dist'))
		.on('end', cb);
});

function test(cb) {
	gulp.src('./dist/escaper.min.js')
		.pipe(istanbul())
		.pipe(istanbul.hookRequire())
		.on('finish', function () {
			gulp.src('./spec/index_spec.js')
				.pipe(jasmine())
				.pipe(istanbul.writeReports())
				.on('end', cb);
		});
}

gulp.task('test-dev', ['compile'], test);
gulp.task('test', test);

gulp.task('watch', function () {
	gulp.watch('./lib/*.js', ['build']);
	gulp.watch('./lib/escaper.js', ['head', 'bump']);
});

gulp.task('default', ['copyright', 'head', 'test-dev', 'bump']);
