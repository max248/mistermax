 // Создадим объект-синтаксический анализатор
function Parser() {
  var noterm_separator = ".";
  var rule_separator = "|";
  this.fsm = {};

  this.rule_to_str = function(rule) {
    // Просто преобразуем массив к строке
    return "" + rule;
  };

  this.rules_to_str = function(rules) {
    // Переводит состояние в строку, если два разных набора правил
    // равны друг другу, то и получившиеся наборы тоже будут равны
    // Иначе они будут различаться
    var str_arr = [];
    var t_this = this;
    rules.forEach(function(t) {
      str_arr.push(t_this.rule_to_str(t));
    });
    // Обязательно ножно остортировать массив,
    // т.к. порядок правил роли не играет
    // И в случае если правила следуют в разном порядке
    // надо что бы строки были одинаковыми
    str_arr.sort();
    var res = "";
    str_arr.forEach(function(t) { res += rule_separator + t });

    return res;
  };

  this.is_term = function(str) {
    // end является терминалом
    if (str == "end") return true;

    for (var i = 0; i < this.grammar_rules.terms.length; ++i) {
      if (this.grammar_rules.terms[i] == str)
        return true; // Если нашли текущйи символ в массиве терминалов, то он терминал
    }

    return false;
  };

  this.extand_state = function(rules) {
    // Набор правил с нашей текущей позицией
    // Расширяет его до полного набора
    var maked_rule = {};
    var i;

    for (i = 0; i < rules.length; ++i) {
      // отмечаем, что такое правило уже было
      maked_rule[this.rule_to_str(rules[i])] = true;
    }

    // Теперь для каждого правила просмотрим что мы можем добавить
    for (i = 0; i < rules.length; ++i) {
      var cur_rule = this.grammar_rules.rules[rules[i][0]][rules[i][1]];

      // Если в текущем правиле за нашей позицией
      // следует нетерминал, то следует добавить все правила
      // У которых в правой части стоит данные нетермнал
      if (rules[i][2] < cur_rule.length && !this.is_term(cur_rule[rules[i][2]])) {
        var analiz_rules = this.grammar_rules.rules[cur_rule[rules[i][2]]];

        for (j = 0; j < analiz_rules.length; ++j) {
          var tmp_rule_to_add = [cur_rule[rules[i][2]], j, 0];

          // Если такого правила еще не было, добавим его
          if (!maked_rule[this.rule_to_str(tmp_rule_to_add)]) {
            maked_rule[this.rule_to_str(tmp_rule_to_add)] = true;
            rules.push(tmp_rule_to_add);
          }
        }
      }
    }

    return rules;
  };

  this.make_state_by_shift = function(rules, token) {
    var new_rules = [];

    for (var i = 0; i < rules.length; ++i) {
      var cur_rule = this.grammar_rules.rules[rules[i][0]][rules[i][1]];

      // Если в очередном правиле нужный символ
      // стоит непосредственно за нашей позицией
      if (rules[i][2] < cur_rule.length && cur_rule[rules[i][2]] == token) {
        new_rules.push(rules[i].slice());       // Копируем правило
        new_rules[new_rules.length - 1][2]++;   // Передвигаем вперед текущую позицию
      }
    }

    this.extand_state(new_rules); // Расширяем состояние до полного
    return new_rules;
  };

  this.can_reduce = function(rules) {
    // Если в текущей позиции возможна свертка -- вернем
    // правило по которому мы можем свернуть
    // Иначе вернем false
    // Ну и если свертка неоднозначна -- выведем сообщение об ошибке
    var res = false;
    var ambiguous = false;

    for (var i = 0; i < rules.length; ++i) {
      var cur_rule = this.grammar_rules.rules[rules[i][0]][rules[i][1]];

      if (rules[i][2] == cur_rule.length) {
        if (res) {
          ambiguous = true;
          console.log("Неоднозначная свертка!");
          console.log("Возможна свертка по правилу : ", rules[i][0], cur_rule);
          console.log("Также свертка по правилу : ", res);
          console.log(rules);
        }

        res = [rules[i][0], rules[i][1]];
      }
    }

    if (ambiguous) {
      return {
        "status": "Error"
      };
    }

    return {
      "status" : "Ok",
      "result" : res
    };
  };

  this.make_fsm = function() {
    // Создать конечный автомат.
    // Объект, у него есть ф-ия get(x, y);
    // x -- состояние автомата, y -- очередная лексема
    // Возвращает что нам сделать
    // (shift и следующее состояние автомата или reduce, и правило)
    // Может так же вернуть ошибку,
    // если невозможно произвести свертку или сдвинуть символ

    // Проанализируем все возможные состояние конечного автомата
    // Для начала составим список нетерминалов
    this.grammar_rules.notermlist = [];
    for (var key in this.grammar_rules.rules) {
      this.grammar_rules.notermlist.push(key);
    }

    // Все возможные "символы", которые могут поступит на вход.
    // Т.е. все терминалы, нетерминалы и end (т.е. конец потока лексем)
    var possible_tokens = this.grammar_rules.terms.slice();
    possible_tokens = possible_tokens.concat(this.grammar_rules.notermlist, "end");

    // Теперь состаяние -- это массив массивов вида
    // [СВОРАЧИВАЕМЫЙ_НЕТЕРМИНАЛ, номер правила, позиция в правиле]
    var start_rules = this.extand_state([ [this.grammar_rules.start, 0, 0] ]);

    var red = this.can_reduce(start_rules);
    if (red.status == "Error") { // Если свёртка неоднозначна
      return {
        "status"     : "Error",
        "Error_text" : "Неоднозначная свертка"
      }
    }

    // Массив с состояниями автомата
    var states = [{
      // Номер текущего состояния
      "id" : 0,
      // Набор позиций в правилах
      "rules" : start_rules,
      // Строка-хэш
      "hash_str" : this.rules_to_str(start_rules),
      // Куда надо перейти из этого состояния
      // если встретили очередной символ грамматики
      "goto" : {},
      // Какую свертку можно произвести в текущем состоянии
      "red" : red.result
    }];

    // Объект в котором по "Хэшу" будет лежать id правила,
    // которому принадлежит хэш.
    var hashes = {};
    hashes[states[0].hash_str] = 0;

    // Получим все возможные состояния для данной грамматики
    for (var cur_state = 0; cur_state < states.length; ++cur_state) {
      var t_this = this;
      var  = false;

      // Получить из текущего состояния другие путем сдвигов
      // возможных символов грамматики
      possible_tokens.forEach(function(token) {
        // Если установлен флаг ошибки -- пропускаем
        if (error) return;
        // Получим новый набор правил из текущего путем сдвига символа грамматики
        var new_state_rule = t_this.make_state_by_shift(states[cur_state].rules, token);

        // Если набор пустой -- перейдем к следующему
        if (new_state_rule.length == 0)
          return;

        // Проверим, возможна ли в новом положении свертка
        var red = t_this.can_reduce(new_state_rule);

        // Если она не однозначна -- установим флаг ошибки
        if (red.status == "Error") {
          error = true;
          return;
        }

        // Опишем новое состояние
        var new_state = {
          "id" : states.length,
          "rules" : new_state_rule,
          "hash_str" : t_this.rules_to_str(new_state_rule),
          "goto" : {},       // goto[символ грамматики] = состояние после сдвига
          "red" : red.result // Во что можно свернуть текущее состояние
        };

        // Если оно до этого не встречалось -- положим его в массив с состояниями
        if (typeof hashes[new_state.hash_str] == "undefined") {
          states.push(new_state);
          hashes[new_state.hash_str] = states.length - 1;
        }

        // Путем сдвига текущего символа грамматики можно получить новое состояние
        states[cur_state].goto[token] = hashes[new_state.hash_str];
      });

      // Если где то возможна неоднозначная свертка -- вернем ошибку!
      if (error) {
        return {
          "status"     : "Error",
          "Error_text" : "Неоднозначная свертка"
        }
      }
    }

    // Выводим в консоль получившиеся состояния
    console.log(states);


    // Функция get
    this.fsm.states = states;
    this.fsm.get = function (state, token) {
      var cur_state = this.states[state]; // Текущее состояние
      // Если можно сдвинуть текущий символ,
      // т.е. он есть в хэше goto -- вернем команду сдвига
      if (cur_state.goto[token]) {
        return {
          "command" : "shift",
          "next_state" : cur_state.goto[token]
        }
      }
      else if (cur_state.red) {
        // Иначе, если можно произвести свертку, вернем команду для свертки
        return {
          "command" : "reduce",
          "rule" : cur_state.red
        }
      }
      else {
        // Если нельзя сдвинуть и свернуть -- ошибка, неожиданный символ!
        return {
          "command" : "error"
        }
      }
    };

    return {
    "status" : "Ok"
    }
  };

  // =====================================================================
  // Инициализация
  // Создание по правилам грамматики конечного автомата
  this.init = function(grammar_rules) {
    // Зададим правила грамматики
    this.grammar_rules = grammar_rules;

    // Создадим конечный автомат
    return this.make_fsm();
  };


  // =====================================================================
  // Функция парсинга
  // Принимает массив с лексемами
  this.make_tree = function(lexems) {
    // В стеке объекты вида
    // {name : имя,
    //  childs: [... массив детей ...],
    //  state : st, [lex : лексема]}
    var fsm = this.fsm; // Таблица переходов для автомата
    var stack = []; // Основной стек

    var state = 0;
    var cur_lexem = 0;

    // Вспомогательный стек
    var noterm_stack = [];

    // Проводим разбор
    while ((stack.length != 1 || stack[0].name != this.grammar_rules.start)) {
      // Получаем очередную команду

      // Если стек нетерминалов не пустой
      if (noterm_stack.length != 0) {
        if (noterm_stack[0].name == this.grammar_rules.start) {
          // Если во вспомогательном стеке лежит только стартовое правило
          // Просто переместим его в основной стек
          stack.push(noterm_stack[0]);
          noterm_stack.pop();
          continue;
        }
        // Имя очередного нетерминала в стеке
        var last_name = noterm_stack[noterm_stack.length - 1].name;

        state = 0;
        if (stack.length > 0) {
          state = stack[stack.length - 1].state;
        }

        var command = fsm.get(state, last_name);

        if (command.command == "shift") {
          // Сдвиг
          // Переместим нетерминал из вспомогательного стека в основной
          var to_stack = {
            name : last_name,
            childs: noterm_stack[noterm_stack.length - 1].childs,
            rule: noterm_stack[noterm_stack.length - 1].rule,
            state : command.next_state // Следующее состояние
          };

          stack.push(to_stack);
          noterm_stack.pop(); // Выкинем нетерминал из вспомогательного стека
        }
        else {
          // Произведем свертку
          var cnt = this.grammar_rules.rules[command.rule[0]][command.rule[1]].length;
          var childs = stack.splice(-cnt, cnt);
          var noterm_name = command.rule[0];

          var obj = {
            name : noterm_name,
            childs: childs,
            rule: command.rule
          }

          noterm_stack.push(obj);
        }

        continue;
      }

      // Иначе (если стек нетерминалов пустой)
      // lexem -- очередная лексема
      var lexem;
      if (cur_lexem >= lexems.length) {
        lexem = {
          "type" : "end"
        };
      } else {
        lexem = lexems[cur_lexem];
      }

      var lex_name = lexem.type;

      // Состояние на верхушке стека в автомате (0, если стек пустой)
      state = 0;
      if (stack.length > 0) {
        state = stack[stack.length - 1].state;
      }

      var command = fsm.get(state, lex_name);
      if (command.command == "error") {
        // Вернем ошибку
        return {
          "status" : "Error",
          "info" : {
            "cur_lexem" : cur_lexem,
            "stack" : stack,
            "noterm_stack" : noterm_stack
          }
        }
      }
      else if (command.command == "shift") {
        // Сдвиг
        // Кладём в стек объект, описывающий узел с лексемой
        var to_stack = {
          name : lex_name,
          childs: [],
          state : command.next_state,
          lex : lexem
        }

        stack.push(to_stack);

        // Переходим к следующей лексеме
        ++cur_lexem;
      }
      else {
        // Свертка!
        var cnt = this.grammar_rules.rules[command.rule[0]][command.rule[1]].length;
        var childs = stack.splice(-cnt, cnt);
        var noterm_name = command.rule[0];

        var obj = {
          name : noterm_name,
          childs: childs,
          rule: command.rule
        }

        noterm_stack.push(obj);
      }
    }

    return {
      "status" : "Ok",
      "tree" : stack[0]
    };
  }
 }
