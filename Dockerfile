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

# Copia solo i file necessari al backend
COPY backend-package.json ./package.json
RUN npm install --production

COPY instagram-proxy.js ./
COPY execution/ ./execution/

EXPOSE 5000

CMD ["node", "instagram-proxy.js"]
