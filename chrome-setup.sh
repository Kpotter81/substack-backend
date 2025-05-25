#!/usr/bin/env bash

# Install dependencies
export APT_TARGET="/opt/render/project/.apt"
export DEBIAN_FRONTEND=noninteractive

mkdir -p "$APT_TARGET"
echo "Installing Chrome dependencies..."
apt-get update -yqq
apt-get install -yqq \
    wget \
    curl \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --install-suggests

# Install Chrome
echo "Downloading Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update -yqq
apt-get install -yqq google-chrome-stable

# Move to custom install path
echo "Moving Chrome to $APT_TARGET..."
mv /opt/google/chrome /opt/render/project/.apt/
mv /usr/bin/google-chrome-stable "$APT_TARGET/usr/bin/google-chrome-stable"

# Clean up
apt-get clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*