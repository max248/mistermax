function CodeGenerator() {

    // Ф-ия принимает кол-во символов табуляции и возвращает строку с таким отступом
    function get_tab(tab) {
        var one_tab = "    ";
        var res = "";
        for (var i = 0; i < tab; ++i) {
            res += one_tab;
        }

        return res;
    }

    this.get_type = function(type_node) {
        if (type_node.name == "TYPE") {
            switch (type_node.rule[1]) {
                case 0:
                    return [0, "int"];

                case 1:
                    return [0, "float"];

                case 2:
                    return [0, "string"];

                case 3:
                    return [0, "bool"];

                case 4:
                    var res = this.get_type(type_node.childs[0].childs[2]);
                    res[0]++;
                    return res;
            }
        } else if (type_node.name == "TYPE_WITH_VOID") {
            if (type_node.rule[1] == 0) {
                return [0, "void"];
            } else {
                return this.get_type(type_node.childs[0]);
            }
        } else if (type_node.name == "ARR_TYPE") {
            var res = this.get_type(type_node.childs[2]);
            res[0]++;
            return res;
        } else {
            throw new SyntaxError("Данные некорректны");
        }
    };


    this.GenerateCode = function(tree) {
        var t_this = this;
        // Для начала проверим составим описания всех ф-ий
        var func_description = {};

        (function make_function_table(node) {
            if (node.name == "FUNCTION" || node.name == "MAIN_FUNCTION") {
                var name = get_func_name(node);
                if (func_description[name]) {
                    // Ошибка, дважды объявлена одна и та же ф-ия
                    throw {
                        "name" : "Semantic error",
                        "message" : "Двойная инициализация " + name
                    }
                }

                func_description[name] = get_func_desc(node);
            }
            else {
                node.childs.forEach(function (val) {
                    make_function_table(val);
                })
            }
        })(tree);

        console.log(func_description);

        // Теперь каждому идентификатору во всех выражениях запишем его тип
        (function make_ident_types(node, cur_func, func_table) {
            if (node.name == "FUNCTION" || node.name == "MAIN_FUNCTION") {
                var cur = func_table[get_func_name(node)];
                node.childs.forEach(function(val) {
                    make_ident_types(val, cur, func_table);
                });
            }
            else if (node.name == "ident") {
                if (cur_func.var_hash[node.lex.value[1]]) {
                    node.ident_type = "var";
                    node.ident_val = cur_func.var_hash[node.lex.value[1]]
                } else if (func_table[node.lex.value[1]]) {
                    node.ident_type = "func"
                } else {
                    throw {
                        "name" : "Syntax Error",
                        "message" : "Переменная не объявлена " + node.lex.value[1]
                    }
                }
            } else{
                node.childs.forEach(function (val) {
                    make_ident_types(val, cur_func, func_table);
                });
            }
        })(tree, {}, func_description);

        function get_func_name(node) {
            // ["func_lex", "ident", "open_parentheses", "INPUT_PARAMS", "close_parentheses", "TYPE_WITH_VOID",
            //  "open_brace", "HSPACE", "VAR_DECLARATIONS", "OPERATORS", "close_brace", "HSPACE"]

            // ["func_lex", "main_lex", "open_parentheses", "close_parentheses",
            //  "open_brace", "HSPACE", "VAR_DECLARATIONS", "OPERATORS", "close_brace", "HSPACE"]
            var func_name = "";

            if (node.childs[1].name == "ident") {
                func_name = node.childs[1].lex.value[1];
            }
            else {
                func_name = "main";
            }

            return func_name;
        }

        function get_func_desc(node) {
            // ["func_lex", "ident", "open_parentheses", "INPUT_PARAMS", "close_parentheses", "TYPE_WITH_VOID",
            //  "open_brace", "HSPACE", "VAR_DECLARATIONS", "OPERATORS", "close_brace", "HSPACE"]

            // ["func_lex", "main_lex", "open_parentheses", "close_parentheses",
            //  "open_brace", "HSPACE", "VAR_DECLARATIONS", "OPERATORS", "close_brace", "HSPACE"]
            var res = {
                "param_list" : [],
                "var_hash" : {},
                "type" : "void"
            };

            if (node.childs[1].name == "ident") {
                res.type = t_this.get_type(node.childs[5]);
                // Для начала получим список параметров
                // [ { "param_type" : ..., "param_name" : ...}, ...]
                var param_list = (function get_params(params_node) {
                    // Первое правило -- пустое
                    if (params_node.name == "INPUT_PARAMS" && params_node.rule[1] == 0) {
                        return [];
                    }

                    // Второе правило -- непустое
                    if (params_node.name == "INPUT_PARAMS" && params_node.rule[1] == 1) {
                        return get_params(params_node.childs[0]);
                    }

                    // Один параметр
                    if (params_node.name == "NOTVOID_INPUT_PARAMS" && params_node.rule[1] == 0) {
                        return [get_params(params_node.childs[0])];
                    }

                    // Несколько параметров
                    if (params_node.name == "NOTVOID_INPUT_PARAMS" && params_node.rule[1] == 1) {
                        var res = get_params(params_node.childs[0]);
                        res.push(get_params(params_node.childs[2]));
                        return res;
                    }

                    // Праметр
                    if (params_node.name == "INPUT_PARAM") {
                        return {
                            "param_type" : t_this.get_type(params_node.childs[1]),
                            "param_name" : params_node.childs[0].lex.value[1]
                        };
                    }
                })(node.childs[3]);

                param_list.forEach(function(val) {
                    res.param_list.push(val.param_type);
                    if (res.var_hash[val.param_name]) {
                        throw {
                            "name" : "Semantic error",
                            "message" : "Два параметра с одним именем " + val.param_name
                        }
                    }

                    res.var_hash[val.param_name] = val.param_type;
                });

                // Теперь аналогично поступим с переменными
                (function get_var(var_node) {
                    // Первое правило -- пустое
                    if (var_node.name == "VAR_DECLARATIONS" && var_node.rule[1] == 0) {
                        return;
                    } else if (var_node.name == "VAR_DECLARATIONS") {
                        // Второе не пустое
                        get_var(var_node.childs[0]);
                    } else if (var_node.name == "NOT_VOID_VAR_DECLARATIONS" && var_node.rule[1] == 0) {
                        // Добавим переменную
                        var name = var_node.childs[0].childs[1].lex.value[1];
                        var type = t_this.get_type(var_node.childs[0].childs[2]);
                        if (res.var_hash[name]) {
                            throw {
                                "name" : "Semantic error",
                                "message" : "2 переменные с одним именем " + name
                            }
                        }

                        res.var_hash[name] = type;
                    } else {
                        // переменные
                        get_var(var_node.childs[0]);

                        // Добавим переменную
                        var name = var_node.childs[1].childs[1].lex.value[1];
                        var type = t_this.get_type(var_node.childs[1].childs[2]);
                        if (res.var_hash[name]) {
                            throw {
                                "name" : "Semantic error",
                                "message" : "2 переменные с одним именем " + name
                            }
                        }

                        res.var_hash[name] = type;
                    }
                })(node.childs[8]);
            }
            else {
                (function get_var(var_node) {
                    // Первое правило -- пустое
                    if (var_node.name == "VAR_DECLARATIONS" && var_node.rule[1] == 0) {
                        return;
                    } else if (var_node.name == "VAR_DECLARATIONS") {
                        // Второе не пустое
                        get_var(var_node.childs[0]);
                    } else if (var_node.name == "NOT_VOID_VAR_DECLARATIONS" && var_node.rule[1] == 0) {
                        // Добавим переменную
                        var name = var_node.childs[0].childs[1].lex.value[1];
                        var type = t_this.get_type(var_node.childs[0].childs[2]);
                        if (res[name]) {
                            throw {
                                "name" : "Semantic error",
                                "message" : "2 переменные с одним именем " + name
                            }
                        }

                        res.var_hash[name] = type;
                    } else {
                        // переменные
                        get_var(var_node.childs[0]);

                        // Добавим переменную
                        var name = var_node.childs[1].childs[1].lex.value[1];
                        var type = t_this.get_type(var_node.childs[1].childs[2]);
                        if (res[name]) {
                            throw {
                                "name" : "Semantic error",
                                "message" : "2 переменные с одним именем " + name
                            }
                        }

                        res.var_hash[name] = type;
                    }
                })(node.childs[6])
            }



            return res;
        }

        // Здесь сделать генератор кода
        var code = "";
        (function make_code(node) {
            if (node.name == "FUNCTION" || node.name == "MAIN_FUNCTION") {
                code += get_func(node) + "\n";
            }
            else {
                node.childs.forEach(function (val) {
                    make_code(val);
                })
            }
        })(tree);

        code += "main()\n";
        console.log(code);
        return code;

        function translate_expr0(node) {
            /*["L_VALUE"],
             ["FUNCTION_CALL"],
             ["int_const"],
             ["float_const"],
             ["bool_const"],
             ["string_const"],
             ["open_parentheses", "EXPR", "close_parentheses"],
             ["not", "EXPR0"],
             ["plus", "EXPR0"],
             ["minus", "EXPR0"],
             ["int_lex", "open_parentheses", "EXPR", "close_parentheses"],
             ["float_lex", "open_parentheses", "EXPR", "close_parentheses"],
             ["make_lex", "open_parentheses", "ARR_TYPE", "comma", "EXPR", "close_parentheses"]*/
            var res;
            if (node.rule[1] == 0) {
                res = l_value_translate(node.childs[0]);
                node.type = node.childs[0].type;
                return res;
            } else if (node.rule[1] == 1) {
                res = function_call_translate(node.childs[0]);
                node.type = node.childs[0].type;

                if (node.type[1] == "void") {
                    throw {
                        "name" : "Semantic Error",
                        "message" : "недопустимый тип ф-ии : " + res
                    }
                }

                return res;
            } else if (node.rule[1] >= 2 && node.rule[1] <= 5) {
                node.type = [[0, "int"], [0, "float"], [0, "bool"], [0, "string"]][node.rule[1] - 2];
                return node.childs[0].lex.value[1];
            } else if (node.rule[1] == 6) {
                res = "(" + translate_expr(node.childs[1]) + ")";
                node.type = node.childs[1].type;
                return res;
            } else if (node.rule[1] >= 7 && node.rule[1] <= 9) {
                // Проверим, нужны ли скобки
                var sign = ["not ", "+", "-"];
                var idx = node.rule[1] - 7;
                if (node.childs[1].rule[1] >= 7 && node.childs[1].rule[1] <= 9) {
                    // Скобки нужны
                    res = sign[idx] + "(" + translate_expr0(node.childs[1]) + ")";
                } else {
                    // Не нужны
                    res = sign[idx] + translate_expr0(node.childs[1]);
                }
                // Так же not может стоять только перед bool, а + - только перед int и float
                if (node.rule[1] == 7 && (node.childs[1].type[1] != "bool" || node.childs[1].type[0] != 0)) {
                    throw {
                        "name" : "Semantic Error",
                        "message" : "Нельзя использовать отрицание для данного типа выражения"
                    }
                }

                if (node.rule[1] != 7 && ((node.childs[1].type[1] != "int" && node.childs[1].type[1] != "float") || node.childs[1].type[0] != 0)) {
                    throw {
                        "name" : "Semantic Error",
                        "message" : "Нельзя использовать унарный плюс или минус для данного выражения"
                    }
                }

                node.type = node.childs[1].type;

                return res;
            } else if (node.rule[1] == 10 || node.rule[1] == 11) {
                // Узнаем что за тип, и выполним приведение. Возможно выкинем ошибку
                var type = ["int", "float"][node.rule[1] - 10];
                res = type + "(" + translate_expr(node.childs[2]) + ")";

                if (node.childs[2].type[0] != 0) {
                    throw {
                        "name" : "Semantic Error",
                        "message" : "Некорректное приведение типов"
                    }
                }

                if (node.childs[2].type[1] != "int" && node.childs[2].type[1] != "float") {
                    throw {
                        "name" : "Semantic Error",
                        "message" : "Некорректное приведение типов"
                    }
                }

                node.type = [0, type];

                return res;
            } else {
                res = "[0 for x in range(" + translate_expr(node.childs[4]) + ")]";
                if (node.childs[4].type[1] != "int" || node.childs[4].type[0] != 0) {
                    throw {
                        "name" : "Semantic Error",
                        "message" : "Неверно используется ф-ия make"
                    }
                }

                node.type = t_this.get_type(node.childs[2]);
                return res;
            }
        }

        function translate_expr1(node) {
            /*
            ["EXPR0"],
             ["EXPR1", "mult", "EXPR0"],
             ["EXPR1", "div", "EXPR0"],
             ["EXPR1", "mod", "EXPR0"]*/

            var res;
            if (node.rule[1] == 0) {
                res = translate_expr0(node.childs[0]);
                node.type = node.childs[0].type;
                return res;
            } else {
                var res_l = translate_expr1(node.childs[0]);
                var res_r = translate_expr0(node.childs[2]);

                // типы должны совпадать слева и справа, а так же допускаются только числа
                if (node.childs[0].type[0] != 0 || node.childs[2].type[0] != 0) {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Нельзя умножать или делить массивы " + res
                    }
                }

                var type1 = node.childs[0].type[1];
                var type2 = node.childs[2].type[1];

                if (type1 != type2) {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Несоответствие типов " + res_l + " и " + res_r
                    }
                }

                if (type1 != "int" && type1 != "float") {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Несоответствие типов " + res_l + " и " + res_r
                    }
                }

                if (node.rule[1] == 3 && type1 == "float") {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Недопустимый тип в " + res_1
                    }
                }

                node.type = [0, type1];

                if (node.rule[1] == 2) {
                    // Деление целочисленное и обычное отличается
                    if (node.type[1] == "int") {
                        return res_l + " // " + res_r;
                    } else {
                        return res_l + " / " + res_r;
                    }
                } else {
                    return res_l + [," * ",," % "][node.rule[1]] + res_r;
                }
            }
        }

        function translate_expr2(node) {
            /*
            *["EXPR1"],
             ["EXPR2", "plus", "EXPR1"],
             ["EXPR2", "minus", "EXPR1"]*/
            var res;
            if (node.rule[1] == 0) {
                res = translate_expr1(node.childs[0]);
                node.type = node.childs[0].type;
                return res;
            } else if (node.rule[1] == 1) {
                res = translate_expr2(node.childs[0]) + " + " + translate_expr1(node.childs[2]);

                // типы должны совпадать слева и справа, а так же допускаются только строки и числа
                if (node.childs[0].type[0] != 0 || node.childs[2].type[0] != 0) {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Нельзя складывать массивы в " + res
                    }
                }

                var type1 = node.childs[0].type[1];
                var type2 = node.childs[2].type[1];

                if (type1 != type2) {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Несоответствие типов в " + res
                    }
                }

                if (type1 != "string" && type1 != "int" && type1 != "float") {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Недопустимый тип в " + res
                    }
                }

                node.type = [0, type1];
                return res;
            } else if (node.rule[1] == 2) {
                res = translate_expr2(node.childs[0]) + " - " + translate_expr1(node.childs[2]);

                // типы должны совпадать слева и справа, а так же допускаются только числа
                if (node.childs[0].type[0] != 0 || node.childs[2].type[0] != 0) {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Нельзя складывать массивы в " + res
                    }
                }

                var type1 = node.childs[0].type[1];
                var type2 = node.childs[2].type[1];

                if (type1 != type2) {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Несоответствие типов в " + res
                    }
                }

                if (type1 != "int" && type1 != "float") {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Недопустимый тип в " + res
                    }
                }

                node.type = [0, type1];

                return res;
            }

            //return "EXPR2";
        }

        function translate_expr3(node) {
            /*
                ["EXPR2"],
                ["EXPR3", "greater_or_eq", "EXPR2"],
                ["EXPR3", "less_or_eq", "EXPR2"],
                ["EXPR3", "not_equal", "EXPR2"],
                ["EXPR3", "is_equal", "EXPR2"],
                ["EXPR3", "greater", "EXPR2"],
                ["EXPR3", "less", "EXPR2"]
             */
            var res;
            if (node.rule[1] == 0) {
                res = translate_expr2(node.childs[0]);
                node.type = node.childs[0].type;
                return res;
            } else {
                var idx = node.rule[1] - 1;
                var cmp = [" >= ", " <= ", " != ", " == ", " > ", " < "];
                res = "(" + translate_expr3(node.childs[0]) + ")" + cmp[idx] + "(" + translate_expr2(node.childs[2]) + ")";

                // Типы выражения слева и справа должны совпадать
                // Так же нельзя допускать массивов
                if (node.childs[0].type[0] != 0 || node.childs[0].type[1] != node.childs[2].type[1] || node.childs[2].type[0] != 0) {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Типы данных не совпадают или используются массивы в " + res
                    }
                }

                node.type = [0, "bool"]
                return res;
            }
        }

        function translate_expr4(node) {
            /*
             [
             ["EXPR3"],
             ["EXPR4", "and", "EXPR3"]
             ]
             */
            var res;
            if (node.rule[1] == 0) {
                res = translate_expr3(node.childs[0]);
                node.type = node.childs[0].type;
                return res;
            } else {
                res = translate_expr4(node.childs[0]) + " and " + translate_expr3(node.childs[2]);
                if (node.childs[0].type[0] != 0 || node.childs[0].type[1] != "bool" || node.childs[2].type[0] != 0 || node.childs[2].type[1] != "bool") {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Выражение не bool в " + res
                    }
                }

                node.type = [0, "bool"]

                return res;
            }

            // return "EXPR";
        }


        // Транслировать выражение
        function translate_expr(node) {
            /*
            "EXPR" : [
             ["EXPR4"],
             ["EXPR", "or", "EXPR4"]
             ]
             */
            var res;
            if (node.rule[1] == 0) {
                res = translate_expr4(node.childs[0]);
                node.type = node.childs[0].type;
                return res;
            } else {
                res = translate_expr(node.childs[0]) + " or " + translate_expr4(node.childs[2]);
                // если or -- то 2 bool
                if (node.childs[0].type[0] != 0 || node.childs[0].type[1] != "bool" || node.childs[2].type[0] != 0 || node.childs[2].type[1] != "bool") {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Выражение не bool в " + res
                    }
                }

                node.type = [0, "bool"];
                return res;
            }

            // return "EXPR";
        }


        // Транслировать параметры в ф-ии
        function param_translate(node) {
            var res = "";
            if (node.name == "PARAMS" && node.rule[1] == 0) {
                return "";
            } else if (node.name == "PARAMS" && node.rule[1] == 1) {
                return param_translate(node.childs[0]);
            } else if (node.rule[1] == 0) {
                return translate_expr(node.childs[0]);
            } else {
                return param_translate(node.childs[0]) + ", " + translate_expr(node.childs[2]);
            }
        }

        function function_call_translate(node) {
            if (node.childs[0].ident_type != "func") {
                throw {
                    "name" : "Semantic Error",
                    "message" : node.childs[0].lex.value[1] + " не функция!"
                }
            }

            node.type = func_description[node.childs[0].lex.value[1]].type;
            console.log(node.type);
            var res = "";
            // Необходимо проверить, подходят ли параметры под описание и транслировать их
            // TODO
            res = node.childs[0].lex.value[1] + "(" + param_translate(node.childs[2]) + ")";
            return res;
        }

        function l_value_translate(node) {
            var res = "";
            if (node.rule[1] == 0) {
                // Зададим тип текущему выражению
                if (node.childs[0].ident_type == "func") {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Название ф-ии используется в качестве названия переменной! " + node.childs[0].lex.value[1]
                    }
                } else {
                    node.type = node.childs[0].ident_val;
                }

                res = node.childs[0].lex.value[1];
            } else {
                res = l_value_translate(node.childs[0]) + "[" + translate_expr(node.childs[2]) + "]";
                if (node.childs[0].type[0] == 0) {
                    throw {
                        "name" : "Semantic Error",
                        "message" : "Неправильное выражение " + res
                    };
                } else if (node.childs[2].type[1] != "int" || node.childs[2].type[0] != 0) {
                    throw {
                        "name" : "Semantic error",
                        "message" : "Выражение должно быть типа int " + res
                    }
                } else {
                    node.type = [];
                    node.type[0] = node.childs[0].type[0] - 1;
                    node.type[1] = node.childs[0].type[1];
                }
            }

            return res;
        }

        function equate_translate(node) {
            var res = l_value_translate(node.childs[0]) +  " = " + translate_expr(node.childs[2]) + "\n";

            if (node.childs[0].type[0] != node.childs[2].type[0] || node.childs[0].type[1] != node.childs[2].type[1]) {
                throw {
                    "name" : "Semantic Error",
                    "message" : "Несоответствие типов в присваивании " + res
                }
            }

            return res;
        }

        function cycle_translate(node, tab) {
            var tab_s = get_tab(tab);
            var res = tab_s;

            if (node.rule[1] == 0) {
                // Цикл for
                // ["for_lex", "FOR_INIT", "semicolon", "EXPR", "semicolon", "FOR_ITER", "OPERATORS_BLOCK"]
                node = node.childs[0];

                // for транслируем используя while
                res = "";
                if (node.childs[1].rule[1] == 1) {
                    res = tab_s + equate_translate(node.childs[1].childs[0])
                }
                res += tab_s + "while " + translate_expr(node.childs[3]) + ":\n";
                res += operators_translate(node.childs[6].childs[2], tab + 1);

                if (node.childs[5].rule[1] == 1) {
                    res += tab_s + "    " + equate_translate(node.childs[5].childs[0])
                }

                // Выражение должно иметь тип bool
                if (node.childs[3].type[0] != 0 || node.childs[3].type[1] != "bool") {
                    throw {
                        "name" : "Semantic Error",
                        "message" : "Необходимо выражение с типом bool"
                    };
                }
            } else if (node.rule[1] == 1) {
                // while
                node = node.childs[0];
                // ["for_lex", "EXPR", "OPERATORS_BLOCK"]
                res += "while " + translate_expr(node.childs[1]) + ":\n";
                res += operators_translate(node.childs[2].childs[2], tab + 1);

                // Выражение должно иметь тип bool
                if (node.childs[1].type[0] != 0 || node.childs[1].type[1] != "bool") {
                    throw {
                        "name" : "Semantic Error",
                        "message" : "Необходимо выражение с типом bool"
                    };
                }
            } else if (node.rule[1] == 2) {
                // for in
                // ["for_lex", "ident", "in_lex", "L_VALUE", "OPERATORS_BLOCK"]
                node = node.childs[0];
                res += "for " + node.childs[1].lex.value[1] + " in " + l_value_translate(node.childs[3]) + ": ";
                res += operators_translate(node.childs[4].childs[2], tab + 1);

                // Типы одинаковые, размерности отличаеются на 1
                if (node.childs[1].type[0] != node.childs[3].type[0] - 1 || node.childs[1].type[1] != node.childs[3].type[1]) {
                    throw {
                        "name" : "Semantic Error",
                        "message" : "Несоответстивие типов в for in"
                    };
                }
            }

            return res;
        }

        function if_translate(node, tab) {
            /*
            "IF" : [
             ["if_lex", "EXPR", "OPERATORS_BLOCK"],
             ["if_lex", "EXPR", "OPERATORS_BLOCK", "else_lex", "OPERATORS_BLOCK"],
             ["if_lex", "EXPR", "OPERATORS_BLOCK", "else_lex", "IF"]
             ],
             */
            var res = "";
            var tab_s = get_tab(tab);
            if (node.rule[1] == 0) {
                res += "if " + translate_expr(node.childs[1]) + ":\n"
                res += operators_translate(node.childs[2].childs[2], tab + 1);
            } else if (node.rule[1] == 1) {
                res += "if " + translate_expr(node.childs[1]) + ":\n"
                res += operators_translate(node.childs[2].childs[2], tab + 1);
                res += tab_s + "else:\n";
                res += operators_translate(node.childs[4].childs[2], tab + 1);
            } else {
                res += "if " + translate_expr(node.childs[1]) + ":\n"
                res += operators_translate(node.childs[2].childs[2], tab + 1);
                res += tab_s + "elif";
                var tmp = if_translate(node.childs[4], tab);
                tmp = tmp.replace(/^if/, "");
                res += tmp;
            }

            // В любом случае выражение должно иметь тип bool
            if (node.childs[1].type[0] != 0 || node.childs[1].type[1] != "bool") {
                throw {
                    "name" : "Semantic Error",
                    "message" : "В if в качестве условия требуется логическое выражение!"
                };
            }

            return res;
        }
        // Функция получает узел с оператором и необходимый отступ
        // возвращает транслированный код
        function operator_translate(node, tab) {
            var res = "";
            var tab_s = get_tab(tab);

            if (node.rule[1] == 0) {
                // ["FUNCTION_CALL", "NOT_VOID_HSPACE"]
                res = tab_s + function_call_translate(node.childs[0]) + "\n";
            } else if (node.rule[1] == 1) {
                // ["EQUATE", "NOT_VOID_HSPACE"]
                res = tab_s + equate_translate(node.childs[0]);
            } else if (node.rule[1] == 2) {
                // ["CYCLES", "NOT_VOID_HSPACE"]
                res = cycle_translate(node.childs[0], tab);
            } else if (node.rule[1] == 3) {
                // ["IF", "NOT_VOID_HSPACE"]
                res = tab_s + if_translate(node.childs[0], tab);
            } else if (node.rule[1] == 4) {
                // ["return_lex", "EXPR", "NOT_VOID_HSPACE"]
                res = tab_s + "return " + translate_expr(node.childs[1]) + "\n";
            } else if (node.rule[1] == 5) {
                // ["print", "open_parentheses", "NOTVOID_PARAMS", "close_parentheses", "NOT_VOID_HSPACE"]
                res = tab_s + "print(" + param_translate(node.childs[2]) + ", end=\"\")\n";
            } else if (node.rule[1] == 6) {
                // ["scan", "open_parentheses", "amp", "L_VALUE", "close_parentheses", "NOT_VOID_HSPACE"]
                // Получить тип операнда
                // далее что то вида L_VALUE = type(input()), кроме случая когда type == string
                var l_val = l_value_translate(node.childs[3]);
                var type  = node.childs[3].type;

                if (type[0] != 0) {
                    throw {
                        "name" : " Semantic Error!",
                        "message" : "Нельзя считывать массивы!"
                    }
                }

                if (type[1] == "string") {
                    res = tab_s + l_val + " = input()\n";
                } else {
                    res = tab_s + l_val + " = " + type[1] + "(input())\n";
                }
            } else {
                // ["return_lex", "NOT_VOID_HSPACE"]
                res = tab_s + "return\n";
            }

            return res;
        }

        // Функция получает узел с операторами и необходимый отступ
        // возвращает транслированный код
        function operators_translate(node, tab) {
            // Пустое правило -- пустой результат
            if (node.rule[1] == 0) {
                return ""
            } else {
                var res = "";
                res += operators_translate(node.childs[0], tab);
                res += operator_translate(node.childs[1], tab);
                return res;
            }
        }

        // Функция получает узел с функцией (главной или обычной),
        // возвращает транслированный код
        function get_func(node) {
            // ["func_lex", "ident", "open_parentheses", "INPUT_PARAMS", "close_parentheses", "TYPE_WITH_VOID",
            //  "open_brace", "HSPACE", "VAR_DECLARATIONS", "OPERATORS", "close_brace", "HSPACE"]

            // ["func_lex", "main_lex", "open_parentheses", "close_parentheses",
            //  "open_brace", "HSPACE", "VAR_DECLARATIONS", "OPERATORS", "close_brace", "HSPACE"]
            var func_name = "";
            var operators_node;
            var var_decl_node;
            var param_list;     // Имена и типы параметров

            if (node.childs[1].name == "ident") {
                func_name = node.childs[1].lex.value[1];
                var_decl_node = node.childs[8];
                operators_node = node.childs[9];

                // Составим список параметров
                param_list = (function get_params(params_node) {
                    // Первое правило -- пустое
                    if (params_node.name == "INPUT_PARAMS" && params_node.rule[1] == 0) {
                        return [];
                    }

                    // Второе правило -- непустое
                    if (params_node.name == "INPUT_PARAMS" && params_node.rule[1] == 1) {
                        return get_params(params_node.childs[0]);
                    }

                    // Один параметр
                    if (params_node.name == "NOTVOID_INPUT_PARAMS" && params_node.rule[1] == 0) {
                        return [get_params(params_node.childs[0])];
                    }

                    // Несколько параметров
                    if (params_node.name == "NOTVOID_INPUT_PARAMS" && params_node.rule[1] == 1) {
                        var res = get_params(params_node.childs[0]);
                        res.push(get_params(params_node.childs[2]));
                        return res;
                    }

                    // Праметр
                    if (params_node.name == "INPUT_PARAM") {
                        return {
                            "param_type" : t_this.get_type(params_node.childs[1]),
                            "param_name" : params_node.childs[0].lex.value[1]
                        };
                    }
                })(node.childs[3]);
            }
            else {
                func_name = "main";
                var_decl_node = node.childs[6];
                operators_node = node.childs[7];
                param_list = [];
            }

            // Ф-ии в питоне:
            // def func_name (func_params):
            // ____code

            var str_with_params = "";
            param_list.forEach(function (val, idx) {
                if (idx != 0) {
                    str_with_params += ", ";
                }
                str_with_params += val.param_name;// + " " + val.param_type;
            });

            var res = "def " + func_name + "(" + str_with_params + "):\n"; // Заголовок ф-ии

            // Добавим тело ф-ии
            res += operators_translate(operators_node, 1);
            return res;
        }
    }
}
