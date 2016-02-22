
function JSONParser (string) {
    var Lexems;
    var currentLexeme;

    this.parse = function () {
        return this.JSONValue();
    };
    

    /**
     * @return {Object}
     */
    this.JSONValue = function() {
        if(Lexems == null) return null;
        switch(Lexems[currentLexeme]["id"]) {
            case 0: return this.JSONObject();
            case 2: return this.JSONArray();
            case 6: currentLexeme++;
                return null;
            case 10: currentLexeme++;
                return Lexems[currentLexeme-1]["text"];
            case 11: currentLexeme++;
                return Lexems[currentLexeme-1]["text"].contains('.')? parseFloat(Lexems[currentLexeme-1]["text"]) : parseInt(Lexems[currentLexeme-1]["text"]);
            case 12: currentLexeme++;
                return Lexems[currentLexeme-1]["text"] == 'true';
            default: currentLexeme++;
                return null;
        }
    };

    /**
     * @return {Object}
     */
    this.JSONArray = function() {
        var resultArray = [];
        if(Lexems[currentLexeme]["id"] == 2) {
            do {
                currentLexeme++;
                resultArray.push(this.JSONValue());
            } while (Lexems[currentLexeme]["id"] == 5);
            if(Lexems[currentLexeme]["id"] != 3) {
                console.log("json array null");
                return null;
            }
        }
        currentLexeme++;
        return resultArray;
    };

    /**
     * @return {Object}
     */
    this.JSONObject = function() {
        var resultHash = {};
        var name;
        if(Lexems[currentLexeme]["id"] == 0) {
            do {
                currentLexeme++;
                if(Lexems[currentLexeme]["id"] == 10) {
                    name = Lexems[currentLexeme++]["text"];
                    if(Lexems[currentLexeme]["id"] == 4) {
                        currentLexeme++;
                        resultHash[name] = this.JSONValue();
                    }
                }
            } while (Lexems[currentLexeme]["id"] == 5);
            if(Lexems[currentLexeme]["id"] != 1) {
                console.log("json object null");
                return null;
            }
        }
        currentLexeme++;
        return resultHash;
    };

    /*
        Конструктор
     */

    Lexems = this.Lexer(string);
    currentLexeme = 0;

}


JSONParser.regulations = [
    {
        "name": "Открытие объектка",
        "regex": /^{/,
        "id": 0
    },
    {
        "name": "Закрытие объектка",
        "regex": /^}/,
        "id": 1
    },
    {
        "name": "Открытие массива",
        "regex": /^\[/,
        "id": 2
    },
    {
        "name": "Закрытие массива",
        "regex": /^\]/,
        "id": 3
    },
    {
        "name": "Разделитель между key и value",
        "regex": /^:/,
        "id": 4
    },
    {
        "name": "Символ перечисления объектов",
        "regex": /^,/,
        "id": 5
    },
    {
        "name": "Нулевое значение",
        "regex": /^null/,
        "id": 6
    },
    {
        "name": "Строка",
        "regex": /^\"(([^\"\\]|\\.|\\\\)*)\"/,
        "id": 10
    },
    {
        "name": "Число",
        "regex": /^((\d*\.\d+)|(\d+))([eE][-\+]?(\d+))?/,
        "id": 11
    },
    {
        "name": "Булевое значение",
        "regex": /^((true)|(false))/i,
        "id": 12
    }
];

JSONParser.prototype.Lexer = function (text) {
    text = text + "";
    var lexems = [];

    text.split('\n').forEach(function (text, index) {
        while (text.length != 0) {
            text = text.replace(/^(\s+)/, "");
            var currentRegulations = -1;
            var maxLength = 0;
            var currentLength;
            for (var regulationIndex = 0; regulationIndex < JSONParser.regulations.length; regulationIndex++) {
                if (JSONParser.regulations[regulationIndex].regex.test(text))
                    currentLength = JSONParser.regulations[regulationIndex].regex.exec(text)[0].length;
                else
                    currentLength = 0;
                if (currentLength > maxLength) {
                    maxLength = currentLength;
                    currentRegulations = regulationIndex;
                }
            }
            if (currentRegulations != -1) {
                lexems.push({
                    "name": JSONParser.regulations[currentRegulations].name,
                    "id":   JSONParser.regulations[currentRegulations].id,
                    "text": JSONParser.regulations[currentRegulations].regex.exec(text)[JSONParser.regulations[currentRegulations].id == 10? 1 : 0]
                });
                text = text.replace(JSONParser.regulations[currentRegulations].regex, "");
            } else if (text.length != 0) {
                console.log("Error in line", index + 1);
                return null;
            }
        }
    });

    return lexems;
};