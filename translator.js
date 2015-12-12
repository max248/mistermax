/*
* My firstly translator in Javascript
* Created by Yuldoshev on 26.11.2015
*/
// Транслятор
function Translator(source){
	// список переменных
	this.source = source;		// Транслируемый язык
	this.strIndex = 0;			// Массив текущей строки
	this.Lexemes = [];			// Массив лексем
	this.Identifiers = [];		// Массив идентификаторов
	this.String = [];			// Массив строк 
	this.Numbers = [];			// Массив чисел
	this.Booleans = [];			// Массив логических выражений
	this.Errors = [];			// Массив ошибок 
	this.keywords = null;  		// Таблица ключевых слов

	var stringKeywords = "[[\"let\",1],[\"var\",2],[\"protocol\",3],[\"struct\",4],[\"func\",5]]";

	this.symbols = null;  // Таблица символов

	var stringSymbols = "[[\"!=\",27,0],[\"==\",27,1],[\"<\",27,2],[\">\",27,3],[\"<=\",27,4],[\">=\",27,5]]";

	
	
}