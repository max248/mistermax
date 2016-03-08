function Translator(lex_table, grammar_rules) {
    this.lexer = new Lexer(lex_table);
    this.parser = new Parser();
    this.generator = new CodeGenerator();

    this.translate = function(prog_text) {
        var translate_res = {}

        // ========================================================
        // Стадия 1. Лексический анализатор
        var lexer_res = this.lexer.lexer(prog_text);
        translate_res.lexer = lexer_res;

        if (lexer_res.status == "Error") {
            translate_res.status = "Error";
            return translate_res;
        }

        // ========================================================
        // Стадия 2. Синтаксический анализатор

        // Пункт первый -- постоение синтаксического дерева
        var lexems = lexer_res.result.lexems;
        translate_res.parser = this.parser.make_tree(lexems);

        if (translate_res.parser.status == "Error") {
            translate_res.status = "Error";
            return translate_res;
        }


        // ========================================================
        // Стадия 3. Генератор кода
        try {
            translate_res.code = this.generator.GenerateCode(translate_res.parser.tree);
        }
        catch (e) {
            translate_res.status = "Error";
            translate_res.code = e;
            console.log(e.name);
            console.log(e.message);
            console.log(e.stack);
        }
        // ========================================================
        // Трансляция прошла успешно, возвращаем результат
        // для дальшейшей обработки
        if (!translate_res.status) {
            translate_res.status = "Ok";
        }
        return translate_res;
    }

    // Инициализация парсера
    var init_result = this.parser.init(grammar_rules);
    if (init_result.status == "Error") {
        // Ошибка
        console.log("Ошибка инициализации парсера!");
        // console.log(init_result);
        return;
    }
}