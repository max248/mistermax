/*
 * Created by Dmitry on 25.09.2015.
 */

// Лексический анализатор
Translator.prototype.Lexer = function () {

    /*
     * Методы Lexer'а
     */
    // Разбор целой константы
    this.parseNumber = function(index){
        var lexem = '';                                     // Получаемая лексема
        var symbol = this.source[this.strIndex][index];     // Обрабатываемый символ
        var firstEntry = index;                             // Индекс первого вхождения

        // Получаем лексему целиком
        do {
            lexem += symbol;
            index++;
            symbol = this.source[this.strIndex][index];
        } while(index<this.source[this.strIndex].length && (symbol.isNumber() || (symbol == '.' && lexem.count('.') != 1)));

        // Добавляем полученную лексему в массивы
        var item = [lexem, (lexem.count('.'))? 52:50, 0, this.strIndex, firstEntry];
        this.Lexems.push(item);
        this.Numbers.push(item);

        return index-1;
    };

    // Разбор строковой константы
    this.parseStr = function(index) {
        var lexem = '';                                             // Получаемая лексема
        var startSymbol = this.source[this.strIndex][index++];      // Начальный символ
        var symbol = this.source[this.strIndex][index];             // Обрабатываемый символ
        var firstEntry = index;                                     // Первое вхождение лексемы

        if(symbol) {    // Если символ не нулевой
            // Получаем полную лексему
            while (index < this.source[this.strIndex].length && (!symbol.isApostrophe() || this.source[this.strIndex][index-1] == '\\')) {
                lexem += symbol;
                index++;
                symbol = this.source[this.strIndex][index];
            }
            // Проверяем, закрыта ли строковая константа
            if (symbol == startSymbol) {    // Если да, то добавляем в массив
                var item = [lexem, 51, 0, this.strIndex, firstEntry];
                this.Lexems.push(item);
                this.Strings.push(item);
            } else {    // Если нет, то сообщаем об ошибке
                var item = [lexem, "quotes are not closed", this.strIndex, firstEntry];
                this.Errors.push(item);
            }
        }

        return index;
    };

    // Разбор идентификаторов
    this.parseIdnt = function(index) {
        var lexem = '';                                     // Получаемая лексема
        var symbol = this.source[this.strIndex][index];     // Обрабатываемый символ
        var firstEntry = index;                             // Первое вхождение лексемы

        // Получем полную лексему
        do {
            lexem += symbol;
            index++;
            symbol = this.source[this.strIndex][index];
        } while(index<this.source[this.strIndex].length && (symbol.isLetter() || symbol.isNumber() || (symbol == '.' && lexem.count('.') != 1)));

        // Проверяем является ли лексема ключевым словом
        for(var i = 0;i<this.keywords.length;i++) {
            if(this.keywords[i][0] == lexem) {
                if(this.keywords[i][1]>19) {
                    var item = [lexem, 53, ((this.keywords[i][1]==20)? 1 : 0), this.strIndex, firstEntry];
                    this.Booleans.push(item);
                    this.Lexems.push(item);
                } else {
                    var item = [lexem, this.keywords[i][1], 0, this.strIndex, firstEntry];
                    this.Lexems.push(item);
                }
                return index-1;
            }
        }
        // Если лексема не ключевое слово, то идентификатор
        if(lexem.count('.') == 0) {
            var item = [lexem, 40, 0, this.strIndex, firstEntry];
            this.Lexems.push(item);
            this.Identifiers.push(item);
        } else {
            this.Errors.push([lexem,'incorrect characters in the declaration of identifier',this.strIndex,firstEntry]);
        }
        return index-1;
    };

    // Разбор символа
    this.parseSymbol = function(index) {
        var symbol = this.source[this.strIndex][index];     // Обрабатываемый символ
        var firstEntry = index;                             // Первое вхождение символа

        // Проверяем, корректный ли символ
        for(var i = 0;i<this.symbols.length;i++) {
            if(this.symbols[i][0] == symbol+this.source[this.strIndex][index+1]) {
                var item = [symbol+this.source[this.strIndex][index+1], this.symbols[i][1], this.symbols[i][2], this.strIndex, firstEntry];
                this.Lexems.push(item);
                return index+1;
            } else if(this.symbols[i][0] == symbol) {
                var item = [symbol, this.symbols[i][1], this.symbols[i][2], this.strIndex, firstEntry];
                this.Lexems.push(item);
                return index;
            }
        }

        // Если символ не корректный, то сообщаем об ошибке
        var item = [symbol, "illegal symbol", this.strIndex, firstEntry];
        this.Errors.push(item);

        return index;
    };

    /*
     * Конструктор Lexer'а
     */
    // Проверяем, не пустой ли исходный код получили мы
    if(!this.source || this.source.length == 0) {
        return;
    }

    // Посимвольный разбор исходного кода
    for(this.strIndex = 0;this.strIndex<this.source.length;this.strIndex++) {
        for (var index = 0; index < this.source[this.strIndex].length; index++) {
            var symbol = this.source[this.strIndex][index];

            if (symbol != ' ' && symbol != '\r' && symbol != '\t') {
                if (symbol.isNumber()) {    // Если число
                    index = this.parseNumber(index);
                } else if (symbol.isApostrophe()) {   // Если апостроф(начало строки)
                    index = this.parseStr(index);
                } else // Если идентфикаторы и символы
                if (symbol.isLetter() || symbol == "_") {   // Если идентификатор
                    index = this.parseIdnt(index);
                } else {    // Если не буква
                    index = this.parseSymbol(index);
                }
            }
        }
    }
};