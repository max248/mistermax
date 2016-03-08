function syntax_tree_visualize(syntax_tree) {
    // Для начала создадим div, внутри него будут такие же div
    // с другими деревьями, но они в начале будут скрыты
    // Корневой div можно развернуть, (заголовок блока -- ссылка, по
    // нажатию на который внутренний блок сворачивается/разворачивается

    // {name : lol, childs: [], state : st, [lex : ololo]}

    var main_div = document.createElement('div');
    var main_header = document.createElement('span');
    var childs_div = document.createElement('div');
    childs_div.className = "tree_child_list unvisible";

    //childs_div.appendChild(document.createTextNode("LOL"));
    for (var i = 0; syntax_tree.childs && i < syntax_tree.childs.length; ++i) {
        childs_div.appendChild(syntax_tree_visualize(syntax_tree.childs[i]));
    }

    if (syntax_tree.childs && syntax_tree.childs.length != 0) {
        main_header.style.color = "#55c";
    }

    main_header.appendChild(document.createTextNode(syntax_tree.name));
    if (syntax_tree.lex) {
        if (!syntax_tree.lex.value) {
            //main_header.appendChild(document.createTextNode(" " + syntax_tree.lex));
        } else {
            main_header.appendChild(document.createTextNode(" " + syntax_tree.lex.value[1]));
        }
    }

    if (syntax_tree.type) {
        main_header.appendChild(document.createTextNode(" " + syntax_tree.type));
    }
    main_header.onclick = (function() {
        childs_div.classList.toggle("unvisible");
    });

    main_div.appendChild(main_header);
    main_div.appendChild(childs_div);

    return main_div;
}