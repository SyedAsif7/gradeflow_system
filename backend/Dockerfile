FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (if needed for building Python packages)
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend source
COPY backend /app

# Environment variables (override in compose or cloud env)
ENV MONGO_URL="mongodb://mongo:27017" \
    DB_NAME="gradeflow" \
    JWT_SECRET="change_this_secret" \
    CORS_ORIGINS="*"

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
