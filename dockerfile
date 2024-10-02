# First stage: Build stage
FROM alpine:latest AS first
RUN git clone https://github.com/sugarlabs/planet-server.git

FROM python:latest AS build

WORKDIR /app

COPY . .

COPY --from=first /planet-server /app/planet-server

EXPOSE 3000

CMD ["python", "-m", "http.server", "3000", "--bind", "0.0.0.0"]
