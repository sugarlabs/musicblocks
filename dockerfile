# First stage: Build stage
FROM python:latest AS build

WORKDIR /app

COPY . .

# Second stage: Final stage
FROM python:latest

WORKDIR /app

# Create a non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Set file ownership to the non-root user
COPY --from=build /app /app
RUN chown -R appuser:appgroup /app

# Switch to the non-root user
USER appuser

EXPOSE 3000

CMD ["python", "-m", "http.server", "3000", "--bind", "0.0.0.0"]
