FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    xvfb \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libgbm1 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -r pwuser && useradd -r -g pwuser -G audio,video pwuser \
    && mkdir -p /home/pwuser/app \
    && chown -R pwuser:pwuser /home/pwuser

WORKDIR /home/pwuser/app

# Install Python dependencies
COPY --chown=pwuser:pwuser requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install browser-use and playwright with proper browser setup
RUN pip install browser-use && \
    pip install playwright && \
    mkdir -p /home/pwuser/.cache/ms-playwright && \
    chown -R pwuser:pwuser /home/pwuser/.cache && \
    PLAYWRIGHT_BROWSERS_PATH=/home/pwuser/.cache/ms-playwright playwright install chromium && \
    playwright install-deps chromium

# Copy application files
COPY --chown=pwuser:pwuser . .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV HOME=/home/pwuser
ENV PLAYWRIGHT_BROWSERS_PATH=/home/pwuser/.cache/ms-playwright
ENV DISPLAY=:99

# Switch to non-root user
USER pwuser

EXPOSE 8000

# Start Xvfb and run the application
CMD Xvfb :99 -screen 0 1024x768x16 & uvicorn main:app --host 0.0.0.0 --port 8000