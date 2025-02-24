FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    unzip \
    xvfb \
    git \
    libgconf-2-4 \
    libxss1 \
    libnss3 \
    libnspr4 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    fonts-liberation && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone browser-use repository
RUN git clone https://github.com/browser-use/browser-use.git /tmp/browser-use && \
    cd /tmp/browser-use && \
    pip install -e . && \
    # Print package structure for debugging
    find /tmp/browser-use -type f -name "*.py" | grep -v "__pycache__" && \
    python -c "import browser_use; print('Browser-use package location:', browser_use.__file__)"

# Install other Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright and browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN playwright install --with-deps chromium
RUN playwright install-deps

# Copy application files
COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV CHROME_PATH=/ms-playwright/chromium-*/chrome-linux/chrome
ENV DISPLAY=:99

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
