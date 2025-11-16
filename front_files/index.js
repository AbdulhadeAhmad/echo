console.log("Echo mock frontend loaded");

(function () {
  var createBtn = document.getElementById("create-session-btn");
  var joinBtn = document.getElementById("join-session-btn");
  var sessionIdInput = document.getElementById("session-id");

  var landingCard = document.getElementById("landing-card");
  var chatCard = document.getElementById("chat-card");
  var chatLog = document.getElementById("chat-log");
  var chatForm = document.getElementById("chat-form");
  var chatInput = document.getElementById("chat-input");
  var chatSendBtn = document.getElementById("chat-send-btn");
  var leaveBtn = document.getElementById("leave-session-btn");
  var sessionInfoEl = document.getElementById("chat-session-info");

  if (
    !createBtn ||
    !joinBtn ||
    !sessionIdInput ||
    !landingCard ||
    !chatCard ||
    !chatLog ||
    !chatForm ||
    !chatInput ||
    !chatSendBtn ||
    !leaveBtn ||
    !sessionInfoEl
  ) {
    console.warn("Echo UI elements not found, aborting mock init");
    return;
  }

  var currentSessionId = null;
  var currentParty = null; // "A" (offerer) or "B" (answerer)
  var wsConnected = false;
  var ws = null;
  var pc = null;
  var rc = null;
  var lastSignal = null; // saving the last signal to send it on client connect
  var dataChannel = null

  function setSessionInfo(text) {
    var partyLabel =
      currentParty === "A"
        ? "You are party A (offerer side)"
        : currentParty === "B"
          ? "You are party B (answerer side)"
          : "";

    sessionInfoEl.textContent = partyLabel
      ? text + " · " + partyLabel
      : text;
  }

  function appendMessage(kind, text) {
    if (!chatLog) return;

    var item = document.createElement("div");
    item.classList.add("chat-message");

    if (kind === "me") {
      item.classList.add("me");
    } else if (kind === "them") {
      item.classList.add("them");
    } else {
      item.classList.add("system");
    }

    item.textContent = text;
    chatLog.appendChild(item);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function setChatInputEnabled(enabled) {
    chatInput.disabled = !enabled;
    chatSendBtn.disabled = !enabled;
  }

  function resetState() {
    currentSessionId = null;
    currentParty = null;
    wsConnected = false;
    setChatInputEnabled(false);
  }

  function showLanding() {
    landingCard.classList.remove("hidden");
    chatCard.classList.add("hidden");
    sessionIdInput.value = "";
    resetState();
  }

  function showChat() {
    landingCard.classList.add("hidden");
    chatCard.classList.remove("hidden");
    chatLog.innerHTML = "";
    setChatInputEnabled(false);

    if (!currentSessionId) {
      return;
    }

    if (currentParty === "A") {
      setSessionInfo(
        "Session ID: " + currentSessionId + " (share this with your peer)"
      );
      appendMessage(
        "system",
        "Session created. TODO: open a WebSocket for signaling and send an SDP offer."
      );
    } else {
      setSessionInfo("Joined session: " + currentSessionId);
      appendMessage(
        "system",
        "Joined session. TODO: connect to the signaling WebSocket and respond with an SDP answer."
      );
    }

    appendMessage(
      "system",
      "Mock mode: no real signaling or WebRTC yet. Everything stays local."
    );
  }



  function sendChatMessage(text) {
    if (!wsConnected) {
      appendMessage(
        "system",
        "Mock mode: sending locally. Wire this up to RTCDataChannel.send()."
      );
    }


    dataChannel.send(text)

    appendMessage("me", text);



    if (!wsConnected) {
      appendMessage(
        "them",
        "(Simulated peer) Replace with your RTCDataChannel onmessage handler."
      );
    }
  }

  async function createSession() {
    if (createBtn.disabled) return;
    createBtn.disabled = true;

    try {
      var response = await fetch("/api/session", {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(
          "Failed to create session (" + response.status + ")"
        );
      }

      var data = await response.json();
      if (!data || !data.sessionId) {
        throw new Error("Session ID missing in response.");
      }

      currentSessionId = String(data.sessionId);
      currentParty = "A";
      showChat();

      appendMessage(
        "system",
        "Created session"
      );

      await connectWebSocket()

    } catch (err) {
      console.error(err);
      alert(err && err.message ? err.message : "Could not create session.");
      resetState();
    } finally {
      createBtn.disabled = false;
    }
  }

  async function joinSession() {
    var id = sessionIdInput.value.trim();
    if (!id) {
      sessionIdInput.focus();
      return;
    }

    currentSessionId = id;
    currentParty = "B";
    showChat();

    await connectWebSocket()
  }

  async function connectWebSocket() {
    // supporting ws for local testing.
    var schema = window.location.protocol === "https" ? "wss://" : "ws://"

    var wsURL = schema + window.location.host +

      "/api/signal/session/" + currentSessionId + "/party/" + currentParty

    ws = new WebSocket(wsURL)

    ws.onopen = () => {
      appendMessage("system", "Connected to WS")


      if (currentParty == "A") {
        createChannel()
      } else {
        sendSignal({ "type": "hello" })
      }
    }
    ws.onmessage = async (event) => {
      var event_data = event.data
      console.log("Received from WS", event_data, typeof (event_data))
      var payload = JSON.parse(event_data)
      await handleWebSocketEvent(payload)
    }




  }
  function sendSignal(payload) {
    if (!payload) {
      console.warn("Attempted to send empty signaling payload")
      return
    }
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return
    }
    try {
      ws.send(JSON.stringify(payload));
    } catch (err) {
      console.error("Failed to send signal", err)
    }
  }

  async function handleWebSocketEvent(payload) {
    console.log("Handling WS Event, payload.type", payload.type, payload, typeof (payload))

    if (payload.type == "offer") {
      await handleOffer(payload)
    } else if (payload.type == "hello" && lastSignal) {
      sendSignal(lastSignal)
    }
  }

  async function handleOffer(offer) {
    console.log("New offer", offer)

    if (!rc) {
      rc = new RTCPeerConnection()
    }

    rc.onicecandidate = e => {
      console.log(" NEW ice candidate!! reprinting SDP ")
      console.log(JSON.stringify(rc.localDescription))
    }


    rc.ondatachannel = e => {

      const receiveChannel = e.channel;
      receiveChannel.onmessage = e => console.log("message received!!!" + e.data)
      receiveChannel.onopen = e => console.log("open!!!!");
      receiveChannel.onclose = e => console.log("closed!!!!!!");
      rc.channel = receiveChannel;

    }


    await rc.setRemoteDescription(offer)
    console.log("Remote description applied")

    var answer = await rc.createAnswer()
    await rc.setLocalDescription(answer)
    console.log("Answer", JSON.stringify(rc.localDescription))
    sendSignal(rc.localDescription)
    lastSignal = rc.localDescription
  }

  function createChannel() {
    pc = new RTCPeerConnection()


    pc.onicecandidate = e => {
      console.log(" NEW ice candidate!! on pc reprinting SDP ")
      console.log(JSON.stringify(pc.localDescription))
      if (pc.localDescription) {
        sendSignal(pc.localDescription)
        lastSignal = pc.localDescription
      }

    }


    const sendChannel = pc.createDataChannel("sendChannel");
    sendChannel.onmessage = e => {
      console.log("messsage received!!!" + e.data)
      appendMessage("them", e.data)
    }
    sendChannel.onopen = e => {
      console.log("open!!!!")
      setChatInputEnabled(true)
    };
    sendChannel.onclose = e => {
      console.log("closed!!!!!!")
      setChatInputEnabled(false)
    };

    dataChannel = sendChannel


    pc.createOffer().then(o => pc.setLocalDescription(o))
  }


  createBtn.addEventListener("click", function () {
    createSession();
  });

  joinBtn.addEventListener("click", function () {
    joinSession();
  });

  sessionIdInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      joinSession();
    }
  });

  chatForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var text = chatInput.value.trim();
    if (!text) {
      return;
    }

    sendChatMessage(text);
    chatInput.value = "";
    chatInput.focus();
  });

  leaveBtn.addEventListener("click", function () {
    showLanding();
  });

  // Initial state
  setChatInputEnabled(false);
})();
