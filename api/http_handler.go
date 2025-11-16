package api

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"echo/misc"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
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

	sessionsMu.RLock()
	var id string
	for {
		id, _ = misc.RandomString(10)

		_, ok := openSessions[id]
		if !ok {
			break // make sure we don't have duplicated ids
		}

	}
	sessionsMu.RUnlock()

	session := Session{
		id:                     id,
		lastInteractionTime:    time.Now(),
		lastInteractedPartyIsA: true,
	}

	sessionsMu.Lock()
	openSessions[session.id] = session
	sessionsMu.Unlock()

	fmt.Fprintf(w,
		`{
	"sessionId":%s
}`, session.id)
}

var upgrader = websocket.Upgrader{}

func signalWS(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	partyStr := vars["party"]
	sessionId := vars["session"]

	fmt.Printf("Initiating a websocket, party=%s session=%s\n", partyStr, sessionId)
	partyIsA := true
	switch partyStr {
	case "A":

	case "B":
		partyIsA = false
	default:
		fmt.Printf("Party is invalid partyStr=%s", partyStr)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		fmt.Printf("Error initiating websocket, r.URL=%s party=%v e=%s", r.URL.String(), partyIsA, err)
	}

	websocketSignaler(conn, partyIsA, sessionId)

}

func BuildRouter(listenAddress string) {
	mainRouter := mux.NewRouter()

	mainRouter.HandleFunc("/ping", ping)
	mainRouter.HandleFunc("/", serveStaticFile("index.html"))
	mainRouter.HandleFunc("/index.js", serveStaticFile("index.js"))
	mainRouter.HandleFunc("/index.css", serveStaticFile("index.css"))
	mainRouter.HandleFunc("/favicon.svg", serveStaticFile("favicon.svg"))

	api_router := mainRouter.PathPrefix("/api").Subrouter()
	api_router.HandleFunc("/session", createSession).Methods("POST")
	api_router.HandleFunc("/signal/session/{session}/party/{party}", signalWS)

	err := http.ListenAndServe(listenAddress, mainRouter)

	if err != nil {
		log.Fatalf("Error running the web server %s", err)
	}
}
