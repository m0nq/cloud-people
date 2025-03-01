FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    netcat-traditional \
    gnupg \
    curl \
    unzip \
    xvfb \
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
    fonts-liberation \
    dbus \
    xauth \
    x11vnc \
    tigervnc-tools \
    supervisor \
    net-tools \
    procps \
    git \
    python3-numpy \
    fontconfig \
    fonts-dejavu \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    && rm -rf /var/lib/apt/lists/*

# Install noVNC
RUN git clone https://github.com/novnc/noVNC.git /opt/novnc \
    && git clone https://github.com/novnc/websockify /opt/novnc/utils/websockify \
    && ln -s /opt/novnc/vnc.html /opt/novnc/index.html \
    && chmod -R 755 /opt/novnc

# Create X11 directory with proper permissions
RUN mkdir -p /tmp/.X11-unix && chmod 1777 /tmp/.X11-unix

# Create a non-root user
RUN groupadd -r pwuser && useradd -r -g pwuser -G audio,video pwuser \
    && mkdir -p /home/pwuser/app \
    && mkdir -p /home/pwuser/.vnc \
    && mkdir -p /var/log \
    && touch /var/log/x11vnc.log \
    && chmod 666 /var/log/x11vnc.log \
    && chown -R pwuser:pwuser /home/pwuser

# Set up the Python package
WORKDIR /home/pwuser/browser-use
COPY --chown=pwuser:pwuser . .
RUN pip install -e .

WORKDIR /home/pwuser/app

# Install Python dependencies
COPY --chown=pwuser:pwuser requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install playwright with proper browser setup
RUN pip install playwright && \
    mkdir -p /home/pwuser/.cache/ms-playwright && \
    chown -R pwuser:pwuser /home/pwuser/.cache && \
    PLAYWRIGHT_BROWSERS_PATH=/home/pwuser/.cache/ms-playwright playwright install chromium && \
    playwright install-deps chromium

# Copy application files
COPY --chown=pwuser:pwuser . .

# Copy supervisord configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
RUN chmod 644 /etc/supervisor/conf.d/supervisord.conf

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV HOME=/home/pwuser
ENV PLAYWRIGHT_BROWSERS_PATH=/home/pwuser/.cache/ms-playwright
ENV DISPLAY=:99
ENV RESOLUTION=1920x1080x24
ENV VNC_PASSWORD=vncpassword
ENV RESOLUTION_WIDTH=1920
ENV RESOLUTION_HEIGHT=1080

# Expose ports for FastAPI, noVNC and VNC
EXPOSE 8000 6080 5901

# Switch to non-root user
USER pwuser

# Set display for Xvfb
ENV DISPLAY=:99

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]