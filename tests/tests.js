describe('Escaper', function()  {
	it('экранирование строк вида " ... "', function()  {
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

	it("экранирование строк вида ' ... '", function()  {
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

	it('экранирование строк вида ` ... `', function()  {
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

	it("экранирование регулярных выражений", function()  {
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

	it("экранирование однострочного комментария", function()  {
		var stack = [];
		var str = Escaper.replace(
			("Привет // это комментарий\
\n			Друг!"), true, stack);

		expect(str)
			.toBe('Привет __ESCAPER_QUOT__0_\n\t\t\tДруг!');

		expect(Escaper.paste(str, stack))
			.toBe('Привет // это комментарий\n\t\t\tДруг!');
	});

	it("экранирование многострочного комментария", function()  {
		var stack = [];
		var str = Escaper.replace('Привет /*/ это комментарий */ Друг!', true, stack);

		expect(str)
			.toBe('Привет __ESCAPER_QUOT__0_ Друг!');

		expect(Escaper.paste(str, stack))
			.toBe('Привет /*/ это комментарий */ Друг!');
	});

	it("экранирование в фильтрах Snakeskin", function()  {
		var stack = [];
		var str = Escaper.replace('foo|replace /hello/g|join "world"', true, stack, true);

		expect(str)
			.toBe('foo|replace __ESCAPER_QUOT__0_|join __ESCAPER_QUOT__1_');

		expect(Escaper.paste(str, stack))
			.toBe('foo|replace /hello/g|join "world"');
	});

	it("настраиваемое экранирование", function()  {
		var stack = [];
		var str = Escaper.replace('"Привет" /* это комментарий */ + /Друг/gim /** foo */!', {'"': true, '/': true, '/*': true}, stack);

		expect(str)
			.toBe('__ESCAPER_QUOT__0_ __ESCAPER_QUOT__1_ + __ESCAPER_QUOT__2_ /** foo */!');

		expect(Escaper.paste(str, stack))
			.toBe('"Привет" /* это комментарий */ + /Друг/gim /** foo */!');
	});

	it("настраиваемое экранирование с вложенными литералами", function()  {
		var stack = [];
		var str = Escaper.replace('"Привет" /** "foo" */', {'"': true}, stack);

		expect(str)
			.toBe('__ESCAPER_QUOT__0_ /** "foo" */');

		expect(Escaper.paste(str, stack))
			.toBe('"Привет" /** "foo" */');
	});

	it("настраиваемое экранирование c флагом @all", function()  {
		var stack = [];
		var str = Escaper.replace('"Привет" /* это комментарий */ + /Друг/gim /** foo */!', {'@all': true, '/*': -1}, stack);

		expect(str)
			.toBe('__ESCAPER_QUOT__0_  + __ESCAPER_QUOT__1_ __ESCAPER_QUOT__2_!');

		expect(Escaper.paste(str, stack))
			.toBe('"Привет"  + /Друг/gim /** foo */!');
	});

	it("настраиваемое экранирование c флагом @comments", function()  {
		var stack = [];
		var str = Escaper.replace('"Привет" /* это комментарий */ + /Друг/gim /** foo */!', {'@comments': -1}, stack);

		expect(str)
			.toBe('"Привет"  + /Друг/gim !');

		expect(Escaper.paste(str, stack))
			.toBe('"Привет"  + /Друг/gim !');
	});

	it("настраиваемое экранирование c флагом @comments, @literals и @all", function()  {
		var stack = [];
		var str = Escaper.replace('"Привет" /* это комментарий */ + /Друг/gim /** foo */!', {'@all': -1, '@comments': false, '@literals': true}, stack);

		expect(str)
			.toBe('__ESCAPER_QUOT__0_ /* это комментарий */ + __ESCAPER_QUOT__1_ /** foo */!');

		expect(Escaper.paste(str, stack))
			.toBe('"Привет" /* это комментарий */ + /Друг/gim /** foo */!');
	});

	it("дополнительная проверка регулярных выражений", function()  {
		var stack = [];
		var str = Escaper.replace('2 >> /foo/ < /bar/ ^ /car/ [/bar/] foo typeof /mu/ /mu/', true, stack);

		expect(str)
			.toBe('2 >> __ESCAPER_QUOT__0_ < __ESCAPER_QUOT__1_ ^ __ESCAPER_QUOT__2_ [__ESCAPER_QUOT__3_] foo typeof __ESCAPER_QUOT__4_ /mu/');

		expect(Escaper.paste(str, stack))
			.toBe('2 >> /foo/ < /bar/ ^ /car/ [/bar/] foo typeof /mu/ /mu/');
	});
});
