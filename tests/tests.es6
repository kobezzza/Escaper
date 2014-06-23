describe('Escaper', () => {
	it('экранирование строк вида " ... "', () => {
		var str = Escaper.replace('Привет "друг\\\""!');

		expect(str)
			.toBe('Привет __ESCAPER_QUOT__0_!');

		expect(Escaper.paste(str))
			.toBe('Привет "друг\\\""!');

		var stack = [];
		var str2 = Escaper.replace('Привет "друг\\\""!', false, stack);

		expect(str2)
			.toBe('Привет __ESCAPER_QUOT__0_!');

		expect(Escaper.paste(str2, stack))
			.toBe('Привет "друг\\\""!');
	});

	it("экранирование строк вида ' ... '", () => {
		var str = Escaper.replace("Привет 'друг\\\''!");

		expect(str)
			.toBe('Привет __ESCAPER_QUOT__1_!');

		expect(Escaper.paste(str))
			.toBe("Привет 'друг\\\''!");

		var stack = [];
		var str2 = Escaper.replace("Привет 'друг\\\''!", false, stack);

		expect(str2)
			.toBe('Привет __ESCAPER_QUOT__0_!');

		expect(Escaper.paste(str2, stack))
			.toBe("Привет 'друг\\\''!");
	});

	it('экранирование строк вида ` ... `', () => {
		var stack = [];
		var str = Escaper.replace('Привет `друг`!', false, stack);

		expect(str)
			.toBe('Привет __ESCAPER_QUOT__0_!');

		expect(Escaper.paste(str, stack))
			.toBe("Привет `друг`!");

		var str2 = Escaper.replace('Привет `друг${1 + {foo: {}} + `foo` + /1/}`!', false, stack);

		expect(str2)
			.toBe('Привет __ESCAPER_QUOT__1_1 + {foo: {}} + __ESCAPER_QUOT__2_ + __ESCAPER_QUOT__3___ESCAPER_QUOT__4_!');

		expect(Escaper.paste(str2, stack))
			.toBe("Привет `друг${1 + {foo: {}} + `foo` + /1/}`!");

		var str3 = Escaper.replace('Привет `друг\\${foo}`!', false, stack);

		expect(str3)
			.toBe('Привет __ESCAPER_QUOT__5_!');

		expect(Escaper.paste(str3, stack))
			.toBe('Привет `друг\\${foo}`!');

		var str4 = Escaper.replace('Привет `друг${foo/* fooo */}`!', true, stack);

		expect(str4)
			.toBe('Привет __ESCAPER_QUOT__6_foo__ESCAPER_QUOT__7___ESCAPER_QUOT__8_!');

		expect(Escaper.paste(str4, stack))
			.toBe('Привет `друг${foo/* fooo */}`!');
	});

	it("экранирование регулярных выражений", () => {
		var stack = [];
		var str = Escaper.replace("Привет + /друг\\//gmi!", false, stack);

		expect(str)
			.toBe('Привет + __ESCAPER_QUOT__0_!');

		expect(Escaper.paste(str, stack))
			.toBe('Привет + /друг\\//gmi!');

		var str2 = Escaper.replace("Привет, /друг\\/[//.]/gmi!", false, stack);

		expect(str2)
			.toBe('Привет, __ESCAPER_QUOT__1_!');

		expect(Escaper.paste(str2, stack))
			.toBe('Привет, /друг\\/[//.]/gmi!');

		var str3 = Escaper.replace('/друг\\/[//.]/gmi!, /друг\\/[//.]/gmi', false, stack);

		expect(str3)
			.toBe('__ESCAPER_QUOT__2_!, __ESCAPER_QUOT__3_');

		expect(Escaper.paste(str3, stack))
			.toBe('/друг\\/[//.]/gmi!, /друг\\/[//.]/gmi');
	});

	it("экранирование однострочного комментария", () => {
		var stack = [];
		var str = Escaper.replace(
			`Привет // это комментарий
			Друг!`, true, stack);

		expect(str)
			.toBe('Привет __ESCAPER_QUOT__0_\n\t\t\tДруг!');

		expect(Escaper.paste(str, stack))
			.toBe('Привет // это комментарий\n\t\t\tДруг!');
	});

	it("экранирование многострочного комментария", () => {
		var stack = [];
		var str = Escaper.replace('Привет /* это комментарий */ Друг!', true, stack);

		expect(str)
			.toBe('Привет __ESCAPER_QUOT__0_ Друг!');

		expect(Escaper.paste(str, stack))
			.toBe('Привет /* это комментарий */ Друг!');
	});

	it("экранирование в фильтрах Snakeskin", () => {
		var stack = [];
		var str = Escaper.replace('foo|replace /hello/g|join "world"', true, stack, true);

		expect(str)
			.toBe('foo|replace __ESCAPER_QUOT__0_|join __ESCAPER_QUOT__1_');

		expect(Escaper.paste(str, stack))
			.toBe('foo|replace /hello/g|join "world"');
	});
});