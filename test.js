
var lexem = {
	"identation":{
		"regex":"(\s*)",
		"skip": true
	},
	"keywords":{
		"regex": "\b([a-z]{2,})\b",
		"list": {
			"let_lex": "let",
			"var_lex": "var",
			"protocol_lex": "protocol",
			"struct_lex": "struct",
			"func_lex": "func",
			"float_lex": "float",
			"string_lex": "string",
			"double_lex": "double",
			"int_lex": "int",
			"if_lex" : "if",
			"switch_lex": "switch",
			"for_lex": "for",
			"while_lex": "while",
			"repeat_lex": "repeat",
			"case_lex": "case",
			"override_lex": "override",
			"willset_lex": "willset",
			"didSet_lex": "didSet",
			"set_lex": "set",
			"enum_lex": "enum",
			"extension_lex": "extension"
		}
	},
	"ident": {
		"regex": "\b([_a-zA-Z]\w*)\b",
		"link":"arrayOfIdent"
	},
	"digit_const":{
		"regex":"\b(\d+)\b",
		"link":"arrayOfConst"
	},
	"string_const": {
		"regex": "\"(.*)\"",
		"link": "arrayOfConst"
	},
	"one_line_comment":{
		"regex": "\/\/(.*)$",
		"skip": true
	},
	"multi_line_comment":{
		"regex": "\/\*([\s\S]*?)\*\/",
		"skip": true
	},
	"operators": {
		"regex":"([-=+\*\/&\|!>:<]{1,2})",
		"list":{
			"and": "&&",
			"or": "||",
			"greater_or_eq": ">=",
			"less_or_eq": "<=",
			"not_equal" :"!=",
			"assing": ":=",
			"plus": "+",
			"minus": "-",
			"mult":"*",
			"div": "/",
			"equal": "=",
			"greater": ">",
			"less": "<",
			"not":"!"
		}
	},
	"separators":{
		"regex": "([[\])(:,;.]{1})",
		"list": {
			"open_parentheses" : "(",
			"close_parentheses": ")",
			"open_bracket": "[",
			"close_bracket": "]",
			"semicolon": ";",
			"colon": ":",
			"comma": ",",
			"point":","
		}
	}
};
var lexemStr = JSON.stringify(lexem);
lexem = JSON.parse(lexemStr);
str = "var a,b,c:integer;";
arrayOfIdent = [];
