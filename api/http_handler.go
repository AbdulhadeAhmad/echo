package api

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func ping(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "pong")
}

func BuildRouter(listenAddress string) {
	mainRouter := mux.NewRouter()

	mainRouter.HandleFunc("/ping", ping)

	// api_router := base_router.PathPrefix("/api").Subrouter()

	err := http.ListenAndServe(listenAddress, mainRouter)

	if err != nil {
		log.Fatalf("Error running the web server %s", err)
	}
}
