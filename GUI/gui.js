var gui = (function(){
    var example_list;
    var example_links = [];
    var translator;

    function clear() {
        var result_code, result_div, lexem_table, const_tables, syntax_tree;

        // Убираем текст транслированной программы
        result_code = document.getElementById('rescode');
        result_code.value = '';

        // Очистим блок с сообщениями
        result_div = document.getElementById('result_msgs');
        result_div.innerHTML = '';

        // Очистим таблицу лексем
        lexem_table = document.getElementById('lexem_table');
        lexem_table.innerHTML = '';

        // Очистим таблицы констант
        const_tables = document.getElementById('const_tables');
        const_tables.innerHTML = '';

        // Очистим синтаксическое дерево
        syntax_tree = document.getElementById('syntax_tree');
        syntax_tree.innerHTML = '';
    }

    function message(strong_text, text, warning) {
        if (strong_text == null) {
            strong_text = "";
        }

        if (text == null) {
            text = "";
        }

        if (warning == null) {
            warning = false;
        }

        //<div class="alert alert-danger" role="alert">
        //  <strong>Ошибка!</strong> Обнаружена синтаксическая ошибка в строке 13.
        //</div>
        var strong, alert;
        alert = document.createElement('div');

        if (strong_text.length != 0) {
            strong = document.createElement('strong');
            strong.appendChild(document.createTextNode(strong_text));
            alert.appendChild(strong);


            alert.appendChild(document.createTextNode(" ")); // Добавим пробел в конце
        }

        alert.appendChild(document.createTextNode(text));
        alert.className = "alert " + (warning ? "alert-danger" : "alert-success");

        document.getElementById('result_msgs').appendChild(alert);
    }

    function load_file(filename) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET' ,filename, false);
        xhr.send();

        if (xhr.status != 200) {
            // Не удалось получить документ
            message("Не удалось загрузить файл!", "Не удалось загрузить " + filename, true);
            return "";
        } else {
            return xhr.responseText;
        }
    }

    // Ф-ия инициализации
    // Инициализация транслятора
    // Так же скачиваем примеры, и строим меню для выбора примеров
    function init() {
        examples_init();
        translator_init();
    }

    // Транслировать программу
    // Выполняется при нажатии кнопки "транслировать"
    function translate() {
        clear();
        var res = transator.translate(document.getElementById("Program").value);
        console.log(res);

        result_visualization(res);
    }

    function translator_init() {
        // Инициализируем транслятор
        // Получить таблицу лексем из JSON файла
        var lex_table_text;
        var grammar_rules_text;

        lex_table_text = load_file('lexem_table.json');
        grammar_rules_text = load_file('go_grammar.json');

        transator = new Translator(JSON.parse(lex_table_text), JSON.parse(grammar_rules_text));
    }

    function examples_init() {
        examples_list = JSON.parse(load_file('examples/list.json'));

        for (var name in examples_list) {
            examples_list[name] = load_file("examples/" + examples_list[name]);
        }

        var selecter = document.getElementById("example_select");
        for (var name in examples_list) {
            var option = document.createElement('a');
            option.className = "list-group-item";
            option.appendChild(document.createTextNode(name));
            option.onclick = (function(name, link) { return function() {
                // По клику, во первых, сделаем текущую
                // ссылку активной, а все остальные нет
                example_links.forEach(function(val) {
                    val.className = "list-group-item";
                })

                link.className = "list-group-item active";

                // И поместить текст в текстовое поле
                document.getElementById('Program').value = examples_list[name];
            }})(name, option);
            
            selecter.appendChild(option);
            example_links.push(option);
        }
    }

    function make_lex_table(lexems) {
        var table_div = document.getElementById('lexem_table');
        var cell;

        // Создадим заголовок
        var header = document.createElement('h3');
        header.appendChild(document.createTextNode('Таблица лексем'));
        table_div.appendChild(header);

        // Создадим таблицу
        var table = document.createElement('table');
        table.className = "table table-striped";
        
        // Добавим в таблицу заголовок
        var table_header = document.createElement("thead");
        var table_header_row = document.createElement("tr");

        var cell = table_header_row.insertCell(0);
        cell.appendChild(document.createTextNode("#"));

        cell = table_header_row.insertCell(1);
        cell.appendChild(document.createTextNode("Лексема"));

        cell = table_header_row.insertCell(2);
        cell.appendChild(document.createTextNode("Значение"));

        cell = table_header_row.insertCell(3);
        cell.appendChild(document.createTextNode("# в таблице констант"));

        table_header.appendChild(table_header_row);
        table.appendChild(table_header);

        var t_body = document.createElement("tbody");
        // Добавим все лексемы
        lexems.forEach(function(val, idx) {
            var row = t_body.insertRow(idx);

            var cell0 = row.insertCell(0);
            var cell1 = row.insertCell(1);
            var cell2 = row.insertCell(2);
            var cell3 = row.insertCell(3);

            cell0.appendChild(document.createTextNode(idx));

            if (!val.value) {
                cell1.appendChild(document.createTextNode(val.type));
            } else {
                cell1.appendChild(document.createTextNode(val.type));
                cell2.appendChild(document.createTextNode(val.value[1]));
                cell3.appendChild(document.createTextNode(val.value[0]));
            }
        });

        table.appendChild(t_body);
        table_div.appendChild(table);

        header.onclick = function() {
            table.classList.toggle("unvisible");
        }
    }

    function make_const_tables(const_obj) {
        var const_tables_div = document.getElementById("const_tables");

        for (var table_name in const_obj) {
            // Создадим заголовок
            var header = document.createElement('h3');
            header.appendChild(document.createTextNode('Таблица ' + table_name));
            const_tables_div.appendChild(header);

            // Создадим таблицу
            var table = document.createElement('table');
            table.className = "table table-striped";
            
            // Добавим в таблицу заголовок
            var table_header = document.createElement("thead");
            var table_header_row = document.createElement("tr");

            var cell = table_header_row.insertCell(0);
            cell.appendChild(document.createTextNode("#"));

            cell = table_header_row.insertCell(1);
            cell.appendChild(document.createTextNode("Значение"));

            table_header.appendChild(table_header_row);
            table.appendChild(table_header);

            var t_body = document.createElement("tbody");
            // Добавим все лексемы
            const_obj[table_name].forEach(function(val, idx) {
                var row = t_body.insertRow(idx);

                var cell0 = row.insertCell(0);
                var cell1 = row.insertCell(1);

                cell0.appendChild(document.createTextNode(val[0]));
                cell1.appendChild(document.createTextNode(val[1]));
            });

            table.appendChild(t_body);
            const_tables_div.appendChild(table);

            header.onclick = (function(block) {return function() {
                block.classList.toggle("unvisible");
            }})(table);
        }
    }

    function result_visualization(translator_res) {
        // Проверим, что нет ошибок
        if (translator_res.lexer.status == "Error") {
            // Выводим сообщение об ошибке на стадии лексического анализа
            message("Ошибка на стадии лексического анализа", translator_res.lexer.error.error_text, true);
            return;
        } else {
            message("Лексичесий анализ прошел успешно!", "", false);
        }

        make_lex_table(translator_res.lexer.result.lexems);
        make_const_tables(translator_res.lexer.result.constants_table);

        if (translator_res.parser.status == "Error") {
            // Выводим сообщение об ошибке на стадии лексического анализа
            var id = translator_res.parser.info.cur_lexem;
            var msg = "";
            if (id >= translator_res.lexer.result.lexems) {
                msg = "Неожиданное завершение программы!";
            } else {
                msg = "Ошибка в строке ";
                var str = translator_res.lexer.result.lexems[id].string;
                var pos = translator_res.lexer.result.lexems[id].position;
                var type = translator_res.lexer.result.lexems[id].type;

                msg += str + " (символ #" + pos + ").";
                msg += " Неожиданная лексема " + type + ".";
            }

            message("Ошибка на стадии синтаксического анализа", msg, true);
            return;
        } else {
            document.getElementById("syntax_tree").appendChild(syntax_tree_visualize(translator_res.parser.tree));
            message("Синтаксический анализ прошел успешно!", "", false);
        }
        

        if (translator_res.status == "Error") {
            message("Ошибка на стадии генератора кода", translator_res.code.message, true);
        } else {
            message("Генерация кода прошла успешно", "", false);
            document.getElementById("rescode").value = translator_res.code
        }
    }

    return {
        "init" : init,
        "translate" : translate
    }
})();