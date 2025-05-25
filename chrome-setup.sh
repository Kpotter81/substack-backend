#!/usr/bin/env bash

# Install dependencies
export DEBIAN_FRONTEND=noninteractive

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

wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update -yqq
apt-get install -yqq google-chrome-stable

# Debug output
ls -alh /usr/bin/google-chrome-stable || echo "❌ google-chrome-stable not found"
which google-chrome-stable || echo "❌ which command failed"
google-chrome-stable --version || echo "❌ version command failed"

apt-get clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
