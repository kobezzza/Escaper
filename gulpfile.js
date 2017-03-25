'use strict';

/* eslint-disable eqeqeq, prefer-template */

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
	async = require('async');

const
	header = require('gulp-header'),
	replace = require('gulp-replace'),
	cached = require('gulp-cached'),
	eol = require('gulp-eol'),
	run = require('gulp-run');

function getVersion() {
	const file = fs.readFileSync('./src/escaper.js');
	return /VERSION\s*(?::|=)\s*\[(\d+,\s*\d+,\s*\d+)]/.exec(file)[1]
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
			return intro + from + (to || from !== year ? `-${year}` : '');
		}))

		.pipe(gulp.dest('./'))
		.on('end', cb);
});

gulp.task('head', (cb) => {
	readyToWatcher = false;

	const
		through = require('through2'),
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
	const
		rollup = require('gulp-rollup'),
		babel = require('rollup-plugin-babel');

	const fullHead =
		getHead(true) +
		' *\n' +
		` * Date: ${new Date().toUTCString()}\n` +
		' */\n\n';

	gulp.src('./src/escaper.js')
		.pipe(cached('build'))
		.pipe(rollup({
			entry: './src/escaper.js',
			format: 'umd',
			moduleId: 'Escaper',
			moduleName: 'Escaper',
			plugins: [babel()]
		}))

		.on('error', error(cb))
		.pipe(replace(headRgxp, ''))
		.pipe(header(fullHead))
		.pipe(eol('\n'))
		.pipe(gulp.dest('./dist'))
		.on('end', cb);
});

gulp.task('bump', (cb) => {
	const
		bump = require('gulp-bump');

	gulp.src('./@(package|bower).json')
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
	const
		download = require('gulp-download'),
		monic = require('gulp-monic');

	async.parallel([
		(cb) => {
			download([
				'https://raw.githubusercontent.com/google/closure-compiler/master/contrib/externs/jasmine.js'
			])
				.on('error', error(cb))
				.pipe(gulp.dest('./predefs/src/ws'))
				.on('end', buildPredefs);

			function buildPredefs() {
				gulp.src('./predefs/src/index.js')
					.pipe(monic())
					.on('error', error(cb))
					.pipe(gulp.dest('./predefs/build'))
					.on('end', cb);
			}
		},

		(cb) => {
			run('bower install').exec()
				.on('error', error(cb))
				.on('finish', cb);
		}

	], cb);
});

function compile(cb) {
	const
		wrap = require('gulp-wrap'),
		gcc = require('gulp-closure-compiler');

	gulp.src('./dist/escaper.js')
		.pipe(cached('compile'))
		.pipe(gcc(require('./gcc.json')))
		.on('error', error(cb))
		.pipe(wrap('(function(){\'use strict\';<%= contents %>}).call(this);'))
		.pipe(header(`/*! Escaper v${getVersion()} | https://github.com/kobezzza/Escaper/blob/master/LICENSE */\n`))
		.pipe(eol('\n'))
		.pipe(gulp.dest('./dist'))
		.on('end', cb);
}

gulp.task('compile', ['predefs', 'build'], compile);
gulp.task('fast-compile', ['build'], compile);
gulp.task('full-build', ['compile'], test);

function test(cb) {
	const
		jasmine = require('gulp-jasmine'),
		istanbul = require('gulp-istanbul');

	gulp.src('./dist/escaper.min.js')
		.pipe(istanbul())
		.pipe(istanbul.hookRequire())
		.on('finish', runTests);

	function runTests() {
		gulp.src('./spec/index_spec.js')
			.pipe(jasmine())
			.on('error', error(cb))
			.pipe(istanbul.writeReports())
			.on('end', cb);
	}
}

gulp.task('test-dev', ['fast-compile'], test);
gulp.task('test', test);
gulp.task('yaspeller', (cb) => {
	run('yaspeller ./').exec()
		.on('error', error(cb))
		.on('finish', cb);
});

gulp.task('watch', ['default'], () => {
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

	function unbind(name) {
		return (e) => {
			if (e.type === 'deleted') {
				delete cached.caches[name][e.path];
			}
		};
	}
});

gulp.task('default', ['copyright', 'head', 'full-build', 'bump', 'yaspeller', 'npmignore']);
