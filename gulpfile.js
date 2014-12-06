var gulp = require('gulp');
var to5 = require('gulp-6to5'),
	concat = require('gulp-concat'),
	wrap = require('gulp-wrap'),
	bump = require('gulp-bump'),
	istanbul = require('gulp-istanbul'),
	jasmine = require('gulp-jasmine');

gulp.task('build', function (callback) {
	gulp.src('./lib/*.js')
		.pipe(concat('escaper.js'))
		.pipe(to5({
			blacklist: ['_propertyLiterals']
		}))

		.pipe(wrap(
			'(function (global) {' +
				'<%= contents %>' +
			'})(new Function(\'return this\')());'
		))

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
