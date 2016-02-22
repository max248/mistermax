window.addEventListener("load",function(){
	document.getElementById("source").innerHTML="   print(\"Hello, world\")\nlet people = [\"Anna\": 67, \"Beto\": 8, \"Jack\": 33, \"Sam\": 25]\nfor (name, age) in people {\n    print(\"\\\(name) is \\(age) years old.\")\n}";

	document.getElementById("startBtn").addEventListener("click",function(event)
	{
		console.log("Translator - Start");
		//Транслятор
		var source = document.getElementById("source").value.split('\n');
		var translator = new Translator(source);

		// Вывод...
		document.getElementById("output").innerHTML=translator.source;

		var errorsStr = document.getElementById("errors");
		//...Таблица ошибок
		errorsStr.innerHTML="";
		for (var i=0;i<translator.Errors.length;i++){
			errorsStr.innerHTML+="<tr><td>Error: "+translator.Errors[i][1]+"  -line: "+ translator.Errors[i][2]+" index: "+translator.Errors[i][3]+"</td></tr>";
		}
		for(var i = 0; i<translator.SyntaxErrors.length;i++) {
            errorsStr.innerHTML += "<tr><td>Error: "+translator.SyntaxErrors[i][0]+"</td></tr>";
        }
        //...Таблица лексем
		var lexemsTable = document.getElementById("lexemsTable");
		lexemsTable.innerHTML = "";
		for(var i = 0; i<translator.Lexems.length;i++) {
            lexemsTable.innerHTML += "<tr><td>"+translator.Lexems[i][0]+"</td><td>"+translator.Lexems[i][1]+'.'+translator.Lexems[i][2]+"</td><td>"+translator.Lexems[i][3]+"</td></tr>";

        }

        //..Таблица синтаксических правил
        var parseTreeTable = document.getElementById("parseTreeTable");
        parseTreeTable.innerHTML = "";
        var str = "";
        for(var i = 0; i<translator.Rules.length;i++) {
            str = "";
            for(var j = 0;j<translator.Rules[i].length;j++) {
                str += translator.Rules[i][j] + ' ';
            }
            parseTreeTable.innerHTML += "<tr><td>" + str + "</td></tr>";
        }
	});

});



String.prototype.isNumber=function(){
	var match = this.match(/[0-9]/gi);
	if (match) {
		return this.length != 0 && match.length == this.length;
	}
	return false;
};

String.prototype.isApostrophe=function(){
	var match = this.match(/["]/g);
	if (match){
		return this.length != 0 && match.length == this.length;
	}
	return false;
};

// Метод проверяющий, состоит ли строка из латинских букв
String.prototype.isLetter = function () {
    var match = this.match(/[A-Z]/gi);
    if (match) {
        return this.length != 0 && match.length == this.length;
    }
    return false;
};

String.prototype.contains = function (str) {
    return this.indexOf(str) != -1;
};

// Метод String возвращающий кол-во символов
String.prototype.count = function (symbol) {
    return (this.match(new RegExp('['+symbol+']',"g")) || []).length;
};

// Проверяем, есть ли такой item в массиве
Array.prototype.itemExists = function (item){
    for(var i = 0; i<this.length;i++) {
        if(this[i] == item) {
            return true;
        }
    }
    return false;
};

// Очищение массива
Array.prototype.clear = function () {
    this.splice(0,this.length);
};
