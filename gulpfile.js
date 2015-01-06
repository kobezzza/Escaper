var gulp = require('gulp');
var es6 = require('gulp-es6-transpiler'),
	concat = require('gulp-concat'),
	wrap = require('gulp-wrap'),
	bump = require('gulp-bump'),
	gcc = require('gulp-closure-compiler'),
	header = require('gulp-header'),
	istanbul = require('gulp-istanbul'),
	jasmine = require('gulp-jasmine'),
	eol = require('gulp-eol');

function getVersion() {
	delete require.cache[require.resolve('./dist/escaper')];
	return require('./dist/escaper').VERSION.join('.');
}

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

	gulp.src('./lib/*.js')
		.pipe(concat('escaper.js'))
		.pipe(es6({
			disallowDuplicated: false,
			disallowUnknownReferences: false
		}))

		.pipe(wrap(
			'(function (global) {' +
				'\'use strict\';' +
				'<%= contents %>' +
			'})(new Function(\'return this\')());'
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

gulp.task('compile', ['build'], function (callback) {
	gulp.src(['./dist/escaper.js'])
		.pipe(gcc({
			compilerPath: './bower_components/closure-compiler/compiler.jar',
			fileName: 'escaper.min.js',

			compilerFlags: {
				output_wrapper: '(function () { %output%; }).call(this);',

				compilation_level: 'ADVANCED_OPTIMIZATIONS',
				use_types_for_optimization: null,

				language_in: 'ES5_STRICT',
				externs: [
					'./node_modules/closurecompiler-externs/buffer.js',
					'./node_modules/closurecompiler-externs/events.js',
					'./node_modules/closurecompiler-externs/stream.js',
					'./node_modules/closurecompiler-externs/process.js',
					'./node_modules/closurecompiler-externs/core.js',
					'./externs.js'
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
					'visibility'
				]
			}
		}))

		.pipe(header('/*! Escaper v' + getVersion() + ' | https://github.com/kobezzza/Escaper/blob/master/LICENSE */\n'))
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
