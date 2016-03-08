func main() {
    var i int
    var j int

    j = 10
    for i = 0; i < j; i = i + 1 {
        // Забыли закрыть скобку
        fmt.Print(i + j}
}