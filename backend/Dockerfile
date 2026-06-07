# ---- Build stage ----
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---- Runtime stage ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Cache the embedding model inside the image dir at runtime.
ENV TRANSFORMERS_CACHE=/app/.transformers-cache

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 8000
CMD ["node", "dist/main.js"]
