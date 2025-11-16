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

	for {
		msgType, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}

		if !ok {
			// conn.WriteMessage(1, "{Session not found or something}")

			return
		}

		var otherConn *websocket.Conn
		if partyIsA {
			otherConn = openSession.bConn
		} else {
			otherConn = openSession.aConn
		}

		if otherConn == nil {
			// conn.WriteMessage(msgType, "other party is not connected to websocket")
			continue
		}

		err = otherConn.WriteMessage(msgType, msg)
		if err != nil {
			// do something here
		}
	}

}
