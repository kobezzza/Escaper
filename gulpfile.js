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
	plumber = require('gulp-plumber'),
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

const
	headRgxp = /(\/\*![\s\S]*?\*\/\n{2})/;

let
	readyToWatcher = null;

gulp.task('copyright', (cb) => {
	gulp.src('./LICENSE')
		.pipe(replace(/(Copyright \(c\) )(\d+)-?(\d*)/, (str, intro, from, to) => {
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

	gulp.src(['./@(src|spec)/*.js', './@(externs|gulpfile).js', './escaper.d.ts', './predefs/src/index.js'], {base: './'})
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
		.pipe(plumber())
		.pipe(cached('build'))
		.pipe(rollup({
			input: './src/escaper.js',
			format: 'umd',
			amd: {id: 'Escaper'},
			name: 'Escaper',
			exports: 'named',
			plugins: [babel()]
		}))

		.pipe(replace(headRgxp, ''))
		.pipe(header(fullHead))
		.pipe(eol('\n'))
		.pipe(gulp.dest('./dist'))
		.on('end', cb);
});

gulp.task('bump', (cb) => {
	const
		bump = require('gulp-bump');

	gulp.src('./@(package-lock|package|bower).json')
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
				.pipe(plumber())
				.pipe(gulp.dest('./predefs/src/ws'))
				.on('end', buildPredefs);

			function buildPredefs() {
				gulp.src('./predefs/src/index.js')
					.pipe(plumber())
					.pipe(monic())
					.pipe(gulp.dest('./predefs/build'))
					.on('end', cb);
			}
		},

		(cb) => {
			run('bower install').exec()
				.pipe(plumber())
				.on('finish', cb);
		}

	], cb);
});

function compile(cb) {
	const
		glob = require('glob'),
		wrap = require('gulp-wrap'),
		gcc = require('gulp-closure-compiler'),
		config = require('./gcc.json');

	gulp.src('./dist/escaper.js')
		.pipe(plumber())
		.pipe(cached('compile'))
		.pipe(gcc(Object.assign(config, {compilerPath: glob.sync(config.compilerPath)})))
		.pipe(replace(/^\/\*[\s\S]*?\*\//, ''))
		.pipe(wrap('(function(){\'use strict\';<%= contents %>}).call(this);'))
		.pipe(header(`/*! Escaper v${getVersion()} | https://github.com/kobezzza/Escaper/blob/master/LICENSE */\n`))
		.pipe(eol('\n'))
		.pipe(gulp.dest('./dist'))
		.on('end', cb);
}

gulp.task('compile', ['predefs', 'build'], compile);
gulp.task('fastCompile', ['build'], compile);
gulp.task('fullBuild', ['compile'], test);

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
			.pipe(plumber())
			.pipe(jasmine())
			.pipe(istanbul.writeReports())
			.on('end', cb);
	}
}

gulp.task('testDev', ['fastCompile'], test);
gulp.task('test', test);
gulp.task('yaspeller', (cb) => {
	run('yaspeller ./').exec()
		.pipe(plumber())
		.on('finish', cb);
});

gulp.task('watch', ['default'], () => {
	async.whilst(
		() =>
			readyToWatcher === false,

		(cb) =>
			setTimeout(cb, 500),

		() => {
			gulp.watch('./src/escaper.js', ['testDev', 'bump']).on('change', unbind('build'));
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

gulp.task('default', ['copyright', 'head', 'fullBuild', 'bump', 'yaspeller', 'npmignore']);
