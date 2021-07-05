/*!
 * Escaper
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 */

describe('Escaper', () => {
	[["'", 'strings'], ['"', 'strings'], ['`', 'strings'], ['/', 'literals']].forEach(([literal, group]) => {
		genLiteralTest(literal, group);
	});

	it('replaces a template string', () => {
		const
			content = [],
			src = 'Hello `world${1 + {foo: {/* comment */}} + `foo` + /1/}`!',
			res = Escaper.replace(src, content);

		expect(res).toBe('Hello __ESCAPER_QUOT__0_1 + {foo: {__ESCAPER_QUOT__1_}} + __ESCAPER_QUOT__2_ + __ESCAPER_QUOT__3___ESCAPER_QUOT__4_!');
		expect(Escaper.paste(res, content)).toBe(src);
	});

	it('cuts a template string', () => {
		const
			content = [],
			src = 'Hello `world${1 + {foo: {/* comment */}} + `foo` + /1/}`!',
			res = Escaper.replace(src, {strings: -1}, content);

		expect(res).toBe('Hello 1 + {foo: {__ESCAPER_QUOT__0_}} +  + __ESCAPER_QUOT__1_!');
		expect(content.length).toBe(2);
		expect(Escaper.paste(res, content)).toBe('Hello 1 + {foo: {/* comment */}} +  + /1/!');
	});

	it('replaces an escaped template string', () => {
		const
			content = [],
			src = 'Hello `world\\${foo}`!',
			res = Escaper.replace(src, content);

		expect(res).toBe('Hello __ESCAPER_QUOT__0_!');
		expect(Escaper.paste(res, content)).toBe(src);
	});

	it('replaces a deep template string interpolation', () => {
		const
			content = [],
			src = '`${`${foo}`}`;};bar,() => `${bla}`',
			res = Escaper.replace(src, content);

		expect(res).toBe('__ESCAPER_QUOT__0___ESCAPER_QUOT__1_foo__ESCAPER_QUOT__2___ESCAPER_QUOT__3_;};bar,() => __ESCAPER_QUOT__4_bla__ESCAPER_QUOT__5_');
		expect(Escaper.paste(res, content)).toBe(src);
	});

	it('replaces a regular expression', () => {
		const
			content = [],
			src = 'Hello, /world\\/[//.]/gmi!',
			res = Escaper.replace(src, content);

		expect(res).toBe('Hello, __ESCAPER_QUOT__0_!');
		expect(Escaper.paste(res, content)).toBe(src);
	});

	it('replaces a multiple regular expression', () => {
		const
			content = [],
			src = '/bla\\/[//.]/gmi!, /bla\\/[//.]/gmi!',
			res = Escaper.replace(src, content);

		expect(res).toBe('__ESCAPER_QUOT__0_!, __ESCAPER_QUOT__1_!');
		expect(Escaper.paste(res, content)).toBe(src);
	});

	it('replaces an advanced regular expression', () => {
		const
			content = [],
			src = '2 >> /foo/ < /bar/ ^ /car/ [/bar/] foo typeof /mu/ /mu/',
			res = Escaper.replace(src, content);

		expect(res).toBe('2 >> __ESCAPER_QUOT__0_ < __ESCAPER_QUOT__1_ ^ __ESCAPER_QUOT__2_ [__ESCAPER_QUOT__3_] foo typeof __ESCAPER_QUOT__4_ /mu/');
		expect(Escaper.paste(res, content)).toBe(src);
	});

	it('cuts an advanced regular expression', () => {
		const
			content = [],
			src = '2 >> /foo/ < /bar/ ^ /car/ [/bar/] foo typeof /mu/ /mu/',
			res = Escaper.replace(src, -1, content),
			expected = '2 >>  <  ^  [] foo typeof  /mu/';

		expect(res).toBe(expected);
		expect(Escaper.paste(res, content)).toBe(expected);
	});

	it('replaces a single-line comment', () => {
		const
			content = [],
			src = 'Hello // foo\nworld!',
			res = Escaper.replace(src, content);

		expect(res).toBe('Hello __ESCAPER_QUOT__0_\nworld!');
		expect(Escaper.paste(res, content)).toBe(src);
	});

	it('replaces a custom single-line comment', () => {
		const
			content = [],
			src = 'Hello // foo //! baz\n//! bar\nworld!',
			res = Escaper.replace(src, ['//!'], content);

		expect(res).toBe('Hello // foo //! baz\n__ESCAPER_QUOT__0_\nworld!');
		expect(Escaper.paste(res, content)).toBe(src);
	});

	it('replaces a multiline comment', () => {
		const
			content = [],
			src = 'Hello /*/ the comment *\\/*/ world!',
			res = Escaper.replace(src, content);

		expect(res).toBe('Hello __ESCAPER_QUOT__0_ world!');
		expect(Escaper.paste(res, content)).toBe(src);
	});

	it('replaces a filter', () => {
		const
			content = [],
			src = 'foo|replace /hello/g|join "world"',
			res = Escaper.replace(src, {filters: true}, content);

		expect(res).toBe('foo|replace __ESCAPER_QUOT__0_|join __ESCAPER_QUOT__1_');
		expect(Escaper.paste(res, content)).toBe(src);
	});

	it('replaces with a custom parameters', () => {
		const
			content = [],
			src = 'Hello \'funny\' and /*! amazing */ "world"/*bar*//***/',
			res = Escaper.replace(src, {"'": -1, strings: true, comments: ['/*'], '/**': false}, content);

		expect(res).toBe('Hello  and /*! amazing */ __ESCAPER_QUOT__0___ESCAPER_QUOT__1_/***/');
		expect(Escaper.paste(res, content)).toBe('Hello  and /*! amazing */ "world"/*bar*//***/');
	});

	it('replaces with a custom label', () => {
		const
			content = [],
			src = 'Hello "world" and "friends"',
			res = Escaper.replace(src, {label: '__LABEL__${pos}_'}, content);

		expect(res).toBe('Hello __LABEL__0_ and __LABEL__1_');
		expect(Escaper.paste(res, content, /__LABEL__(\d+)_/g)).toBe(src);
	});

	it('replaces with a static cache', () => {
		const
			src1 = 'Hello "world" and "friends"',
			res1 = Escaper.replace(src1);

		expect(res1).toBe('Hello __ESCAPER_QUOT__0_ and __ESCAPER_QUOT__1_');
		expect(Escaper.paste(res1)).toBe(src1);

		const
			src2 = 'Hello "world" + /friends/',
			res2 = Escaper.replace(src2, ['"', '/']);

		expect(res2).toBe('Hello __ESCAPER_QUOT__2_ + __ESCAPER_QUOT__3_');
		expect(Escaper.paste(res2)).toBe(src2);
	});

	function genLiteralTest(literal, group) {
		const
			src = ['hello + /* ', ' bla ', ' */ ', 'world\\' + literal, '! // baz'].join(literal);

		{
			const
				expected = 'hello + __ESCAPER_QUOT__0_ __ESCAPER_QUOT__1_! __ESCAPER_QUOT__2_';

			it(`replaces <${literal}>`, () => {
				const
					content = [],
					res = Escaper.replace(src, content);

				expect(res).toBe(expected);
				expect(Escaper.paste(res, content)).toBe(src);
			});

			it(`replaces <${literal}> with \`{[literal]: true}\``, () => {
				const
					content = [],
					res = Escaper.replace(src, {[literal]: true}, content);

				expect(res).toBe(expected);
				expect(Escaper.paste(res, content)).toBe(src);
			});

			if (group) {
				it(`replaces <${literal}> with \`{[group]: true}\``, () => {
					const
						content = [],
						res = Escaper.replace(src, {[group]: true}, content);

					expect(res).toBe(expected);
					expect(Escaper.paste(res, content)).toBe(src);
				});

				it(`replaces <${literal}> with \`{[group]: [literal]}\``, () => {
					const
						content = [],
						res = Escaper.replace(src, {[group]: [literal]}, content);

					expect(res).toBe(expected);
					expect(Escaper.paste(res, content)).toBe(src);
				});

				it(`replaces <${literal}> with \`{[group]: {[literal]: true}}\``, () => {
					const
						content = [],
						res = Escaper.replace(src, {[group]: {[literal]: true}}, content);

					expect(res).toBe(expected);
					expect(Escaper.paste(res, content)).toBe(src);
				});
			}
		}

		{
			const
				expectedReplace = 'hello + __ESCAPER_QUOT__0_ ! __ESCAPER_QUOT__1_',
				expectedPaste = ['hello + /* ', ' bla ', ' */ ! // baz'].join(literal);

			it(`cuts <${literal}>`, () => {
				const
					expected = 'hello +  ! ',
					content = [],
					res = Escaper.replace(src, -1, content);

				expect(res).toBe(expected);
				expect(content.length).toBe(0);
				expect(Escaper.paste(res, content)).toBe(expected);
			});

			it(`cuts <${literal}> with \`{[literal]: -1}\``, () => {
				const
					content = [],
					res = Escaper.replace(src, {[literal]: -1}, content);

				expect(res).toBe(expectedReplace);
				expect(content.length).toBe(2);
				expect(Escaper.paste(res, content)).toBe(expectedPaste);
			});

			if (group) {
				it(`cuts <${literal}> with \`{[group]: -1}\``, () => {
					const
						content = [],
						res = Escaper.replace(src, {[group]: -1}, content);

					expect(res).toBe(expectedReplace);
					expect(content.length).toBe(2);
					expect(Escaper.paste(res, content)).toBe(expectedPaste);
				});

				it(`cuts <${literal}> with \`{[group]: {[literal]: -1}}\``, () => {
					const
						content = [],
						res = Escaper.replace(src, {[group]: {[literal]: -1}}, content);

					expect(res).toBe(expectedReplace);
					expect(content.length).toBe(2);
					expect(Escaper.paste(res, content)).toBe(expectedPaste);
				});
			}
		}
	}
});
