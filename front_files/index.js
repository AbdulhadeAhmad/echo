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

  function mockConnectP2P() {
    if (wsConnected) {
      return;
    }

    wsConnected = true;
    setChatInputEnabled(true);
    appendMessage(
      "system",
      "Pretend the RTCDataChannel is open now. Replace this with real WebRTC events."
    );
  }

  function sendChatMessage(text) {
    if (!wsConnected) {
      appendMessage(
        "system",
        "Mock mode: sending locally. Wire this up to RTCDataChannel.send()."
      );
    }

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

      connectWebSocket()

    } catch (err) {
      console.error(err);
      alert(err && err.message ? err.message : "Could not create session.");
      resetState();
    } finally {
      createBtn.disabled = false;
    }
  }

  function joinSession() {
    var id = sessionIdInput.value.trim();
    if (!id) {
      sessionIdInput.focus();
      return;
    }

    currentSessionId = id;
    currentParty = "B";
    showChat();

    appendMessage(
      "system",
      "TODO: connect to /api/signal/session/" +
      currentSessionId +
      "/party/B via WebSocket."
    );
    connectWebSocket()
  }

  function connectWebSocket() {
    // supporting ws for local testing.
    var schema = window.location.protocol === "https" ? "wss://" : "ws://"

    var wsURL = schema + window.location.host +

      "/api/signal/session/" + currentSessionId + "/party/" + currentParty

    ws = new WebSocket(wsURL)

    ws.onopen = () => appendMessage("system", "Connected to WS")

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
