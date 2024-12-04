# First stage: Build stage
FROM python:3.9-slim AS build

WORKDIR /app

COPY . .

# Second stage: Final stage
FROM python:3.9-slim

WORKDIR /app

COPY --from=build /app /app

EXPOSE 3000

CMD ["python", "-m", "http.server", "3000", "--bind", "0.0.0.0"]