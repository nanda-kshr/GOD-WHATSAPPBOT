FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source
COPY tsconfig.json ./
COPY src ./src

# Persist WhatsApp auth session across restarts
VOLUME ["/app/auth_info_baileys"]

ENV NODE_ENV=production

CMD ["npx", "tsx", "src/index.ts"]
