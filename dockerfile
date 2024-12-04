# First stage: Build stage
FROM python:3.9-slim AS build

WORKDIR /app

RUN useradd -m appuser

COPY . .

# Second stage: Final stage
FROM python:3.9-slim

RUN useradd -m appuser

WORKDIR /app

COPY --from=build /app /app

USER appuser

EXPOSE 3000

CMD ["python", "-m", "http.server", "3000", "--bind", "0.0.0.0"]