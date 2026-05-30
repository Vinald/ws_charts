class WebSocketChatApp {
    constructor(roomId = "default") {
        this.roomId = roomId;
        this.ws = null;
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
        this.reconnectTimer = null;
        this.typingTimer = null;
        this.pendingMessages = new Map();
        this.historyDividerShown = false;
        this.username = localStorage.getItem("chat_username");

        if (this.username) {
            this.init();
        } else {
            this.showUsernamePrompt();
        }
    }

    showUsernamePrompt() {
        const overlay = document.getElementById("username-overlay");
        overlay.style.display = "flex";
        const input = document.getElementById("username-input");
        input.focus();

        document.getElementById("username-form").onsubmit = (e) => {
            e.preventDefault();
            const name = input.value.trim();
            
            if (!name || name.length < 2) {
                input.classList.add("shake");
                setTimeout(() => input.classList.remove("shake"), 500);
                return;
            }
            
            this.username = name;
            localStorage.setItem("chat_username", name);
            overlay.style.display = "none";
            this.init();
        };
        
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                document.getElementById("username-form").dispatchEvent(new Event("submit"));
            }
        });
    }

    init() {
        this.connect();
        this.setupEventListeners();
    }

    connect() {
        this.historyDividerShown = false;
        try {
            const wsUrl = new URL("ws://localhost:8000/ws", window.location.href);
            wsUrl.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            wsUrl.searchParams.set("room", this.roomId);
            
            this.ws = new WebSocket(wsUrl.toString());

            this.ws.onopen = () => {
                this.reconnectDelay = 1000;
                this.updateConnectionStatus("online");
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };

            this.ws.onclose = () => {
                this.updateConnectionStatus("offline");
                this.scheduleReconnect();
            };

            this.ws.onerror = () => {
                this.updateConnectionStatus("offline");
            };
        } catch (error) {
            console.error("WebSocket init failed:", error);
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        clearTimeout(this.reconnectTimer);
        this.updateConnectionStatus("reconnecting");
        this.reconnectTimer = setTimeout(() => {
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
            this.connect();
        }, this.reconnectDelay);
    }

    setupEventListeners() {
        const form = document.getElementById("message-form");
        const input = document.getElementById("message");

        form.onsubmit = (event) => {
            event.preventDefault();
            const message = input.value.trim();
            if (!message) return;

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const id = crypto.randomUUID();
                const li = this.addMessage(message, "sent", this.username, id);
                this.pendingMessages.set(id, li);
                const payload = { type: "message", id, message, username: this.username };
                console.log("Sending message:", payload);
                this.ws.send(JSON.stringify(payload));
            } else {
                alert("Not connected");
            }
            input.value = "";
            input.focus();
        };

        let lastTypingSent = 0;
        input.addEventListener("input", () => {
            const now = Date.now();
            if (this.ws && this.ws.readyState === WebSocket.OPEN && now - lastTypingSent > 1000) {
                this.ws.send(JSON.stringify({ type: "typing", username: this.username }));
                lastTypingSent = now;
            }
        });
    }

    handleMessage(data) {
        if (!data) {
            console.error("Received null/undefined data");
            return;
        }
        
        if (!data.type) {
            console.warn("Received data without type field:", data);
            return;
        }
        
        console.log("Received data:", data);
        
        if (data.type === "ack") {
            console.log("ACK received for id:", data.id);
            console.log("Pending messages:", Array.from(this.pendingMessages.keys()));
            const li = this.pendingMessages.get(data.id);
            if (li) {
                console.log("Found pending message, updating tick");
                const tick = li.querySelector(".message-tick");
                console.log("Tick element:", tick);
                if (tick) {
                    tick.textContent = "✓✓";
                    tick.classList.add("delivered");
                    console.log("Tick updated to double tick");
                }
                this.pendingMessages.delete(data.id);
            } else {
                console.warn("ACK received but no pending message found for id:", data.id);
            }

        } else if (data.type === "ping") {
            console.log("Ping received, sending pong");
            this.ws.send(JSON.stringify({ type: "pong" }));

        } else if (data.type === "typing") {
            console.log("Typing indicator from:", data.username);
            this.showTypingIndicator(data.username);

        } else if (data.type === "message") {
            // Display messages from other clients
            // Safety check: only display if message has actual content
            if (!data.message) {
                console.warn("Received message without content:", data);
                return;
            }
            
            console.log("Displaying message from:", data.username);
            if (data.history && !this.historyDividerShown) {
                this.addDivider("Earlier messages");
                this.historyDividerShown = true;
            }
            this.addMessage(data.message, "received", data.username, null, data.timestamp, data.history);
        } else {
            console.log("Unknown message type, ignoring:", data);
        }
    }

    addDivider(label) {
        const messagesList = document.getElementById("messages-list");
        const li = document.createElement("li");
        li.className = "messages-divider";
        li.textContent = label;
        messagesList.appendChild(li);
    }

    showTypingIndicator(username) {
        const status = document.getElementById("connection-status");
        status.textContent = `${username} is typing...`;
        status.className = "header-status typing";

        clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => {
            if (status.classList.contains("typing")) {
                const isOnline = this.ws && this.ws.readyState === WebSocket.OPEN;
                this.updateConnectionStatus(isOnline ? "online" : "offline");
            }
        }, 2000);
    }

    addMessage(text, direction, username = null, id = null, isoTimestamp = null, isHistory = false) {
        const messagesList = document.getElementById("messages-list");
        const li = document.createElement("li");
        li.className = `message-item ${direction}${isHistory ? " history" : ""}`;
        if (id) {
            li.dataset.messageId = id;
        }

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        // Show username for both sent and received messages
        if (username || (direction === "sent" && this.username)) {
            const sender = document.createElement("div");
            sender.className = "message-sender";
            sender.textContent = username || this.username;
            bubble.appendChild(sender);
        }

        const textEl = document.createElement("div");
        textEl.className = "message-text";
        textEl.textContent = typeof text === "object" ? JSON.stringify(text) : text;
        bubble.appendChild(textEl);

        const meta = document.createElement("div");
        meta.className = "message-meta";

        const ts = document.createElement("span");
        ts.className = "message-timestamp";
        const date = isoTimestamp ? new Date(isoTimestamp) : new Date();
        ts.textContent = date.toLocaleTimeString("en-US", {
            hour12: false, hour: "2-digit", minute: "2-digit",
        });
        meta.appendChild(ts);

        if (direction === "sent") {
            const tick = document.createElement("span");
            tick.className = "message-tick";
            tick.textContent = "✓";
            tick.setAttribute("data-tick-id", id);
            meta.appendChild(tick);
        }

        bubble.appendChild(meta);
        li.appendChild(bubble);
        messagesList.appendChild(li);

        while (messagesList.children.length > 100) {
            messagesList.removeChild(messagesList.firstChild);
        }

        document.querySelector(".messages-area").scrollTop = Number.MAX_SAFE_INTEGER;
        return li;
    }

    updateConnectionStatus(state) {
        const status = document.getElementById("connection-status");
        status.className = "header-status";
        if (state === "online") {
            status.textContent = "online";
            status.classList.add("connected");
        } else if (state === "reconnecting") {
            status.textContent = "reconnecting...";
            status.classList.add("reconnecting");
        } else {
            status.textContent = "offline";
            status.classList.add("disconnected");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Get room ID from URL params or use default
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get("room") || "default";
    new WebSocketChatApp(roomId);
});
