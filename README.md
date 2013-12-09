#Escaper
##Synopsis

    var str = '"foo" 1 /foo/ 2 /* 1 */ 3';
    var content = [];

    str = Escaper.replace(str, true, content);

    console.log(str); // '__ESCAPER_QUOT__0_ 1 __ESCAPER_QUOT__1_ 2 __ESCAPER_QUOT__2_ 3'
    console.log(Escaper.paste(str, content)); // '"foo" 1 /foo/ 2 /* 1 */ 3'
