var gulp = require('gulp'),
	es6 = require('gulp-es6-transpiler'),
	concat = require('gulp-concat');

gulp.task('es6-transpiler', function () {
	gulp.src('./lib/*.es6')
		.pipe(concat('escaper.js'))
		.pipe(es6({disallowUnknownReferences: false}))
		.pipe(gulp.dest('./build/'));
});

gulp.task('watch', function () {
	gulp.watch('./lib/*.es6', ['es6-transpiler']);
});

gulp.task('default', ['es6-transpiler', 'watch']);
