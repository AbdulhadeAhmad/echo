package main

import (
	"echo/api"
	"fmt"
)

func main() {
	fmt.Println("Hello from echo-echo-cho-o")
	fmt.Println("Listening to port 8900")

	api.BuildRouter(":8900")
}
