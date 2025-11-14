package api

import "github.com/gorilla/websocket"

func websocketSignaler(conn *websocket.Conn) {
	defer conn.Close()

	for {
		msgType, msg, err := conn.ReadMessage()
		if err != nil {
			return
		}

		// Let's just echo for now as a placeholder

		err = conn.WriteMessage(msgType, msg)
		if err != nil {
			return
		}
	}
}
