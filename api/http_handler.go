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

func serveStaticFile(fileName string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "front_files/"+fileName)
	}
}

func BuildRouter(listenAddress string) {
	mainRouter := mux.NewRouter()

	mainRouter.HandleFunc("/ping", ping)
	mainRouter.HandleFunc("/", serveStaticFile("index.html"))
	mainRouter.HandleFunc("/index.js", serveStaticFile("index.js"))
	mainRouter.HandleFunc("/index.css", serveStaticFile("index.css"))

	// api_router := base_router.PathPrefix("/api").Subrouter()

	err := http.ListenAndServe(listenAddress, mainRouter)

	if err != nil {
		log.Fatalf("Error running the web server %s", err)
	}
}
