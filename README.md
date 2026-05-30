# WebSocket Real-Time Chart Application

A modern, full-stack application for real-time data visualization using WebSocket and Chart.js.

## Project Structure

```
ws_charts/
├── frontend/                    # Frontend application (Static files)
│   ├── index.html              # Main HTML file
│   ├── styles.css              # Custom styling
│   └── script.js               # JavaScript logic
│
└── backend/                     # Backend API server (FastAPI)
    ├── requirements.txt         # Python dependencies
    └── app/
        ├── __init__.py
        ├── app.py              # FastAPI application
        ├── manager.py          # WebSocket manager
        └── __pycache__/

```

## Features

- 🔄 **Real-time WebSocket Communication** - Bidirectional communication with the server
- 📊 **Interactive Chart** - Visualize incoming data using Chart.js
- 📝 **Message Log** - Keep track of all incoming messages with timestamps
- 📈 **Live Statistics** - Display current value, average, min, and max
- 🎨 **Modern UI** - Clean, responsive design with Bootstrap 5
- 🌙 **Connection Status** - Real-time indicator of WebSocket connection state

## Setup Instructions

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run the server:**
   ```bash
   cd backend
   python -m uvicorn app.app:app --reload --host 0.0.0.0 --port 8000
   ```

   The server will be available at `http://localhost:8000`

### Frontend

The frontend is served automatically by the backend server at `http://localhost:8000/`

No separate build or installation is required for the frontend.

## Usage

1. **Send Messages:**
   - Enter numeric values in the message input field
   - Click "Send" or press Enter
   - The value will be transmitted via WebSocket to the server and broadcasted to all connected clients

2. **View Data:**
   - See the real-time chart update with incoming data points
   - Monitor the message log on the right sidebar
   - Check live statistics (current value, average, min, max)
   - Observe connection status in the top navbar

## Technology Stack

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with gradient backgrounds
- **JavaScript (ES6+)** - WebSocket client and chart management
- **Chart.js** - Data visualization
- **Bootstrap 5** - Responsive UI framework

### Backend
- **FastAPI** - Web framework
- **WebSocket** - Real-time communication
- **Python 3.10+** - Programming language

## File Descriptions

### Frontend Files

**index.html**
- Main entry point of the application
- Contains the layout with chart area, sidebar, and message log
- Loads Bootstrap, Chart.js, and custom scripts

**styles.css**
- Custom styling for the application
- Gradient background, card styling, responsive design
- Custom scrollbar styling
- Animation for connection status indicator

**script.js**
- `WebSocketChartApp` class that manages the entire application
- Handles WebSocket connections and message handling
- Manages chart updates and statistics calculations
- Updates UI based on connection status and incoming data

### Backend Files

**app.py**
- Main FastAPI application
- Serves the frontend's index.html at root path
- Mounts static files (CSS, JS) from the frontend folder
- Defines WebSocket endpoint `/ws`

**manager.py**
- `WebSocketManager` class for managing WebSocket connections
- Handles client connections and disconnections
- Broadcasts messages to all connected clients

## API Endpoints

### HTTP
- `GET /` - Returns the main HTML file
- `GET /static/{filepath}` - Serves static assets (CSS, JS)

### WebSocket
- `WS /ws` - WebSocket endpoint for real-time communication

### WebSocket Message Format
```json
{
  "message": "42"
}
```

## Development Notes

- The chart displays the last 20 data points
- The message log keeps track of the last 50 messages
- Statistics are calculated in real-time from all received numeric values
- The frontend automatically attempts to connect to the WebSocket server at `ws://localhost:8000/ws`

## Future Enhancements

- Add authentication and user management
- Implement data persistence and history
- Add export functionality for data
- Multi-chart support
- Real-time notifications
- Dark/Light theme toggle
- Data filtering and aggregation options

## Troubleshooting

**"Chart is not defined" error**
- Ensure Chart.js library is loaded from CDN
- Check browser console for network errors

**WebSocket Connection Failed**
- Verify backend server is running on port 8000
- Check browser console for connection errors
- Ensure firewall isn't blocking WebSocket connections

**Static files not loading**
- Verify frontend folder exists in the correct location
- Check FastAPI is mounting static files correctly
- Clear browser cache and reload

## License

MIT
