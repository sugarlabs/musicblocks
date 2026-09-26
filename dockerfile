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

# Probe 127.0.0.1 rather than $HOST: the server binds 0.0.0.0, and loopback is
# correct from inside the container regardless of what HOST is set to.
# Uses `node -e` instead of curl/wget so this stays portable across base images.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:process.env.PORT||3000,path:'/healthz'},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "index.js"]