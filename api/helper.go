package api

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Session struct {
	id                     string
	aConn                  *websocket.Conn
	bConn                  *websocket.Conn
	lastInteractionTime    time.Time
	lastInteractedPartyIsA bool
}

var openSessions = make(map[string]Session)
var sessionsMu sync.RWMutex
