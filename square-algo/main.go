package main

import "fmt"

func main() {
	var n int
	fmt.Scan(&n)

	if !(n > 2 && n < 10) {
		if n <= 2 {
			fmt.Println("Terlalu Kecil")
		} else {
			fmt.Println("Terlalu Besar")
		}
		return
	}

	// print kotak
	str := ""
	for i := 0; i < n; i++ {
		str += "="
		// if i ==0 atau i == n - 1, print = sebanyak n kali
		// selain itu, print | sebanyak 2 kali, hanya pada kolom pertama dan terakhir
		for j := 0; j < n; j++ {
			if i == 0 || i == n-1 {
				fmt.Print("=")
				str += "="
			} else {
				if j == 0 || j == n-1 {
					fmt.Print("|")
					str += "|"
				} else {
					fmt.Print(" ")
					str += " "
				}
			}
		}
		fmt.Println()
	}
	fmt.Println(str)
}
