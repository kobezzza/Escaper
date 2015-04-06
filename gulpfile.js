var
	gulp = require('gulp'),
	path = require('path'),
	fs = require('fs');

var
	to5 = require('gulp-babel'),
	monic = require('gulp-monic'),
	bump = require('gulp-bump'),
	gcc = require('gulp-closure-compiler'),
	header = require('gulp-header'),
	download = require('gulp-download'),
	istanbul = require('gulp-istanbul'),
	jasmine = require('gulp-jasmine');

function getVersion() {
	var file = fs.readFileSync(path.join(__dirname, 'lib/escaper.js'));
	return /VERSION\s*(?::|=)\s*\[(\d+,\s*\d+,\s*\d+)]/.exec(file)[1]
		.split(/\s*,\s*/)
		.join('.');
}

var map = {
	jscs: 'https://raw.githubusercontent.com/kobezzza/project-settings/master/.jscsrc',
	gitignore: 'https://raw.githubusercontent.com/kobezzza/project-settings/master/.gitignore',
	gitattributes: 'https://raw.githubusercontent.com/kobezzza/project-settings/master/.gitattributes',
	editorconfig: 'https://raw.githubusercontent.com/kobezzza/project-settings/master/.editorconfig'
};

for (var key in map) {
	if (!map.hasOwnProperty(key)) {
		continue;
	}

	(function (key, url) {
		gulp.task('get-settings:' + key, ['build'], function () {
			download([url]).pipe(gulp.dest('./'));
		});
	})(key, map[key]);
}

gulp.task('get-settings', ['build'], function () {
	download(
		Object.keys(map).map(function (key) {
			return map[key]
		}
	)).pipe(gulp.dest('./'));
});

gulp.task('build', function (cb) {
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
		.pipe(to5({
			compact: false,
			highlightCode: false,
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
		.pipe(gulp.dest('./dist/'))
		.on('end', cb);
});

gulp.task('bump', ['build'], function () {
	gulp.src('./*.json')
		.pipe(bump({version: getVersion()}))
		.pipe(gulp.dest('./'));
});

gulp.task('predefs', ['build'], function (cb) {
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

function compile(opt_dev) {
	return function (cb) {
		var params = {
			compilerPath: './bower_components/closure-compiler/compiler.jar',
			fileName: 'escaper.min.js',

			compilerFlags: {
				compilation_level: 'ADVANCED_OPTIMIZATIONS',
				use_types_for_optimization: null,

				language_in: 'ES5',
				externs: [
					'./predefs/build/index.js'
				],

				jscomp_off: [
					'nonStandardJsDocs'
				]
			}
		};

		if (opt_dev) {
			params.jscomp_warning = [
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
			];
		}

		gulp.src(['./dist/escaper.js'])
			.pipe(gcc(params))
			.pipe(header('/*! Escaper v' + getVersion() + ' | https://github.com/kobezzza/Escaper/blob/master/LICENSE */\n'))
			.pipe(gulp.dest('./dist'))
			.on('end', cb);
	};
}

gulp.task('compile', ['predefs'], compile());
gulp.task('compile-dev', ['predefs'], compile(true));

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
	gulp.watch('./lib/escaper.js', ['bump']);
	gulp.watch('./*.md', ['typograf']);
});

gulp.task('default', ['test-dev', 'bump']);
