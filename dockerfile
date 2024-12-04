# First stage: Build stage
FROM python:latest AS build

WORKDIR /app

COPY . .

# Second stage: Final stage
FROM python:latest

WORKDIR /app

COPY --from=build /app /app

EXPOSE 3000

CMD ["python", "-m", "http.server", "3000", "--bind", "0.0.0.0"]