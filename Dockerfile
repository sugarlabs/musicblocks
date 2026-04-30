FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./

ENV NODE_ENV=production

RUN npm install --omit=dev --no-audit --no-fund --ignore-scripts

COPY . .

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

USER node

CMD ["node", "index.js"]