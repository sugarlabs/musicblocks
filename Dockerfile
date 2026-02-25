FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# Install only runtime dependencies for production containers.
# `npm ci` currently fails because the lockfile is out of sync with package.json.
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

USER node

EXPOSE 3000

CMD ["node", "index.js"]
