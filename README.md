# Echo

Echo is a browser-based peer-to-peer text chat for two participants. A Go server serves the web interface, creates sessions, and relays WebRTC signaling over WebSockets. Chat messages travel directly between browsers over a WebRTC data channel. The interface mentions file transfers, which are still unimplemented.

## Run locally

Install Go 1.22.2 or later and run this command from the repository root so the server can find `front_files/`.

```sh
go run .
```

Open [http://localhost:8900](http://localhost:8900) in a browser with WebRTC support.

## Run with Docker Compose

With Docker and the Compose plugin installed, run this command from the repository root.

```sh
docker compose up --build
```

Open [http://localhost:8900](http://localhost:8900). Use `docker compose down` to stop and remove the Compose containers and network. The Dockerfile builds a Linux AMD64 binary.

## Start a chat

1. Open Echo and click **Create a session**.
2. Share the session ID shown in the chat header with the other participant.
3. Have the other participant open the same Echo server, paste the ID under **Join a session**, and click **Join**.
4. Once the peer connection opens, send messages using the chat input. To try it locally, use two tabs.

The server keeps sessions in memory, so restarting it invalidates existing session IDs. The browser does not configure STUN or TURN servers, so peer connections can fail across separate networks or restrictive firewalls.

## Server endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /` | Serves the browser interface. |
| `GET /ping` | Returns `pong`. |
| `POST /api/session` | Creates a session and returns its `sessionId`. |
| `GET /api/signal/session/{session}/party/{party}` | Upgrades to a signaling WebSocket for party `A` (creator) or `B` (joiner). |

`main.go` starts the server, `api/` handles HTTP and WebSocket requests, and `front_files/` contains the HTML, CSS, and JavaScript.
