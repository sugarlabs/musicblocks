# First stage: Build stage
FROM python:latest AS build

WORKDIR /app

RUN useradd -m appuser

COPY . .

# Second stage: Final stage
FROM python:latest

RUN useradd -m appuser

WORKDIR /app

COPY --from=build /app /app

USER appuser

EXPOSE 3000

CMD ["python", "-m", "http.server", "3000", "--bind", "0.0.0.0"]