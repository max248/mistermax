func bin_pow(a int, st int) int {
    var res int

    if (st == 0) {
        return 1
    }

    res = bin_pow(a, st / 2)
    res = res * res

    if (st % 2 == 1) {
        res = res * a
    }
    return res
}

func calc_e() float64 {
    var res float64
    var buf float64
    var n int

    buf = 1.0
    res = 2.0

    // sum(1 / n!) n принадлежит [0, inf]
    for n = 2; n < 100; n = n + 1 {
        // Без приведения типа на эту строчку ругается
        buf = buf / float64(n)
        res = res + buf
    }

    return res
}


func random_f(seed int) int {
    var a int
    var c int
    var m int
    a = 45
    c = 21
    m = 67

    return (a * seed + c) % m
}


func calc_next_step(field [][]bool, width int, height int) [][]bool {
    var res [][]bool
    var i int
    var j int
    var n_i int
    var n_j int

    // Колличество соседей
    var n_cnt int

    var dx int
    var dy int
    res = make([][]bool, height)

    for i = 0; i < height; i = i + 1 {
        res[i] = make([]bool, width)
    }

    for i = 0; i < height; i = i + 1 {
        for j = 0; j < width; j = j + 1 {
            // Посчитаем соседей текущей клетки
            n_cnt = 0
            for dx = -1; dx <= 1; dx = dx + 1 {
               for dy = -1; dy <= 1; dy = dy + 1 {
                   n_i = i + dx
                   n_j = j + dy

                   if n_i >= 0 && n_i < height && n_j >= 0 && n_j < width && !(dx == 0 && dy == 0)  {
                       if field[n_i][n_j] {
                           n_cnt = n_cnt + 1
                       }
                   }
               }
            }

            if field[i][j] {
                res[i][j] = n_cnt == 3 || n_cnt == 2
            } else {
                res[i][j] = n_cnt == 3
            }
        }
    }

    return res
}


func show(field [][]bool, width int, height int) {
    var i int
    var j int

    for i = 0; i < height; i = i + 1 {
        for j = 0; j < width; j = j + 1 {
            if (field[i][j]) {
                fmt.Print("+")
            } else {
                fmt.Print(" ")
            }
        }
        fmt.Print("\n")
    }
}


func game_of_life(width int, height int) {
    // Создадим поле размером width x height
    var field [][]bool
    var i int
    var j int
    var last_rnd int
    var str_del string
    var step_cnt int
    step_cnt = 100

    // Сформируем поле в начале и заполним его случайными числами
    field = make([][]bool, height)
    last_rnd = 0
    for i = 0; i < height; i = i + 1 {
        field[i] = make([]bool, width)
        for j = 0; j < width; j = j + 1 {
            last_rnd = random_f(last_rnd)
            field[i][j] = last_rnd % 4 == 1
        }
    }

    // Выведем результат на экран
    show(field, width, height)

    str_del = "[====================]\n"
    fmt.Print(str_del)

    for step_cnt != 0 {
        field = calc_next_step(field, width, height)
        show(field, width, height)
        fmt.Print(str_del)
        step_cnt = step_cnt - 1
    }
}


func main () {
    var option int

    fmt.Print("Select option:\n")
    fmt.Scan(&option)

    if option == 0 {
        game_of_life(30, 30)
    } else if option == 1 {
        fmt.Print(calc_e(), "\n")
    } else {
        fmt.Print(bin_pow(2, 11), "\n")
    }
}