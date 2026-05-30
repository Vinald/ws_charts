class WebSocketChatApp {
    constructor() {
        this.ws = null;
        this.init();
    }

    init() {
        this.setupWebSocket();
        this.setupEventListeners();
    }

    setupWebSocket() {
        try {
            this.ws = new WebSocket("ws://localhost:8000/ws");

            this.ws.onopen = () => {
                console.log("WebSocket connection established");
                this.updateConnectionStatus(true);
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.addMessage(data.message, "received");
            };

            this.ws.onclose = () => {
                console.log("WebSocket connection closed");
                this.updateConnectionStatus(false);
            };

            this.ws.onerror = (error) => {
                console.error("WebSocket error:", error);
                this.updateConnectionStatus(false);
            };
        } catch (error) {
            console.error("Failed to initialize WebSocket:", error);
            this.updateConnectionStatus(false);
        }
    }

    setupEventListeners() {
        const form = document.getElementById("message-form");
        form.onsubmit = (event) => {
            event.preventDefault();
            const input = document.getElementById("message");
            const message = input.value.trim();

            if (message) {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.addMessage(message, "sent");
                    this.ws.send(JSON.stringify({ message }));
                } else {
                    alert("WebSocket is not connected");
                }
                input.value = "";
                input.focus();
            }
        };
    }

    addMessage(text, direction) {
        const messagesList = document.getElementById("messages-list");
        const li = document.createElement("li");
        const timestamp = new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
        });

        li.className = `message-item ${direction}`;
        li.innerHTML = `
            <div class="message-bubble">
                <div class="message-text">${typeof text === "object" ? JSON.stringify(text) : text}</div>
                <div class="message-timestamp">${timestamp}</div>
            </div>
        `;
        messagesList.appendChild(li);

        while (messagesList.children.length > 100) {
            messagesList.removeChild(messagesList.firstChild);
        }

        const messagesArea = document.querySelector(".messages-area");
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    updateConnectionStatus(isConnected) {
        const status = document.getElementById("connection-status");
        if (isConnected) {
            status.textContent = "online";
            status.className = "header-status connected";
        } else {
            status.textContent = "offline";
            status.className = "header-status disconnected";
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new WebSocketChatApp();
});
