# Production-Ready Charts App Structure
## Python Backend + JavaScript Frontend with Docker

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Backend Setup (Python)](#backend-setup-python)
4. [Frontend Setup (JavaScript)](#frontend-setup-javascript)
5. [Docker Configuration](#docker-configuration)
6. [Environment Variables](#environment-variables)
7. [Database Setup](#database-setup)
8. [API Design](#api-design)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [CI/CD Pipeline](#cicd-pipeline)

---

## Project Overview

### Tech Stack
- **Backend:** Python (Flask/FastAPI with WebSockets)
- **Frontend:** React/Vue.js + WebSockets
- **Database:** PostgreSQL
- **Caching:** Redis
- **Containerization:** Docker & Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **Message Queue:** Optional (RabbitMQ/Celery for background tasks)

### Architecture
```
┌─────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)             │
│              Port 80/443 (HTTP/HTTPS)                │
└──────────────┬──────────────────────────────┬────────┘
               │                              │
        ┌──────▼──────┐              ┌────────▼────────┐
        │              │              │                 │
    ┌───┴──────────┐   │      ┌──────┴──────────┐      │
    │   Frontend   │   │      │   Backend       │      │
    │   React/Vue  │   │      │   Flask/FastAPI │      │
    │  Port 3000   │   │      │   Port 5000     │      │
    └──────┬───────┘   │      └────────┬────────┘      │
           │           │               │                │
           └─────┬─────┴───────────────┴──────┬─────────┘
                 │                           │
            ┌────▼──────┐          ┌─────────▼────┐
            │ PostgreSQL │          │    Redis     │
            │  Port 5432 │          │  Port 6379   │
            └───────────┘          └──────────────┘
```

---

## Directory Structure

### Complete Project Layout

```
charts-app/
│
├── docker-compose.yml              # Docker Compose configuration
├── Dockerfile                       # Multi-stage Docker build
├── .dockerignore                    # Docker ignore file
├── .env.example                     # Example environment variables
├── .env.local                       # Local environment (git ignored)
├── .gitignore
├── README.md
├── LICENSE
│
├── backend/                         # Python Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # Application entry point
│   │   ├── config.py                # Configuration management
│   │   ├── extensions.py            # Initialize extensions (db, cache, etc)
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py            # REST API endpoints
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── charts.py        # Charts endpoints
│   │   │   │   ├── data.py          # Data endpoints
│   │   │   │   └── auth.py          # Authentication endpoints
│   │   │   └── v2/
│   │   │       └── ... (future versions)
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── chart.py             # Chart model
│   │   │   ├── dataset.py           # Dataset model
│   │   │   ├── user.py              # User model
│   │   │   └── base.py              # Base model class
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── chart_service.py     # Business logic for charts
│   │   │   ├── data_service.py      # Data processing logic
│   │   │   ├── auth_service.py      # Authentication logic
│   │   │   └── websocket_service.py # WebSocket management
│   │   │
│   │   ├── websockets/
│   │   │   ├── __init__.py
│   │   │   ├── handlers.py          # WebSocket event handlers
│   │   │   ├── managers.py          # Connection management
│   │   │   └── events.py            # Event definitions
│   │   │
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── decorators.py        # Custom decorators
│   │   │   ├── helpers.py           # Helper functions
│   │   │   ├── validators.py        # Input validation
│   │   │   ├── errors.py            # Custom exceptions
│   │   │   └── constants.py         # Constants
│   │   │
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Authentication middleware
│   │   │   ├── cors.py              # CORS middleware
│   │   │   ├── rate_limit.py        # Rate limiting
│   │   │   └── error_handler.py     # Error handling
│   │   │
│   │   ├── tasks/                   # Background tasks (Celery)
│   │   │   ├── __init__.py
│   │   │   ├── data_processing.py
│   │   │   └── notifications.py
│   │   │
│   │   └── migrations/              # Alembic migrations
│   │       └── ...
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py              # Pytest configuration
│   │   ├── test_api/
│   │   │   ├── test_charts.py
│   │   │   ├── test_data.py
│   │   │   └── test_auth.py
│   │   ├── test_services/
│   │   │   ├── test_chart_service.py
│   │   │   └── test_data_service.py
│   │   ├── test_websockets/
│   │   │   └── test_handlers.py
│   │   └── fixtures/
│   │       └── sample_data.py
│   │
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── setup.py
│   ├── pytest.ini
│   ├── .flake8
│   ├── .pylintrc
│   ├── wsgi.py                      # WSGI entry point for production
│   └── Dockerfile                   # Backend specific Dockerfile
│
├── frontend/                        # JavaScript Frontend (React/Vue)
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── App.css
│   │   │
│   │   ├── components/
│   │   │   ├── Charts/
│   │   │   │   ├── ChartContainer.js
│   │   │   │   ├── ChartCanvas.js
│   │   │   │   └── ChartSettings.js
│   │   │   ├── Data/
│   │   │   │   ├── DataUploader.js
│   │   │   │   ├── DataTable.js
│   │   │   │   └── DataViewer.js
│   │   │   ├── Layout/
│   │   │   │   ├── Header.js
│   │   │   │   ├── Sidebar.js
│   │   │   │   ├── Footer.js
│   │   │   │   └── Layout.css
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.js
│   │   │   │   ├── RegisterForm.js
│   │   │   │   └── ProtectedRoute.js
│   │   │   └── Common/
│   │   │       ├── Loader.js
│   │   │       ├── ErrorBoundary.js
│   │   │       ├── Modal.js
│   │   │       └── Notification.js
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Charts.js
│   │   │   ├── Data.js
│   │   │   ├── Settings.js
│   │   │   └── 404.js
│   │   │
│   │   ├── hooks/
│   │   │   ├── useWebSocket.js      # Custom WebSocket hook
│   │   │   ├── useAuth.js           # Authentication hook
│   │   │   ├── useApi.js            # API hook
│   │   │   └── usePagination.js     # Pagination hook
│   │   │
│   │   ├── services/
│   │   │   ├── api.js               # API client setup
│   │   │   ├── websocket.js         # WebSocket client
│   │   │   ├── auth.js              # Authentication service
│   │   │   └── storage.js           # Local storage service
│   │   │
│   │   ├── store/                   # State management (Redux/Vuex)
│   │   │   ├── actions/
│   │   │   │   ├── chartActions.js
│   │   │   │   ├── dataActions.js
│   │   │   │   └── authActions.js
│   │   │   ├── reducers/
│   │   │   │   ├── chartReducer.js
│   │   │   │   ├── dataReducer.js
│   │   │   │   └── authReducer.js
│   │   │   ├── selectors/
│   │   │   │   └── chartSelectors.js
│   │   │   └── store.js             # Store configuration
│   │   │
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   ├── constants.js
│   │   │   ├── formatters.js
│   │   │   ├── validators.js
│   │   │   └── errorHandler.js
│   │   │
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   ├── variables.css
│   │   │   ├── responsive.css
│   │   │   └── animations.css
│   │   │
│   │   └── config/
│   │       └── api.config.js        # API configuration
│   │
│   ├── tests/
│   │   ├── components/
│   │   │   └── Charts.test.js
│   │   ├── services/
│   │   │   └── api.test.js
│   │   ├── hooks/
│   │   │   └── useWebSocket.test.js
│   │   ├── store/
│   │   │   └── chartReducer.test.js
│   │   └── setupTests.js
│   │
│   ├── public/                      # Static assets
│   │   ├── images/
│   │   └── fonts/
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── .babelrc
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── jest.config.js
│   ├── Dockerfile                   # Frontend specific Dockerfile
│   └── nginx.conf                   # Nginx config for static serving
│
├── nginx/
│   ├── Dockerfile
│   ├── nginx.conf                   # Main nginx configuration
│   └── ssl/                         # SSL certificates (if needed)
│
├── docs/
│   ├── API.md                       # API documentation
│   ├── ARCHITECTURE.md              # Architecture details
│   ├── DEPLOYMENT.md                # Deployment guide
│   ├── CONTRIBUTING.md              # Contributing guidelines
│   └── SETUP.md                     # Local setup guide
│
└── scripts/
    ├── setup.sh                     # Initial setup script
    ├── migrate.sh                   # Database migration script
    ├── seed.sh                      # Database seeding script
    └── deploy.sh                    # Deployment script
```

---

## Backend Setup (Python)

### Backend `requirements.txt`

```txt
# Web Framework
Flask==3.0.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.1.1

# WebSocket
python-socketio==5.9.0
python-engineio==4.8.0

# Database
SQLAlchemy==2.0.23
psycopg2-binary==2.9.9
alembic==1.13.0

# Authentication & Security
PyJWT==2.8.1
bcrypt==4.1.1
python-dotenv==1.0.0

# API & Validation
marshmallow==3.20.1
python-dateutil==2.8.2

# Caching
redis==5.0.1

# Task Queue
celery==5.3.4

# Testing
pytest==7.4.3
pytest-cov==4.1.0
pytest-asyncio==0.21.1
factory-boy==3.3.0

# Code Quality
flake8==6.1.0
black==23.12.0
pylint==3.0.3
isort==5.13.2

# Logging & Monitoring
python-json-logger==2.0.7
sentry-sdk==1.39.1

# Production Server
gunicorn==21.2.0
```

### Backend `requirements-dev.txt`

```txt
-r requirements.txt

# Development
ipython==8.18.1
ipdb==0.13.13

# Documentation
Sphinx==7.2.6

# Hot Reload
flask-shell-ipython==0.4.1
```

### Backend Main Application (`app/main.py`)

```python
import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO

from app.config import get_config
from app.extensions import db, redis_client, socketio
from app.middleware.error_handler import register_error_handlers
from app.middleware.auth import register_auth_middleware
from app.api.routes import register_routes
from app.websockets.handlers import register_websocket_handlers

def create_app(config_name=None):
    """Application factory"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    config = get_config(config_name)
    app.config.from_object(config)
    
    # Initialize extensions
    db.init_app(app)
    redis_client.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
    socketio.init_app(app, cors_allowed_origins=app.config['CORS_ORIGINS'])
    
    # Register middleware
    register_auth_middleware(app)
    register_error_handlers(app)
    
    # Register blueprints
    register_routes(app)
    
    # Register WebSocket handlers
    register_websocket_handlers(socketio)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'environment': app.config['ENV']
        }), 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
```

### Backend Configuration (`app/config.py`)

```python
import os
from datetime import timedelta

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://user:password@localhost:5432/charts_db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # JWT
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION = timedelta(hours=24)
    
    # WebSocket
    SOCKETIO_MESSAGE_QUEUE = os.getenv('SOCKETIO_MESSAGE_QUEUE', '')

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Enhanced security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

def get_config(config_name='development'):
    """Get configuration by name"""
    configs = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig
    }
    return configs.get(config_name, DevelopmentConfig)
```

### Backend Extensions (`app/extensions.py`)

```python
from flask_sqlalchemy import SQLAlchemy
from flask_redis import FlaskRedis
from flask_socketio import SocketIO

db = SQLAlchemy()
redis_client = FlaskRedis()
socketio = SocketIO(async_mode='threading')
```

### Backend Model Example (`app/models/chart.py`)

```python
from datetime import datetime
from app.extensions import db

class Chart(db.Model):
    """Chart model"""
    __tablename__ = 'charts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    chart_type = db.Column(db.String(50), nullable=False)  # 'line', 'bar', 'pie', etc.
    config = db.Column(db.JSON, default={})  # Chart configuration
    is_public = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='charts')
    datasets = db.relationship('Dataset', backref='chart', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'chart_type': self.chart_type,
            'config': self.config,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
```

### Backend API Routes (`app/api/v1/charts.py`)

```python
from flask import Blueprint, request, jsonify
from flask_socketio import emit
from functools import wraps
from app.services.chart_service import ChartService
from app.middleware.auth import token_required
from app.extensions import db

bp = Blueprint('charts', __name__, url_prefix='/api/v1/charts')
chart_service = ChartService()

def require_auth(f):
    @wraps(f)
    @token_required
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function

@bp.route('', methods=['GET'])
@require_auth
def get_charts(current_user):
    """Get all charts for current user"""
    try:
        charts = chart_service.get_user_charts(current_user.id)
        return jsonify([chart.to_dict() for chart in charts]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/<int:chart_id>', methods=['GET'])
@require_auth
def get_chart(current_user, chart_id):
    """Get specific chart"""
    try:
        chart = chart_service.get_chart(chart_id, current_user.id)
        return jsonify(chart.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@bp.route('', methods=['POST'])
@require_auth
def create_chart(current_user):
    """Create new chart"""
    try:
        data = request.get_json()
        chart = chart_service.create_chart(current_user.id, data)
        db.session.commit()
        return jsonify(chart.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:chart_id>', methods=['PUT'])
@require_auth
def update_chart(current_user, chart_id):
    """Update chart"""
    try:
        data = request.get_json()
        chart = chart_service.update_chart(chart_id, current_user.id, data)
        db.session.commit()
        return jsonify(chart.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@bp.route('/<int:chart_id>', methods=['DELETE'])
@require_auth
def delete_chart(current_user, chart_id):
    """Delete chart"""
    try:
        chart_service.delete_chart(chart_id, current_user.id)
        db.session.commit()
        return jsonify({'message': 'Chart deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
```

### Backend WebSocket Handlers (`app/websockets/handlers.py`)

```python
from flask_socketio import emit, join_room, leave_room
from functools import wraps
from app.extensions import socketio, redis_client
from app.services.websocket_service import WebSocketService
import json

ws_service = WebSocketService()

def namespace_handler(namespace='/charts'):
    """Decorator for namespace-specific handlers"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            return f(*args, **kwargs)
        return wrapper
    return decorator

def register_websocket_handlers(socketio):
    """Register all WebSocket handlers"""
    
    @socketio.on('connect', namespace='/charts')
    def handle_connect(auth):
        """Handle client connection"""
        print(f'Client connected: {request.sid}')
        emit('connected', {'data': 'Connected to server'})
    
    @socketio.on('disconnect', namespace='/charts')
    def handle_disconnect():
        """Handle client disconnection"""
        print(f'Client disconnected: {request.sid}')
        ws_service.remove_connection(request.sid)
    
    @socketio.on('join_chart', namespace='/charts')
    def on_join_chart(data):
        """Join a chart room for live updates"""
        chart_id = data['chart_id']
        room = f'chart_{chart_id}'
        join_room(room)
        emit('status', {
            'msg': f'User joined chart {chart_id}'
        }, to=room)
    
    @socketio.on('chart_update', namespace='/charts')
    def on_chart_update(data):
        """Handle chart update and broadcast to room"""
        chart_id = data['chart_id']
        room = f'chart_{chart_id}'
        
        # Store update in Redis for persistence
        redis_client.setex(f'chart_update:{chart_id}', 3600, json.dumps(data))
        
        # Broadcast to all clients in room
        emit('chart_updated', data, to=room)
    
    @socketio.on('real_time_data', namespace='/charts')
    def on_real_time_data(data):
        """Handle real-time data updates"""
        chart_id = data['chart_id']
        room = f'chart_{chart_id}'
        
        # Validate and process data
        processed_data = ws_service.process_data(data)
        
        # Broadcast to subscribers
        emit('data_update', processed_data, to=room)
    
    @socketio.on_error_default
    def default_error_handler(e):
        """Handle WebSocket errors"""
        print(f'WebSocket error: {str(e)}')
        emit('error', {'message': 'An error occurred'})
```

---

## Frontend Setup (JavaScript/React)

### Frontend `package.json`

```json
{
  "name": "charts-app-frontend",
  "version": "1.0.0",
  "description": "Production-ready charts application frontend",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "socket.io-client": "^4.5.4",
    "chart.js": "^4.4.1",
    "react-chartjs-2": "^5.2.0",
    "redux": "^4.2.1",
    "react-redux": "^8.1.3",
    "redux-thunk": "^2.4.2",
    "react-query": "^3.39.3",
    "formik": "^2.4.5",
    "yup": "^1.3.3",
    "date-fns": "^2.30.0",
    "lodash": "^4.17.21",
    "zustand": "^4.4.1"
  },
  "devDependencies": {
    "react-scripts": "5.0.1",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "@babel/preset-react": "^7.23.3"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "coverage": "react-scripts test --coverage"
  },
  "eslintConfig": {
    "extends": [
      "react-app"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

### Frontend WebSocket Hook (`src/hooks/useWebSocket.js`)

```javascript
import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const useWebSocket = (url = process.env.REACT_APP_API_URL, namespace = '/charts') => {
    const socketRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectDelay = useRef(1000);

    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        socketRef.current = io(`${url}${namespace}`, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: maxReconnectAttempts,
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to WebSocket');
            reconnectAttemptsRef.current = 0;
            reconnectDelay.current = 1000;
        });

        socketRef.current.on('disconnect', () => {
            console.log('Disconnected from WebSocket');
        });

        socketRef.current.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }, [url, namespace]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    }, []);

    const emit = useCallback((event, data) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
        } else {
            console.warn('WebSocket not connected');
        }
    }, []);

    const on = useCallback((event, callback) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
    }, []);

    const off = useCallback((event, callback) => {
        if (socketRef.current) {
            socketRef.current.off(event, callback);
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        socket: socketRef.current,
        emit,
        on,
        off,
        connected: socketRef.current?.connected || false,
    };
};

export default useWebSocket;
```

### Frontend API Service (`src/services/api.js`)

```javascript
import axios from 'axios';
import { getAuthToken, isTokenExpired, refreshToken } from './auth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api/v1`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const newToken = await refreshToken();
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
```

### Frontend Chart Component (`src/components/Charts/ChartContainer.js`)

```javascript
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import useWebSocket from '../../hooks/useWebSocket';
import api from '../../services/api';
import './ChartContainer.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ChartContainer = ({ chartId }) => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { emit, on, off, connected } = useWebSocket();

    useEffect(() => {
        fetchChart();
    }, [chartId]);

    const fetchChart = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/charts/${chartId}`);
            setChartData(response.data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!connected) return;

        // Join the chart room
        emit('join_chart', { chart_id: chartId });

        // Listen for chart updates
        const handleChartUpdate = (data) => {
            setChartData((prev) => ({
                ...prev,
                ...data,
            }));
        };

        const handleDataUpdate = (data) => {
            setChartData((prev) => ({
                ...prev,
                datasets: data.datasets,
            }));
        };

        on('chart_updated', handleChartUpdate);
        on('data_update', handleDataUpdate);

        return () => {
            off('chart_updated', handleChartUpdate);
            off('data_update', handleDataUpdate);
        };
    }, [connected, chartId, emit, on, off]);

    if (loading) return <div className="loader">Loading...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!chartData) return <div>No data available</div>;

    return (
        <div className="chart-container">
            <h2>{chartData.title}</h2>
            <p>{chartData.description}</p>
            <Line data={chartData.config} options={{ responsive: true }} />
        </div>
    );
};

export default ChartContainer;
```

---

## Docker Configuration

### Root `docker-compose.yml`

```yaml
version: '3.9'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: charts-db
    environment:
      POSTGRES_USER: ${DB_USER:-charts_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-charts_password}
      POSTGRES_DB: ${DB_NAME:-charts_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-charts_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - charts-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: charts-redis
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - charts-network

  # Python Backend
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: charts-backend
    environment:
      FLASK_APP: app.main
      FLASK_ENV: ${FLASK_ENV:-production}
      DATABASE_URL: postgresql://${DB_USER:-charts_user}:${DB_PASSWORD:-charts_password}@postgres:5432/${DB_NAME:-charts_db}
      REDIS_URL: redis://redis:6379/0
      SECRET_KEY: ${SECRET_KEY:-change-me-in-production}
      JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app/backend
    ports:
      - "5000:5000"
    command: gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 app.main:create_app()
    networks:
      - charts-network
    restart: unless-stopped

  # React Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: charts-frontend
    environment:
      REACT_APP_API_URL: ${API_URL:-http://localhost:5000}
      REACT_APP_WS_URL: ${WS_URL:-ws://localhost:5000}
    depends_on:
      - backend
    volumes:
      - ./frontend/src:/app/src
      - /app/node_modules
    ports:
      - "3000:3000"
    networks:
      - charts-network
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile
    container_name: charts-nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - frontend
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - charts-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  charts-network:
    driver: bridge
```

### Backend Dockerfile

```dockerfile
# Stage 1: Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Set PATH
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY backend/ /app/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import socket; socket.socket().connect(('localhost', 5000))"

# Expose port
EXPOSE 5000

# Run application
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "--access-logfile", "-", "--error-logfile", "-", "app.main:create_app()"]
```

### Frontend Dockerfile

```dockerfile
# Stage 1: Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/build ./build

# Create non-root user
RUN addgroup -g 1000 appuser && adduser -D -u 1000 -G appuser appuser
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run application
CMD ["serve", "-s", "build", "-l", "3000"]
```

### Nginx Configuration

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # GZIP compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json;

    # Upstream services
    upstream backend {
        server backend:5000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # HTTP to HTTPS redirect (optional)
    server {
        listen 80;
        server_name _;
        
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /socket.io/ {
            proxy_pass http://backend/socket.io/;
            proxy_http_version 1.1;
            proxy_buffering off;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

---

## Environment Variables

### `.env.example`

```bash
# Application
FLASK_ENV=production
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET=your-jwt-secret-here-change-in-production

# Database
DB_USER=charts_user
DB_PASSWORD=secure_password_here
DB_NAME=charts_db
DATABASE_URL=postgresql://charts_user:secure_password_here@postgres:5432/charts_db

# Redis
REDIS_URL=redis://redis:6379/0

# Frontend
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost

# Email (optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# AWS (optional)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1

# Logging
LOG_LEVEL=INFO
SENTRY_DSN=your-sentry-dsn-optional
```

---

## Database Setup

### Database Initialization (`backend/migrations/init.sql`)

```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Create charts table
CREATE TABLE IF NOT EXISTS charts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    chart_type VARCHAR(50),
    config JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_charts_user_id ON charts(user_id);
CREATE INDEX idx_charts_created_at ON charts(created_at);

-- Create datasets table
CREATE TABLE IF NOT EXISTS datasets (
    id SERIAL PRIMARY KEY,
    chart_id INTEGER NOT NULL REFERENCES charts(id) ON DELETE CASCADE,
    name VARCHAR(255),
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_datasets_chart_id ON datasets(chart_id);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255),
    resource_type VARCHAR(100),
    resource_id INTEGER,
    changes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## API Design

### REST API Endpoints

```
Authentication
POST    /api/v1/auth/register          - Register new user
POST    /api/v1/auth/login             - Login user
POST    /api/v1/auth/refresh-token     - Refresh JWT token
POST    /api/v1/auth/logout            - Logout user

Charts
GET     /api/v1/charts                 - List all user charts
POST    /api/v1/charts                 - Create new chart
GET     /api/v1/charts/:id             - Get chart details
PUT     /api/v1/charts/:id             - Update chart
DELETE  /api/v1/charts/:id             - Delete chart
GET     /api/v1/charts/:id/datasets    - Get chart datasets

Data
POST    /api/v1/data/upload            - Upload data file
GET     /api/v1/data/preview           - Preview uploaded data
POST    /api/v1/charts/:id/datasets    - Add dataset to chart
PUT     /api/v1/datasets/:id           - Update dataset
DELETE  /api/v1/datasets/:id           - Delete dataset

Users
GET     /api/v1/users/profile          - Get user profile
PUT     /api/v1/users/profile          - Update user profile
POST    /api/v1/users/change-password  - Change password

Admin
GET     /api/v1/admin/users            - List all users (admin only)
GET     /api/v1/admin/stats            - Get system statistics
```

### WebSocket Events

```
Client → Server
connect                    - Connect to WebSocket
disconnect                 - Disconnect from WebSocket
join_chart                 - Join a chart room
leave_chart                - Leave a chart room
chart_update               - Update chart configuration
real_time_data            - Send real-time data
typing                    - User is typing (for collaboration)

Server → Client
connected                 - Connection confirmed
chart_updated             - Chart was updated
data_update               - Real-time data update
error                     - Error occurred
status                    - Status message
user_joined               - User joined chart
user_left                 - User left chart
```

---

## Testing

### Backend Testing (`backend/tests/test_api/test_charts.py`)

```python
import pytest
from app import create_app
from app.extensions import db
from app.models.chart import Chart
from app.models.user import User

@pytest.fixture
def app():
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_token(client, app):
    """Create user and get auth token"""
    response = client.post('/api/v1/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    return response.json['token']

class TestCharts:
    def test_get_charts(self, client, auth_token):
        """Test getting user charts"""
        response = client.get(
            '/api/v1/charts',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        assert isinstance(response.json, list)
    
    def test_create_chart(self, client, auth_token):
        """Test creating a chart"""
        response = client.post(
            '/api/v1/charts',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={
                'title': 'Test Chart',
                'description': 'A test chart',
                'chart_type': 'line',
                'config': {}
            }
        )
        assert response.status_code == 201
        assert response.json['title'] == 'Test Chart'
    
    def test_get_chart(self, client, auth_token):
        """Test getting a specific chart"""
        # Create chart first
        create_response = client.post(
            '/api/v1/charts',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={'title': 'Test Chart', 'chart_type': 'line'}
        )
        chart_id = create_response.json['id']
        
        # Get chart
        response = client.get(
            f'/api/v1/charts/{chart_id}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        assert response.json['title'] == 'Test Chart'
```

### Frontend Testing (`frontend/tests/components/Charts.test.js`)

```javascript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ChartContainer from '../../components/Charts/ChartContainer';
import * as api from '../../services/api';

jest.mock('../../services/api');
jest.mock('../../hooks/useWebSocket');

const mockStore = configureStore([]);

describe('ChartContainer', () => {
    it('should render loading state initially', () => {
        const store = mockStore({
            charts: { data: [], loading: true },
        });

        render(
            <Provider store={store}>
                <ChartContainer chartId={1} />
            </Provider>
        );

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should fetch and display chart data', async () => {
        const mockChartData = {
            id: 1,
            title: 'Test Chart',
            description: 'Test Description',
            config: {},
        };

        api.get.mockResolvedValue({ data: mockChartData });

        const store = mockStore({
            charts: { data: [mockChartData], loading: false },
        });

        render(
            <Provider store={store}>
                <ChartContainer chartId={1} />
            </Provider>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Chart')).toBeInTheDocument();
        });
    });
});
```

---

## Deployment

### Production Checklist

```
Backend:
□ Set FLASK_ENV=production
□ Generate strong SECRET_KEY and JWT_SECRET
□ Configure PostgreSQL for production
□ Set up Redis for caching
□ Configure proper logging
□ Set up error tracking (Sentry)
□ Enable HTTPS/TLS
□ Configure CORS properly
□ Set up database backups
□ Configure rate limiting
□ Set up monitoring and alerts
□ Enable HSTS headers
□ Configure secure session cookies

Frontend:
□ Build optimized production bundle (npm run build)
□ Configure API_URL for production
□ Set up error tracking (Sentry)
□ Enable gzip compression
□ Configure caching headers
□ Set CSP headers
□ Remove console.logs in production
□ Configure analytics (optional)

Infrastructure:
□ Set up SSL/TLS certificates
□ Configure Nginx reverse proxy
□ Set up load balancing (if needed)
□ Configure Docker registry
□ Set up CI/CD pipeline
□ Configure monitoring (Prometheus/Grafana)
□ Set up log aggregation (ELK)
□ Configure database backups
□ Set up disaster recovery plan
```

---

## CI/CD Pipeline

### GitHub Actions `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Set up Node
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install backend dependencies
      run: |
        cd backend
        pip install -r requirements-dev.txt
    
    - name: Run backend tests
      run: |
        cd backend
        pytest --cov=app tests/
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm run test:ci
    
    - name: Run linters
      run: |
        cd backend
        flake8 app/
        cd ../frontend
        npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push Docker images
      uses: docker/build-push-action@v4
      with:
        context: .
        push: ${{ github.event_name != 'pull_request' }}
        tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
        cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
        cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /app/charts-app
          docker-compose pull
          docker-compose up -d
          docker-compose exec -T backend alembic upgrade head
```

---

## Summary

This production-ready structure provides:

- **Scalability** - Microservices ready architecture
- **Maintainability** - Clear separation of concerns
- **Testing** - Comprehensive test structure
- **Security** - Authentication, validation, CORS
- **Performance** - Caching, compression, optimization
- **Monitoring** - Logging, health checks
- **Deployment** - Docker, Docker Compose, CI/CD
- **Documentation** - API docs, setup guides

Follow this structure for a professional, production-ready charts application!
