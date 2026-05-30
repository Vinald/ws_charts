class WebSocketChatApp {
    constructor() {
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

        document.getElementById("username-form").onsubmit = (e) => {
            e.preventDefault();
            const name = document.getElementById("username-input").value.trim();
            if (!name) return;
            this.username = name;
            localStorage.setItem("chat_username", name);
            overlay.style.display = "none";
            this.init();
        };
    }

    init() {
        this.connect();
        this.setupEventListeners();
    }

    connect() {
        this.historyDividerShown = false;
        try {
            this.ws = new WebSocket("ws://localhost:8000/ws");

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
                const li = this.addMessage(message, "sent", null, id);
                this.pendingMessages.set(id, li);
                this.ws.send(JSON.stringify({ type: "message", id, message, username: this.username }));
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
        if (data.type === "ack") {
            const li = this.pendingMessages.get(data.id);
            if (li) {
                const tick = li.querySelector(".message-tick");
                if (tick) {
                    tick.textContent = "✓✓";
                    tick.classList.add("delivered");
                }
                this.pendingMessages.delete(data.id);
            }

        } else if (data.type === "ping") {
            this.ws.send(JSON.stringify({ type: "pong" }));

        } else if (data.type === "typing") {
            this.showTypingIndicator(data.username);

        } else if (data.type === "message") {
            if (data.history && !this.historyDividerShown) {
                this.addDivider("Earlier messages");
                this.historyDividerShown = true;
            }
            this.addMessage(data.message, "received", data.username, null, data.timestamp, data.history);
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

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        if (username) {
            const sender = document.createElement("div");
            sender.className = "message-sender";
            sender.textContent = username;
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
    new WebSocketChatApp();
});
