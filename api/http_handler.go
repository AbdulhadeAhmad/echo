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
		// TODO: check out why does this even need the request? does it take the file path from it,
		// is is possible to manipulate the path like using .. to get around?!
		http.ServeFile(w, r, "front_files/"+fileName)
	}
}

func createSession(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, `
	{
	"sessionId":"XyZ123"
	}
	`)
}

func signalWS(w http.ResponseWriter, r *http.Request) {
	// This will create the websocket for the signaling service.
	vars := mux.Vars(r)
	party := vars["party"]
	session := vars["session"]

	fmt.Printf("Initiating a websocket, party=%s session=%s", party, session)

}

func BuildRouter(listenAddress string) {
	mainRouter := mux.NewRouter()

	mainRouter.HandleFunc("/ping", ping)
	mainRouter.HandleFunc("/", serveStaticFile("index.html"))
	mainRouter.HandleFunc("/index.js", serveStaticFile("index.js"))
	mainRouter.HandleFunc("/index.css", serveStaticFile("index.css"))

	api_router := mainRouter.PathPrefix("/api").Subrouter()
	api_router.HandleFunc("/session", createSession).Methods("POST")
	api_router.HandleFunc("/signal/session/{session}/party/{party}", signalWS)

	err := http.ListenAndServe(listenAddress, mainRouter)

	if err != nil {
		log.Fatalf("Error running the web server %s", err)
	}
}
