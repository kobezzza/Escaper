var gulp = require('gulp');
var es6 = require('gulp-es6-transpiler'),
	concat = require('gulp-concat'),
	bump = require('gulp-bump');

gulp.task('es6-transpiler', function () {
	gulp.src('./lib/*.js')
		.pipe(concat('escaper.js'))
		.pipe(es6({disallowUnknownReferences: false}))
		.pipe(gulp.dest('./build/'));
});

gulp.task('bump', function () {
	delete require.cache[require.resolve('./build/escaper')];
	var v = require('./build/escaper').VERSION.join('.');

	gulp.src('./*.json')
		.pipe(bump({version: v}))
		.pipe(gulp.dest('./'));
});

gulp.task('watch', function () {
	gulp.watch('./lib/*.js', ['es6-transpiler', 'bump']);
});

gulp.task('default', ['es6-transpiler', 'bump', 'watch']);
