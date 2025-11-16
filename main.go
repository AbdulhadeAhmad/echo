package main

import (
	"echo/api"
	"fmt"
)

func main() {
	fmt.Println("Hello from echo-echo-cho-o")

	api.BuildRouter("localhost:8080")
}
