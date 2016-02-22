/**
 * Created by Dmitry on 26.09.2015.
 */
// Синтаксический анализатор
Translator.prototype.Parser = function () {
    
    // Вывод основной информации
    this.Rules = [];
    this.SyntaxErrors = [];
    this.Source = "";
    
    // Локальная информация
    var Declare = [];
    var typeExp = 0;
    var TypeI = [];
    var TypeF = [];
    var TypeB = [];
    var TypeS = [];
    var fTypeI = [];
    var fTypeF = [];
    var fTypeB = [];
    var fTypeS = [];
    var Variables = [];
    var identifierInOperators = [];
    var namesFunction = [];
    var paramsInFunctions = [];
    var identifierInFunctions = [];
    
    // Счетчик
    var currentLexeme = 0;
    var currentRule = 0;
    var isFunc = false;

    /*
     * Методы Parser'а
     */
    /** Проверка граматики < программа >
     * @return {boolean}
     */
    this.Program = function () {
        if(this.Lexems.length == 0) {
            this.Rules.push('empty');
            return true;
        }

        this.Rules.push(['<программа>','=>','<блок функций>','<тело главной программы>']);
        currentRule = 0;
        var programRuleIndex = currentRule;
        if(this.functionBlock()) {
            this.Rules[programRuleIndex].push('<блок функций>');
        }
        if(this.mainProgram()) {
            this.Rules[programRuleIndex].push('<тело главной программы>');
            return true;
        }
        return false;
    };

    // Проверка граматики < тело главной программы >
    this.mainProgram = function () {
        if(this.Lexems[currentLexeme][0] == 'func' && this.Lexems[currentLexeme+1][0] == 'main' &&
           this.Lexems[currentLexeme+2][0] == '('  && this.Lexems[currentLexeme+3][0] == ')' &&
           this.Lexems[currentLexeme+4][0] == '{')
        {
            isFunc = false;
            Declare.clear();
            currentLexeme += 5;     // Пропускаем 5 обработанных лексем
            this.Rules.push(['<тело главной программы>','=>','func main(){','<блок переменных>','<последовательность операторов>','}']);
            currentRule++;
            var mainProgramRuleIndex = currentRule;
            this.Source += ('var\n');   // Pascal
            if(!this.variablesBlock()) {
                this.Rules[mainProgramRuleIndex].splice(3,1);
            }
            this.Source += ('begin\n');   // Pascal
            if(this.operatorSequence()) {
                if(this.Lexems[currentLexeme][0] == '}') {
                    this.Source += ('end.\n');   // Pascal
                    return true;
                } else {
                    this.SyntaxErrors.push(['function is not closed \'}\'']);
                }
            }
        } else {
            this.SyntaxErrors.push(['main function not found']);
        }
        return false;
    };

    // Проверка граматики < блок переменных >
    this.variablesBlock = function () {
        if(this.Lexems[currentLexeme][0] == 'var') {
            this.Rules.push(['<блок переменных>','=>','<объявление переменных>','<блок переменных>']);
            currentRule++;
            var varibleBlockRuleIndex = currentRule;
            if(this.variables()) {
                if(!this.variablesBlock()) {
                    this.Rules[varibleBlockRuleIndex].splice(3,1);
                }
                return true;
            }
        }
        return false;
    };

    // Проверка граматики < объявление переменных >
    this.variables = function () {
        if(this.Lexems[currentLexeme][0] == 'var') {
            currentLexeme++;
            this.Rules.push(['<объявление переменных>','=>','<список имен>','<тип>']);
            currentRule++;
            if(this.nameList()) {
                if(this.variableType()) {
                    this.Source += (';\n');   // Pascal
                    return true;
                }
            }
        }
        return false;
    };

    // Проверка граматики < список имен >
    this.nameList = function () {
        if(this.Lexems[currentLexeme][1] == 40) {
            this.Rules.push(['<список имен>','=>']);
            currentRule++;
            currentLexeme--;
            do {
                if(this.Lexems[currentLexeme][0] == ',')
                    this.Source += (', ');   // Pascal
                currentLexeme++;
                if(this.Lexems[currentLexeme][1] == 40) {
                    this.Source += (this.Lexems[currentLexeme][0]);   // Pascal
                    if(!Declare.itemExists(this.Lexems[currentLexeme][0])) {
                        this.Rules[currentRule].push('ид.');
                        Declare.push(this.Lexems[currentLexeme][0]);
                        Variables.push(this.Lexems[currentLexeme][0]);
                    } else {
                        this.SyntaxErrors.push([this.Lexems[currentLexeme][0]+' - variable declared earlier']);
                        return false;
                    }
                } else {
                    this.SyntaxErrors.push(['not declared identifier, after \',\'']);
                    return false;
                }
                currentLexeme++;
            } while(this.Lexems[currentLexeme][0] == ',');
        } else {
            this.SyntaxErrors.push(['not declared identifier']);
        }
        this.Source += (' :');   // Pascal
        return true;
    };

    // Проверка граматики < тип >
    this.variableType = function () {
        // Определяем тип переменной
        this.Rules.push(['<тип>','=>']);
        currentRule++;
        if(this.Lexems[currentLexeme][0] == '[') {
            if(this.Lexems[currentLexeme+1][1] == 50 && this.Lexems[currentLexeme+2][0] == ']') {
                this.Rules[currentRule].push('array');
                this.Rules[currentRule].push(this.Lexems[currentLexeme + 1][0]);
                this.Source += (' array[0..' + this.Lexems[currentLexeme + 1][0] + '] of'); // Pascal
                currentLexeme += 3;
            } else {
               this.SyntaxErrors.push(['incorrect array size']);
            }
        }
        identifierInFunctions = identifierInFunctions.concat(Variables);
        if (this.Lexems[currentLexeme][1] === 12) {
            this.Source += (' boolean'); // Pascal
            if(isFunc)
                fTypeB = fTypeB.concat(Variables);
            else
                TypeB = TypeB.concat(Variables);
            Variables.clear();
            this.Rules[currentRule].push(this.Lexems[currentLexeme++][0]);
            return true;
        } else if (this.Lexems[currentLexeme][1] === 13) {
            this.Source += (' integer'); // Pascal
            if(isFunc)
                fTypeI = fTypeI.concat(Variables);
            else
                TypeI = TypeI.concat(Variables);
            Variables.clear();
            this.Rules[currentRule].push(this.Lexems[currentLexeme++][0]);
            return true;
        } else if (this.Lexems[currentLexeme][1] === 14) {
            this.Source += (' real'); // Pascal
            if(isFunc)
                fTypeF = fTypeF.concat(Variables);
            else
                TypeF = TypeF.concat(Variables);
            Variables.clear();
            this.Rules[currentRule].push(this.Lexems[currentLexeme++][0]);
            return true;
        } else if (this.Lexems[currentLexeme][1] === 15) {
            this.Source += (' string'); // Pascal
            if(isFunc)
                fTypeS = fTypeS.concat(Variables);
            else
                TypeS = TypeS.concat(Variables);
            Variables.clear();
            this.Rules[currentRule].push(this.Lexems[currentLexeme++][0]);
            return true;
        } else {
            this.SyntaxErrors.push(['incorrectly declared variable type']);
        }
        return false;
    };

    // Проверка граматики < последовательность операторов >
    this.operatorSequence = function () {
        this.Rules.push(['<последовательность операторов>','=>','<оператор>','<другая последовательность операторов>']);
        currentRule++;
        var operatorSequenceRuleIndex = currentRule;

        if(this.operator()) {
            this.Source += (';\n'); // Pascal
            if(!this.operatorSequence()) {
                this.Rules[operatorSequenceRuleIndex].splice(3,1);
            }
            return true;
        } else {
            this.Rules.splice(operatorSequenceRuleIndex,1);
            currentRule--;
        }
        return false;
    };

    // Проверка граматики <вызов функции>
    this.callFunc = function () {
        this.Rules.push(['<вызов функции>', '=>', 'ид.']);
        currentRule++;
        var operatorRuleIndex = currentRule;
        this.Source += (this.Lexems[currentLexeme++][0]); // Pascal
        if(this.Lexems[currentLexeme][0] == '(') {
            this.Rules[operatorRuleIndex].push('(');
            this.Source += ('('); // Pascal
            currentLexeme++;
            if(this.Lexems[currentLexeme][0] != ')') {
                currentLexeme--;
                do {
                    if (this.Lexems[currentLexeme][0] == ',') {
                        this.Rules[operatorRuleIndex].push(',');
                        this.Source += (', '); // Pascal
                    }
                    currentLexeme++;
                    var type;
                    if (this.Lexems[currentLexeme][1] == 40)
                        type = variableType(this.Lexems[currentLexeme][0]);
                    else
                        type = this.Lexems[currentLexeme][1];
                    if (!this.expression(type)) {
                        return false;
                    }
                } while (this.Lexems[currentLexeme][0] == ',');
            }
            if(this.Lexems[currentLexeme][0] == ')') {
                currentLexeme++;
                this.Rules[operatorRuleIndex].push(')');
                this.Source += (')'); // Pascal
                return true;
            }
        }
        return false;
    };

    // Проверка граматики < оператор >
    this.operator = function () {
        /****************************************************
         *          Проверка ид.( < параметры > )
         ****************************************************/
        if(this.Lexems[currentLexeme][1] == 40 && namesFunction.itemExists(this.Lexems[currentLexeme][0])) {
            this.Rules.push(['<оператор>', '=>']);
            currentRule++;
            var operatorRuleIndex = currentRule;
            if (this.callFunc()) {
                this.Rules[operatorRuleIndex].push('<вызов функции>');
                return true;
            }
        }
        /****************************************************
         *          Проверка ид. = < выражение >
         ****************************************************/
        else if(this.Lexems[currentLexeme][1] == 40) {
            this.Rules.push(['<оператор>', '=>', 'ид.', '=', '<выражение>']);
            currentRule++;
            var operatorRuleIndex = currentRule;
            var identifier = this.Lexems[currentLexeme][0];
            var type = variableType(this.Lexems[currentLexeme++][0]);
            this.Source += (identifier); // Pascal
            identifierInOperators.push(identifier);
            this.appealArray(operatorRuleIndex);
            if (this.Lexems[currentLexeme][1] == 36) {
                this.Source += (' := '); // Pascal
                currentLexeme++;
                if (this.expression(type)) {
                    return true;
                }
            }
        }
        /****************************************************
         * Проверка if < условие > { < посл. операторов > }
         ****************************************************/
        else if (this.Lexems[currentLexeme][1] == 4) {
            this.Rules.push(['<оператор>', '=>', 'if']);
            currentRule++;
            currentLexeme++;
            var operatorRuleIndex = currentRule;
            this.Source += ('if '); // Pascal
            if(this.condition()) {
                this.Rules[operatorRuleIndex].push('<условие>');
                if(this.Lexems[currentLexeme][0] == '{') {
                    this.Source += (' then\nbegin\n'); // Pascal
                    this.Rules[operatorRuleIndex].push('{');
                    currentLexeme++;
                    if(this.operatorSequence()) {
                        this.Rules[operatorRuleIndex].push('<последовательность операторов>');
                        if(this.Lexems[currentLexeme][0] == '}') {
                            this.Rules[operatorRuleIndex].push('}');
                            this.Source += ('end'); // Pascal
                            currentLexeme++;
                        }
                        if (this.Lexems[currentLexeme][1] == 5) {
                            this.Source += ('\nelse\nbegin\n'); // Pascal
                            this.Rules[operatorRuleIndex].push('else');
                            currentLexeme++;
                            if(this.Lexems[currentLexeme][0] == '{') {
                                this.Rules[operatorRuleIndex].push('{');
                                currentLexeme++;
                                if (this.operatorSequence()) {
                                    this.Rules[operatorRuleIndex].push('<последовательность операторов>');
                                    if (this.Lexems[currentLexeme][0] == '}') {
                                        this.Rules[operatorRuleIndex].push('}');
                                        currentLexeme++;
                                        this.Source += ('end'); // Pascal
                                        return true;
                                    }
                                }
                            }
                        } else {
                            return true;
                        }
                        return false;
                    }
                }
            }
        }
        /****************************************************
         * Проверка for < условие > { < посл. операторов > }
         ****************************************************/
        else if (this.Lexems[currentLexeme][1] == 6) {
            this.Rules.push(['<оператор>', '=>', 'for']);
            this.Source += ('while '); // Pascal
            currentRule++;
            currentLexeme++;
            var operatorRuleIndex = currentRule;
            if(this.condition()) {
                this.Rules[operatorRuleIndex].push('<условие>');
                if(this.Lexems[currentLexeme][0] == '{') {
                    this.Source += (' do\nbegin\n'); // Pascal
                    this.Rules[operatorRuleIndex].push('{');
                    currentLexeme++;
                    if(this.operatorSequence()) {
                        this.Rules[operatorRuleIndex].push('<последовательность операторов>');
                        if(this.Lexems[currentLexeme][0] == '}') {
                            this.Rules[operatorRuleIndex].push('}');
                            this.Source += ('end'); // Pascal
                            currentLexeme++;
                            return true;
                        }
                    }
                }
            }
        }
        /****************************************************
         *          Проверка fmt.Print ( < выражение > )
         ****************************************************/
        else if (this.Lexems[currentLexeme][1] == 16) {
            this.Rules.push(['<оператор>', '=>', this.Lexems[currentLexeme][0]]);
            currentRule++;
            currentLexeme++;
            this.Source += ('writeln'); // Pascal
            var operatorRuleIndex = currentRule;
            if(this.Lexems[currentLexeme][0] == '(') {
                this.Rules[operatorRuleIndex].push('(');
                this.Source += ('('); // Pascal
                currentLexeme++;
                if(this.Lexems[currentLexeme][1] == 40 && namesFunction.itemExists(this.Lexems[currentLexeme][0])) {
                    if (this.callFunc()) {
                        this.Rules[operatorRuleIndex].push('<вызов функции>');
                    }
                } else {
                    var type;
                    if(this.Lexems[currentLexeme][1] == 40)
                        type = variableType(this.Lexems[currentLexeme][0]);
                    else
                        type = this.Lexems[currentLexeme][1];
                    if (this.expression(type)) {
                        this.Rules[operatorRuleIndex].push('<выражение>');
                    }
                }
                if (this.Lexems[currentLexeme][0] == ')') {
                    this.Source += (')'); // Pascal
                    this.Rules[operatorRuleIndex].push(')');
                    currentLexeme++;
                    return true;
                }
            }
        }
        /****************************************************
         *          Проверка fmt.Scan ( ид. )
         ****************************************************/
        else if (this.Lexems[currentLexeme][1] == 17) {
            this.Rules.push(['<оператор>', '=>', this.Lexems[currentLexeme][0]]);
            currentRule++;
            currentLexeme++;
            this.Source += ('readln'); // Pascal
            var operatorRuleIndex = currentRule;
            if(this.Lexems[currentLexeme][0] == '(') {
                this.Rules[operatorRuleIndex].push('(');
                this.Source += ('('); // Pascal
                currentLexeme++;
                if(this.Lexems[currentLexeme][1] == 38) {
                    this.Rules[operatorRuleIndex].push('&');
                    currentLexeme++;
                    if (this.Lexems[currentLexeme][1] == 40) {
                        this.Source += (this.Lexems[currentLexeme][0]); // Pascal
                        this.Rules[operatorRuleIndex].push('ид.');
                        identifierInOperators.push(this.Lexems[currentLexeme++][0]);
                        this.appealArray(operatorRuleIndex);
                        if (this.Lexems[currentLexeme][0] == ')') {
                            this.Source += (')'); // Pascal
                            this.Rules[operatorRuleIndex].push(')');
                            currentLexeme++;
                            return true;
                        }
                    }
                } else {
                    this.SyntaxErrors.push(['incorrect type in function fmt.Scan']);
                }
            }
        }
        /****************************************************
         *  Проверка { < последовательность операторов > }
         ****************************************************/
        else if (this.Lexems[currentLexeme][0] == '{') {
            this.Rules.push(['<оператор>', '=>', '{']);
            currentRule++;
            currentLexeme++;
            var operatorRuleIndex = currentRule;
            this.Source += ('begin\n'); // Pascal
            if(this.operatorSequence()) {
                this.Rules[operatorRuleIndex].push('<последовательность операторов>');
                if(this.Lexems[currentLexeme][0] == '}') {
                    this.Source += ('end'); // Pascal
                    this.Rules[operatorRuleIndex].push('}');
                    currentLexeme++;
                    return true;
                }
            }
        }
        return false;
    };

    // Определение типа по названию идентификатора
    var variableType = function (identifier) {
        if(isFunc) {
            if(fTypeB.itemExists(identifier)) {
                return 12;  // Если bool
            } else if (fTypeI.itemExists(identifier)) {
                return 13;  // Если int
            } else if (fTypeF.itemExists(identifier)) {
                return 14;  // Если float
            } else if (fTypeS.itemExists(identifier)) {
                return 15;  // Если string
            } else {
                return 0;
            }
        } else {
            if (TypeB.itemExists(identifier)) {
                return 12;  // Если bool
            } else if (TypeI.itemExists(identifier)) {
                return 13;  // Если int
            } else if (TypeF.itemExists(identifier)) {
                return 14;  // Если float
            } else if (TypeS.itemExists(identifier)) {
                return 15;  // Если string
            } else {
                return 0;
            }
        }
    };

    // Проверка граматики < выражение >
    this.expression = function (type) {
        if (type == 12 || type == 53) {
            this.Rules.push(['<выражение>','=>','<логическое выражение>']);
            currentRule++;
            return this.boolExpression();
        } else if (type == 13 || type == 14 || type == 18 || type == 19 || type == 50 || type == 52) {
            this.Rules.push(['<выражение>','=>','<численное выражение>']);
            currentRule++;
            return this.numExpression();
        } else if (type == 15 || type == 51) {
            this.Rules.push(['<выражение>','=>','<строковое выражение>']);
            currentRule++;
            return this.stringExpression();
        } else {
            this.SyntaxErrors.push(['incorrect type of expression']);
            return false;
        }
    };

    // Проверка граматики < численное выражение >
    this.numExpression = function () {
        this.Rules.push(['<численное выражение>','=>']);
        currentRule++;
        var numExpressionRuleIndex = currentRule;
        if(this.Lexems[currentLexeme][1] == 40 || this.Lexems[currentLexeme][1] == 50 || this.Lexems[currentLexeme][1] == 52 // идентификатор или целая константа
        || this.Lexems[currentLexeme][0] == '(') {
            this.Rules[numExpressionRuleIndex].push('<терм>');
            if (this.term()) {
                // Проверка на < терм > */% < числ. выражение >
                if (this.Lexems[currentLexeme][1] == 18 || this.Lexems[currentLexeme][1] == 19 || this.Lexems[currentLexeme][1] == 32) {
                    this.Source += (' ' + this.Lexems[currentLexeme][0] + ' '); // Pascal
                    this.Rules[numExpressionRuleIndex].push(this.Lexems[currentLexeme++][0], '<численное выражение>');
                    if (!this.numExpression()) {
                        this.SyntaxErrors.push(['no expression after the arithmetic operators']);
                    }
                }
            }
        } else if (this.Lexems[currentLexeme][1] == 18) {
            this.Source += ('Pow'); // Pascal
            this.Rules[numExpressionRuleIndex].push(this.Lexems[currentLexeme++][0]);
            if(this.Lexems[currentLexeme][0] == '(') {
                this.Source += ('('); // Pascal
                this.Rules[numExpressionRuleIndex].push('(', '<численное выражение>','');
                currentLexeme++;
                if(!this.numExpression()) {
                    this.SyntaxErrors.push(['no expression after the arithmetic operators']);
                }
                if(this.Lexems[currentLexeme++][0] == ',') {
                    this.Source += (', '); // Pascal
                    this.Rules[numExpressionRuleIndex].push(',', '<численное выражение>', ')');
                    if (!this.numExpression()) {
                        this.SyntaxErrors.push(['no expression after the arithmetic operators']);
                    }
                    if(this.Lexems[currentLexeme][0] != ')') {
                        this.SyntaxErrors(['no a close bracket after function math.Pow']);
                        return false;
                    }
                    this.Source += (')'); // Pascal
                } else {
                    this.SyntaxErrors.push(['math.Pow takes 2 arguments']);
                }
            }
        } else if (this.Lexems[currentLexeme][1] == 19) {
            this.Source += ('Sqrt'); // Pascal
            this.Rules[numExpressionRuleIndex].push(this.Lexems[currentLexeme++][0]);
            if(this.Lexems[currentLexeme][0] == '(') {
                this.Source += ('('); // Pascal
                currentLexeme++;
                this.Rules[numExpressionRuleIndex].push('(', '<численное выражение>',')');
                if(!this.numExpression()) {
                    this.SyntaxErrors.push(['no expression after the arithmetic operators']);
                }
                if(this.Lexems[currentLexeme++][0] != ')') {
                    this.SyntaxErrors(['no a close bracket after function math.Sqrt']);
                    return false;
                }
                this.Source += (')'); // Pascal
            } else {
                this.SyntaxErrors(['no a open bracket after function math.Sqrt']);
            }
        }

        return true;
    };

    // Проверка на < терм >
    this.term = function () {
        if(this.Lexems[currentLexeme][1] == 40 || this.Lexems[currentLexeme][1] == 50 || this.Lexems[currentLexeme][1] == 52 // идентификатор или целая константа
            || this.Lexems[currentLexeme][0] == '(')
        {
            this.Rules.push(['<терм>','=>']);
            currentRule++;
            var termRuleIndex = currentRule;
            if(this.Lexems[currentLexeme][1] == 40 || this.Lexems[currentLexeme][1] == 50 || this.Lexems[currentLexeme][1] == 52) {
                if(this.Lexems[currentLexeme][1] == 40 && namesFunction.itemExists(this.Lexems[currentLexeme][0])) {
                    if (this.callFunc()) {
                        this.Rules[termRuleIndex].push('<вызов функции>');
                        return true;
                    }
                } else {
                    this.Source += (this.Lexems[currentLexeme][0]); // Pascal
                    this.Rules[currentRule].push(this.Lexems[currentLexeme++][0]);
                    this.appealArray(termRuleIndex);
                }
            } else if(this.Lexems[currentLexeme][0] == '(') {
                this.Source += ('('); // Pascal
                this.Rules[currentRule].push('(', '<численное выражение>',')');
                currentLexeme++;
                if(this.numExpression()) {
                    if(this.Lexems[currentLexeme][0] == ')') {
                        this.Source += (')'); // Pascal
                        currentLexeme++;
                    } else {
                        this.Errors.push(['incorrect expression']);
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    };

    // Проверка граматики < логическое выражение >
    this.boolExpression = function () {
        this.Rules.push(['<логическое выражение>','=>']);
        currentRule++;
        var boolExpressionRuleIndex = currentRule;
        if(this.condition()) {
            this.Rules[boolExpressionRuleIndex].push('<условие>');
            return true;
        }
        return false;
    };

    // Проверка граматики < условие >
    this.condition = function () {
        this.Rules.push(['<условие>','=>']);
        currentRule++;
        var conditionRuleIndex = currentRule;
        if (this.Lexems[currentLexeme][1] == 33 && this.Lexems[currentLexeme][2] == 0) {
            currentLexeme++;
            this.Rules[conditionRuleIndex].push('!');
            this.Source += ('(not '); // Pascal
            if(this.condition()){
                this.Rules[conditionRuleIndex].push('<условие>');
                this.Source += (')'); // Pascal
                return true;
            } else {
                this.SyntaxErrors.push(['no condition operator after \'!\'']);
            }
        } else if (this.Lexems[currentLexeme][1] == 40  || this.Lexems[currentLexeme][1] == 50  || this.Lexems[currentLexeme][1] == 51
                || this.Lexems[currentLexeme][1] == 52 || this.Lexems[currentLexeme][1] == 53 || this.Lexems[currentLexeme][1] == 18  || this.Lexems[currentLexeme][1] == 19) {
            this.Source += ('('); // Pascal
            if(this.Lexems[currentLexeme][1] == 53) {
                if(this.Lexems[currentLexeme][0] == 'true')
                    this.Source += ('True'); // Pascal
                else
                    this.Source += ('False'); // Pascal
                this.Rules[conditionRuleIndex].push(this.Lexems[currentLexeme++][0]);
            } else if(variableType(this.Lexems[currentLexeme][0]) == 12) {
                this.Source += (this.Lexems[currentLexeme++][0]); // Pascal
                this.Rules[conditionRuleIndex].push("ид.");
            }else {
                this.Rules[conditionRuleIndex].push('<сравнение>');
                if (!this.comparison()) {
                    return false
                }
            }
            this.Source += (')'); // Pascal
            if(this.Lexems[currentLexeme][1] == 33) {
                this.Rules[conditionRuleIndex].push(this.Lexems[currentLexeme][0]);
                if(this.Lexems[currentLexeme][2] == 0) {
                    this.Source += ('not '); // Pascal
                } else if(this.Lexems[currentLexeme][2] == 1) {
                    this.Source += (' and '); // Pascal
                } else if(this.Lexems[currentLexeme][2] == 2) {
                    this.Source += (' or '); // Pascal
                }
                currentLexeme++;
                if(this.condition()) {
                    this.Rules[conditionRuleIndex].push('<условие>');
                    return true;
                }
            } else {
                return true;
            }
        }
        return false;
    };

    // Проверка граматики < сравнение >
    this.comparison = function () {
        this.Rules.push(['<сравнение>','=>', '<выражение>']);
        currentRule++;
        var comparisonRuleIndex = currentRule;
        var type;
        if(this.Lexems[currentLexeme][1] == 40) {
            type = variableType(this.Lexems[currentLexeme][0]);
        } else
            type = this.Lexems[currentLexeme][1];
        if(this.expression(type)) {
            if (this.Lexems[currentLexeme][1] == 31) {
                if(this.Lexems[currentLexeme][2] == 5) {
                    this.Source += (' <> '); // Pascal
                } else if(this.Lexems[currentLexeme][2] == 0) {
                    this.Source += (' = '); // Pascal
                } else {
                    this.Source += (' ' + this.Lexems[currentLexeme][0] + ' '); // Pascal
                }
                this.Rules[comparisonRuleIndex].push(this.Lexems[currentLexeme][0]);
                currentLexeme++;
                if(this.expression(type)) {
                    this.Rules[comparisonRuleIndex].push('<выражение>');
                    return true;
                }
            }
        }
        return false;
    };

    // Проверка граматики < строковое выражение >
    this.stringExpression = function () {
        this.Rules.push(['<строковое выражение>','=>']);
        currentRule++;
        var stringexpressionRuleIndex = currentRule;
        if(this.stringTerm()) {
            this.Rules[stringexpressionRuleIndex].push('<стр. терм>');
            if(this.Lexems[currentLexeme][0] == '+') {
                this.Source += (' + '); // Pascal
                currentLexeme++;
                this.Rules[stringexpressionRuleIndex].push('+');
                if(this.stringExpression()) {
                    this.Rules[stringexpressionRuleIndex].push('<строковое выражение>');
                    return true;
                }
            } else {
                return true;
            }
        }
        return false;
    };

    // Проверка граматики < стр. терм >
    this.stringTerm = function () {
        this.Rules.push(['<стр. терм>','=>']);
        currentRule++;
        var stringTermRuleIndex = currentRule;
        if(this.Lexems[currentLexeme][1] == 40) {
            if(namesFunction.itemExists(this.Lexems[currentLexeme][0])) {
                if (this.callFunc()) {
                    this.Rules[stringTermRuleIndex].push('<вызов функции>');
                    return true;
                }
            } else {
                this.Source += (this.Lexems[currentLexeme][0]); // Pascal
                identifierInOperators.push(this.Lexems[currentLexeme][0]);
                this.Rules[stringTermRuleIndex].push('ид.');
                currentLexeme++;
                this.appealArray(stringTermRuleIndex);
                return true;
            }
        } else if (this.Lexems[currentLexeme][1] == 51) {
            this.Source += ('\'' + this.Lexems[currentLexeme][0] + '\''); // Pascal
            this.Rules[stringTermRuleIndex].push(this.Lexems[currentLexeme][0]);
            currentLexeme++;
            return true;
        }
        return false;
    };

    // Проверка граматики [ < численное выражение > ]
    this.appealArray = function (currentRule) {
        if(this.Lexems[currentLexeme][0] == '[') {
            this.Source += (this.Lexems[currentLexeme++][0]); // Pascal
            this.Rules[currentRule].push('[');
            if(this.numExpression()) {
                this.Rules[currentRule].push('<численное выражение>');
                if(this.Lexems[currentLexeme][0] == ']') {
                    this.Source += (this.Lexems[currentLexeme][0]); // Pascal
                    this.Rules[currentRule].push(this.Lexems[currentLexeme++][0]);
                    return true;
                } else {
                    this.SyntaxErrors.push(['not closed reference to an array element']);
                }
            } else {
                this.SyntaxErrors.push(['WIP']);
            }
        }
        return false;
    };

    // Проверка граматики < блок функций >
    this.functionBlock = function () {
        if(this.Lexems[currentLexeme][0] == 'func' && this.Lexems[currentLexeme+1][0] != 'main') { // Если текущая лекссема - func и след. не main
            this.Rules.push(['<блок функций>','=>','<функция>']);
            currentRule++;
            var functionBlockRuleIndex = currentRule;
            if(this.function()) {
                this.Rules[functionBlockRuleIndex].push('<функция>');
                if(this.functionBlock()) {
                    this.Rules[functionBlockRuleIndex].push('<другой блок функций>');
                }
                return true;
            }
        }
        return false;
    };

    // Проверка граматики < функция >
    this.function = function () {
        this.Rules.push(['<функция>','=>']);
        currentRule++;
        var functionRuleIndex = currentRule;
        if(this.Lexems[currentLexeme][1] == 1) {
            isFunc = true;
            var returnTypeIndex = currentLexeme;
            while (this.Lexems[returnTypeIndex][0] != '{') returnTypeIndex++;
            returnTypeIndex--;
            if(this.Lexems[returnTypeIndex][1] > 11 && this.Lexems[returnTypeIndex][1] < 16) {
                this.Source += ('function ');   // Pascal
            } else {
                this.Source += ('procedure ');   // Pascal
            }
            this.Rules[functionRuleIndex].push('func');
            currentLexeme++;
            if(this.Lexems[currentLexeme][1] == 40) {
                this.Source += (this.Lexems[currentLexeme][0]);   // Pascal
                this.Rules[functionRuleIndex].push('ид.');
                namesFunction.push(this.Lexems[currentLexeme++][0]);
                if(this.Lexems[currentLexeme][0] == '(') {
                    this.Source += ('(');   // Pascal
                    this.Rules[functionRuleIndex].push('(');
                    currentLexeme++;
                    if(this.Lexems[currentLexeme][1] == 40) {
                        if (this.inputParam()) {
                            this.Rules[functionRuleIndex].push('<входные параметры>');
                        }
                    }
                    if(this.Lexems[currentLexeme][0] == ')') {
                        this.Source += (')');   // Pascal
                        this.Rules[functionRuleIndex].push(')');
                        currentLexeme++;
                        if(this.Lexems[currentLexeme][1] > 11 && this.Lexems[currentLexeme][1] < 16) {
                            var returnType = this.Lexems[currentLexeme][1];
                            this.Source += (' :');   // Pascal
                            if(this.variableType()) {
                                this.Rules[functionRuleIndex].push('<тип>');
                            }
                        }
                        if(this.Lexems[currentLexeme][0] == '{') {
                            if(this.Source[this.Source.length-2] != ';')
                                this.Source += (';\n');   // Pascal
                            this.Rules[functionRuleIndex].push('{');
                            this.Source += ('var\n');   // Pascal
                            currentLexeme++;
                            if(this.variablesBlock()) {
                                this.Rules[functionRuleIndex].push('<блок переменных>');
                            }
                            this.Source += ('begin\n');   // Pascal
                            if(this.operatorSequence()) {
                                this.Rules[functionRuleIndex].push('<последовательность операторов>');
                                if(this.Lexems[currentLexeme][1] == 3) {
                                    this.Source += (namesFunction[namesFunction.length-1] + ' := '); // Pascal
                                    this.Rules[functionRuleIndex].push('return');
                                    currentLexeme++;
                                    var type;
                                    if(this.Lexems[currentLexeme][1] == 40)
                                        type = variableType(this.Lexems[currentLexeme][0]);
                                    else
                                        type = this.Lexems[currentLexeme][1];
                                    if (this.expression(type)) {
                                        this.Source += (';\n'); // Pascal
                                        this.Rules[functionRuleIndex].push('<выражение>');
                                    }
                                }
                                if(this.Lexems[currentLexeme][0] == '}') {
                                    this.Source += ('end;\n\n');   // Pascal
                                    this.Rules[functionRuleIndex].push('}');
                                    currentLexeme++;
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    };

    // Проверка граматики < входные параметры >
    this.inputParam = function () {
        this.Rules.push(['<входные параметры>', '=>']);
        currentRule++;
        var inputParamRuleIndex = currentRule;
        if(this.Lexems[currentLexeme][1] == 40) {
            this.Source += (this.Lexems[currentLexeme][0] + ' :');   // Pascal
            this.Rules[inputParamRuleIndex].push('ид.');
            var param = this.Lexems[currentLexeme][0];
            paramsInFunctions.push(param);
            currentLexeme++;
            if(this.Lexems[currentLexeme][0] == '[') {
                if(this.Lexems[currentLexeme+3][1] == 12) {
                    fTypeB.push(param);
                } else if(this.Lexems[currentLexeme+3][1] == 13) {
                    fTypeI.push(param);
                } else if(this.Lexems[currentLexeme+3][1] == 14) {
                    fTypeF.push(param);
                } else if(this.Lexems[currentLexeme+3][1] == 15) {
                    fTypeS.push(param);
                }
            } else {
                if (this.Lexems[currentLexeme][1] == 12) {
                    fTypeB.push(param);
                } else if (this.Lexems[currentLexeme][1] == 13) {
                    fTypeI.push(param);
                } else if (this.Lexems[currentLexeme][1] == 14) {
                    fTypeF.push(param);
                } else if (this.Lexems[currentLexeme][1] == 15) {
                    fTypeS.push(param);
                }
            }
            if(this.variableType()) {
                this.Rules[inputParamRuleIndex].push('<тип>');
                if(this.Lexems[currentLexeme][0] == ',') {
                    this.Source += ('; ');   // Pascal
                    this.Rules[inputParamRuleIndex].push(',');
                    currentLexeme++;
                    if(!this.inputParam()) {
                        return false;
                    }
                    this.Rules[inputParamRuleIndex].push('<входные параметры>');
                }
                return true;
            }
        }
        return false;
    };

    /*
     * Конструктор Лексического анализатора
     */

    console.log('Program - isSuccessful? ' + this.Program());
    console.log('Rules');
    console.log(this.Rules);
    console.log('Syntax Erros');
    console.log(this.SyntaxErrors);
    console.log('Declare');
    console.log(Declare);
    console.log('Type Boolean');
    console.log(TypeB);
    console.log('Type Int');
    console.log(TypeI);
    console.log('Type Float');
    console.log(TypeF);
    console.log('Type String');
    console.log(TypeS);
    console.log('Identifier In Operators');
    console.log(identifierInOperators);
    console.log('names Function');
    console.log(namesFunction);
    console.log('params In Functions');
    console.log(paramsInFunctions);
    console.log('identifier In Functions');
    console.log(identifierInFunctions);
    console.log('Functions Type Boolean');
    console.log(fTypeB);
    console.log('Functions Type Int');
    console.log(fTypeI);
    console.log('Functions Type Float');
    console.log(fTypeF);
    console.log('Functions Type String');
    console.log(fTypeS);
};