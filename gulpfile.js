var gulp = require('gulp');
var to5 = require('gulp-6to5'),
	monic = require('gulp-monic'),
	wrap = require('gulp-wrap'),
	bump = require('gulp-bump'),
	gcc = require('gulp-closure-compiler'),
	header = require('gulp-header'),
	replace = require('gulp-replace'),
	download = require('gulp-download'),
	istanbul = require('gulp-istanbul'),
	jasmine = require('gulp-jasmine'),
	run = require('gulp-run'),
	eol = require('gulp-eol');

function getVersion() {
	delete require.cache[require.resolve('./dist/escaper')];
	return require('./dist/escaper').VERSION.join('.');
}

gulp.task('yaspeller', function () {
	run('node node_modules/yaspeller/bin/yaspeller ./').exec();
});

gulp.task('build', function (callback) {
	var fullHead =
		'/*!\n' +
		' * Escaper v' + getVersion() + '\n' +
		' * https://github.com/kobezzza/Escaper\n' +
		' *\n' +
		' * Released under the MIT license\n' +
		' * https://github.com/kobezzza/Escaper/blob/master/LICENSE\n' +
		' *\n' +
		' * Date: ' + new Date().toUTCString() + '\n' +
		' */\n\n';

	gulp.src('./lib/escaper.js')
		.pipe(monic())
		.pipe(to5({
			blacklist: [
				'minification.propertyLiterals',
				'minification.memberExpressionLiterals',
				'useStrict'
			],

			optional: [
				'spec.undefinedToVoid'
			]
		}))

		.pipe(wrap(
			'(function () {' +
				'\n' +
				'\'use strict\';' +
				'\n' +
				'var self = this;' +
				'\n' +
				'<%= contents %>' +
				'\n' +
			'}).call(new Function(\'return this\')());'
		))

		.pipe(header(fullHead))
		.pipe(eol())
		.pipe(gulp.dest('./dist/'))
		.on('end', callback);
});

gulp.task('bump', ['build'], function () {
	gulp.src('./*.json')
		.pipe(bump({version: getVersion()}))
		.pipe(eol())
		.pipe(gulp.dest('./'));
});

gulp.task('predefs', ['build'], function (callback) {
	download([
		'https://raw.githubusercontent.com/google/closure-compiler/master/contrib/externs/jasmine.js'
	])
		.pipe(eol())
		.pipe(gulp.dest('./predefs/src/ws'))
		.on('end', function () {
			gulp.src('./predefs/src/index.js')
				.pipe(monic())
				.pipe(gulp.dest('./predefs/build'))
				.on('end', callback);
		});
});

gulp.task('compile', ['predefs'], function (callback) {
	gulp.src(['./dist/escaper.js'])
		.pipe(gcc({
			compilerPath: './bower_components/closure-compiler/compiler.jar',
			fileName: 'escaper.min.js',

			compilerFlags: {
				compilation_level: 'ADVANCED_OPTIMIZATIONS',
				use_types_for_optimization: null,

				language_in: 'ES5',
				externs: [
					'./predefs/build/index.js'
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
				],

				jscomp_off: [
					'nonStandardJsDocs'
				]
			}
		}))

		.pipe(header('/*! Escaper v' + getVersion() + ' | https://github.com/kobezzza/Escaper/blob/master/LICENSE */\n'))
		.pipe(replace(/\(function\(.*?\)\{/, '$&\'use strict\';'))
		.pipe(eol())
		.pipe(gulp.dest('./dist'))
		.on('end', callback);
});

function test(callback) {
	gulp.src('./dist/escaper.min.js')
		.pipe(istanbul())
		.pipe(istanbul.hookRequire())
		.on('finish', function () {
			gulp.src('./test/index_spec.js')
				.pipe(jasmine())
				.pipe(istanbul.writeReports())
				.on('end', callback);
		});
}

gulp.task('test-dev', ['compile'], test);
gulp.task('test', test);

gulp.task('watch', function () {
	gulp.watch('./lib/*.js', ['build']);
	gulp.watch('./lib/escaper.js', ['bump']);
});

gulp.task('default', ['test-dev', 'bump']);
