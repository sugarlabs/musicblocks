# First stage: Build stage
FROM node:20-slim AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

# Second stage: Final stage
FROM node:20-slim

RUN useradd -m appuser

WORKDIR /app

COPY --from=build /app /app

USER appuser

EXPOSE 3000

ENV HOST=0.0.0.0

CMD ["node", "index.js"]