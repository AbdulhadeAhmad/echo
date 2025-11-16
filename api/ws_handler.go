package api

import (
	"fmt"
	"time"

	"github.com/gorilla/websocket"
)

func websocketSignaler(conn *websocket.Conn, partyIsA bool, sessionId string) {
	defer conn.Close()

	sessionsMu.RLock()
	openSession, ok := openSessions[sessionId]
	sessionsMu.RUnlock()

	if !ok {
		// conn.WriteMessage(1, "{Session not found or something}")

		return
	}

	fmt.Println("Session", openSession)

	if partyIsA {
		if openSession.aConn != nil {
			openSession.aConn.Close()
		}
		openSession.aConn = conn
		if !openSession.lastInteractedPartyIsA {
			openSession.lastInteractedPartyIsA = true
			openSession.lastInteractionTime = time.Now()
		}
	} else {
		if openSession.bConn != nil {
			openSession.bConn.Close()
		}
		openSession.bConn = conn

		if openSession.lastInteractedPartyIsA {
			openSession.lastInteractedPartyIsA = false
			openSession.lastInteractionTime = time.Now()
		}
	}

	sessionsMu.Lock()
	openSessions[openSession.id] = openSession
	sessionsMu.Unlock()

	for {
		msgType, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}

		// Let's just echo for now as a placeholder

		err = conn.WriteMessage(msgType, msg)
		if err != nil {
			break
		}
	}

}
