# First stage: Build stage
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

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