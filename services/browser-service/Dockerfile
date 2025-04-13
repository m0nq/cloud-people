# Build stage
FROM python:3.11-slim AS builder

# Set build-time environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    git=* \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /build

# Copy and install requirements first
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip wheel setuptools && \
    pip install --no-cache-dir -r requirements.txt && \
    # Install OS deps AND browser binary in builder stage
    playwright install-deps chromium && \
    playwright install chromium

# Copy and install the local package
COPY . .
# Install browser-use first to ensure it's not overridden by the local package
RUN pip install --no-cache-dir browser-use==0.1.40 && \
    pip install -e . && \
    pip freeze | grep -v "^-e" > /requirements-lock.txt

# Final stage
FROM python:3.11-slim

# Set runtime environment variables
ENV PYTHONUNBUFFERED=1 \
    HOME=/home/pwuser \
    PLAYWRIGHT_BROWSERS_PATH=/home/pwuser/.cache/ms-playwright \
    DISPLAY=:99 \
    RESOLUTION=1920x1080x24 \
    VNC_PASSWORD=vncpassword \
    RESOLUTION_WIDTH=1920 \
    RESOLUTION_HEIGHT=1080

# Install system dependencies in a single layer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    wget=* netcat-traditional=* gnupg=* curl=* unzip=* \
    xvfb=* libgconf-2-4=* libxss1=* libnss3=* libnspr4=* \
    libasound2=* libatk1.0-0=* libatk-bridge2.0-0=* \
    libcups2=* libdbus-1-3=* libdrm2=* libgbm1=* \
    libgtk-3-0=* libxcomposite1=* libxdamage1=* \
    libxfixes3=* libxrandr2=* xdg-utils=* \
    fonts-liberation=* dbus=* xauth=* x11vnc=* \
    tigervnc-tools=* supervisor=* net-tools=* \
    procps=* git=* python3-numpy=* fontconfig=* \
    fonts-dejavu=* fonts-dejavu-core=* \
    fonts-dejavu-extra=* && \
    rm -rf /var/lib/apt/lists/* && \
    # Install noVNC
    git clone --depth 1 https://github.com/novnc/noVNC.git /opt/novnc && \
    git clone --depth 1 https://github.com/novnc/websockify /opt/novnc/utils/websockify && \
    ln -s /opt/novnc/vnc.html /opt/novnc/index.html && \
    chmod -R 755 /opt/novnc && \
    # Setup user and directories
    mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix && \
    groupadd -r pwuser && useradd -r -g pwuser -G audio,video pwuser && \
    mkdir -p /home/pwuser/app /home/pwuser/.vnc /var/log && \
    touch /var/log/x11vnc.log && \
    chmod 666 /var/log/x11vnc.log && \
    chown -R pwuser:pwuser /home/pwuser

# Set working directory
WORKDIR /home/pwuser/app

# Copy requirements and install Python packages
# --- OPTIMIZATION START ---
# 1. Copy only the lock file first
COPY --from=builder /requirements-lock.txt .

# 2. Install dependencies from the lock file
#    Also run playwright install here to ensure system deps are present
RUN pip install --no-cache-dir -r requirements-lock.txt && \
    playwright install --with-deps

# 3. Copy the rest of the application code AFTER installing deps
COPY . .

# Create directories needed by VNC and ensure correct permissions
RUN mkdir -p /tmp/x11vnc && chown pwuser:pwuser /tmp/x11vnc && touch /tmp/x11vnc/x11vnc.log && chown pwuser:pwuser /tmp/x11vnc/x11vnc.log && chmod 666 /tmp/x11vnc/x11vnc.log

# Copy Playwright browsers from builder stage
COPY --from=builder /root/.cache/ms-playwright /ms-playwright

# Copy supervisord configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN chmod 644 /etc/supervisor/conf.d/supervisord.conf

# Expose ports for FastAPI, noVNC and VNC
EXPOSE 8000 6080 5901

# Switch to non-root user
USER pwuser

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]