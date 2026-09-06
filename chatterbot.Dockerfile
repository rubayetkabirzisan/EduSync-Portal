FROM python:3.10-slim

WORKDIR /app

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

# Run the Django server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000", "--noreload"]
