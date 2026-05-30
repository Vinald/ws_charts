FROM python:3.12-slim

WORKDIR /app

# Install dependencies in a separate layer for better cache reuse
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application source
COPY backend/ ./backend/
COPY frontend/ ./frontend/

WORKDIR /app/backend

EXPOSE 8000

# Lifespan hook runs `alembic upgrade head` before accepting traffic
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
