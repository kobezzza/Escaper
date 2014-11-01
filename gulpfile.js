var gulp = require('gulp');
var es6 = require('gulp-es6-transpiler'),
	concat = require('gulp-concat'),
	bump = require('gulp-bump'),
	istanbul = require('gulp-istanbul'),
	jasmine = require('gulp-jasmine');

gulp.task('build', function (callback) {
	gulp.src('./lib/*.js')
		.pipe(concat('escaper.js'))
		.pipe(es6({disallowUnknownReferences: false}))
		.pipe(gulp.dest('./dist/'))
		.on('end', callback);
});

gulp.task('bump', ['build'], function () {
	delete require.cache[require.resolve('./dist/escaper')];
	var v = require('./dist/escaper').VERSION.join('.');

	gulp.src('./*.json')
		.pipe(bump({version: v}))
		.pipe(gulp.dest('./'));
});

gulp.task('test', ['build'], function (callback) {
	gulp.src('./dist/escaper.js')
		.pipe(istanbul())
		.on('finish', function () {
			gulp.src('./test/index_spec.js')
				.pipe(jasmine())
				.pipe(istanbul.writeReports())
				.on('end', callback);
		});
});

gulp.task('watch', function () {
	gulp.watch('./lib/*.js', ['bump']);
});

gulp.task('default', ['test', 'bump']);
