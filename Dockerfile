FROM node:22-slim

# Installa dipendenze sistema per Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Usa il Chromium di sistema (non scaricare quello di Puppeteer)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app

# Copia i file delle dipendenze
COPY server/package.json ./package.json
COPY server/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY server/server.js ./
COPY server/lib/ ./lib/
COPY server/execution/ ./execution/

EXPOSE 5000

CMD ["node", "--max-old-space-size=384", "server.js"]
