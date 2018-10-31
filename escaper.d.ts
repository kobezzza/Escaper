/*!
 * Escaper
 * https://github.com/kobezzza/Escaper
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Escaper/blob/master/LICENSE
 */

/// <reference lib="es2015"/>

type EscaperSingleComments =
	'//' |
	'//*' |
	'//!' |
	'//#' |
	'//@' |
	'//$';

type EscaperMultComments =
	'/*' |
	'/**' |
	'/*!' |
	'/*#' |
	'/*@' |
	'/*$';

type EscaperStrings =
	"'" |
	'"' |
	'`';

type EscaperLiterals = '/';
type EscaperAll = EscaperSingleComments | EscaperMultComments | EscaperStrings | EscaperLiterals;
type EscaperReplaceVal<T extends string> = boolean | -1 | Record<T, boolean | -1> | T[];

type EscaperParams = {
	singleComments?: EscaperReplaceVal<EscaperSingleComments>;
	multComments?: EscaperReplaceVal<EscaperMultComments>;
	comments?: EscaperReplaceVal<EscaperSingleComments | EscaperMultComments>;
	strings?: EscaperReplaceVal<EscaperStrings>;
	literals?: EscaperReplaceVal<EscaperLiterals>;
	label?: string;
	filters?: boolean;
} & {[K in keyof EscaperAll]?: boolean | -1}

interface EscaperCache {
	get(key: string): string | undefined;
	set(key: string, value: string): EscaperCache;
}

declare const Escaper: {
	VERSION: (number | string)[];
	cache: Record<string, EscaperCache | Map<string, string>>;
	content: string[];
	symbols: RegExp;
	replace(str: string, content?: string[]);
	replace(str: string, params: EscaperParams | EscaperAll[] | -1, content?: string[]);
	paste(str: string, content?: string[], rgxp?: RegExp);
};

declare module 'escaper' {
	export = Escaper;
}
