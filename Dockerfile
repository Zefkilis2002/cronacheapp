FROM node:20-slim

# Installa dipendenze sistema per Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Usa il Chromium di sistema (non scaricare quello di Puppeteer)
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Copia i file delle dipendenze
COPY backend-package.json ./package.json
# Se esiste un package-lock.json compatibile, usalo, altrimenti npm install
RUN npm install --production || npm install --production

COPY server.js ./
COPY execution/ ./execution/

EXPOSE 5000

CMD ["node", "server.js"]
