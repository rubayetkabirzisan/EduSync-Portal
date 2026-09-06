FROM python:3.10-slim

WORKDIR /app

# Optimize Python memory usage for small containers
ENV MALLOC_ARENA_MAX=2
ENV PYTHONUNBUFFERED=1

# Install system dependencies required by spaCy and python packages
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install them
COPY chatterbot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the django project files
COPY chatterbot/ .

# Expose port
EXPOSE 8000

# Run the Django server with Gunicorn to save memory
CMD ["gunicorn", "--workers", "1", "--threads", "2", "--bind", "0.0.0.0:8000", "chatbot_project.wsgi:application"]
