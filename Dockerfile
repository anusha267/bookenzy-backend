FROM node:22-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Secrets (DATABASE_URL, BOOKENZY_JWT_SECRET) are NOT baked into the image.
# Cloud Run injects them at runtime (see .github/workflows/deploy.yml).
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/index.js"]
