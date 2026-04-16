FROM node:20-slim

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev --no-audit --no-fund --ignore-scripts

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

USER node

CMD ["node", "index.js"]