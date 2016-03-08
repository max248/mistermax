function Lexer(lex_table) {
    this.lex_table = lex_table;

    this.is_skiped = function(obj, match) {
        if (obj.skip) {
            return true;
        } else {
            return false;
        }
    };

    this.is_list = function(obj, match) {
        //console.log(obj, match);

        if (obj.list) {
            var list = obj.list;
            for (var key in list) {
                if (list[key] == match) {
                    return {
                        "type" : key
                    };
                }
            }
        }

        return false;
    };

    this.is_link = function(obj, match, name) {
        if (obj.link) {
            var l = this.constants[obj.link].length;
            for (var i = 0; i < l; ++i) {
                if (this.constants[obj.link][i][1] == match) {
                    return {
                        "type" : name,
                        "value" : this.constants[obj.link][i]
                    };
                }
            }

            this.constants[obj.link].push([l, match]);
            return {
                "type" : name,
                "value" : this.constants[obj.link][l]
            };
        }
        return false;
    };

    this.lexer = function(txt) {
        this.str_cnt = 0;
        this.pos_int_str = 0;

        var res = [];
        this.constants = {};

        for (var key in lex_table) {
            if (lex_table[key].link) {
                this.constants[lex_table[key].link] = [];
            }
        }

        while (txt.length != 0) {
            // Проверяем все лексемы, пока не найдем нужную
            // или пока список не закончится
            var f = false;

            // Найдем токен с максимальным совпадением
            var max_eq = 0;
            var max_eq_type = "";

            for (var token_type in this.lex_table) {
                var reg = new RegExp(this.lex_table[token_type].reg);
                var ex_res = reg.exec(txt);
                if (ex_res) {
                    if (ex_res[0].length > max_eq) {
                        // Мы нашли какой-то токен
                        f = true;
                        max_eq = ex_res[0].length;
                        max_eq_type = token_type;
                    }
                }
            }

            if (!f) {
                return {
                    "status" : "Error",
                    "error" : {
                        "error_text" : "Ошибка в строке " + (this.str_cnt + 1),
                        "prog_text" : txt,
                        "line" : this.str_cnt + 1
                    }
                };
            } else {
                var reg = new RegExp(this.lex_table[max_eq_type].reg);
                var match = reg.exec(txt)[0];
                var obj = this.lex_table[max_eq_type];
                var lexem = this.is_skiped(obj, match) || this.is_list(obj, match) || this.is_link(obj, match, max_eq_type);
                if (!lexem) {
                    // Тут можно вернуть ошибку, а можно просто перейти к
                    // следующей лексеме, оставив эту нераспознанной
                    // (Вывести сообщение об ошибке куда то в другое место, а не просто ее вернуть)
                    // TODO
                    return {
                        "status" : "Error",
                        "error" : {
                            "error_text" : "Ошибка в строке " + (this.str_cnt + 1),
                            "prog_text" : txt,
                            "line" : this.str_cnt + 1
                        }
                    };
                } else {
                    // Добавим лексему в список лексем
                    if (!(lexem === true)) {
                        lexem["string"] = this.str_cnt + 1;
                        lexem["position"] = this.pos_int_str;

                        res.push(lexem);
                    }

                    // Поменяем текущую строку и позицию
                    for (var i = 0; i < match.length; ++i)
                        if (match[i] === "\n") {
                            ++this.str_cnt;
                            this.pos_int_str = 0;
                        } else {
                            this.pos_int_str++;
                        }
                }

                txt = txt.replace(reg, "");
            }
        }

        return {
            "status" : "Ok",
            "result" : {
                "constants_table" : this.constants,
                "lexems" : res
            }
        };
    }
}