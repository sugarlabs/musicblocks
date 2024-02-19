FROM node:latest as build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

FROM python:latest

WORKDIR /app

COPY --from=build /app .

EXPOSE 3000

CMD ["python", "-m", "http.server", "3000", "--bind", "0.0.0.0"]
