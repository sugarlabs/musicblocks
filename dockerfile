# # First stage: Build stage
# FROM python:latest AS build

# WORKDIR /app

# COPY . .

# # Second stage: Final stage
# FROM python:latest

# WORKDIR /app

# COPY --from=build /app /app

# EXPOSE 3000

# CMD ["python", "-m", "http.server", "3000", "--bind", "0.0.0.0"]

# First stage: Build stage
FROM python:latest AS build
WORKDIR /app
COPY . .

# Second stage: Final stage
FROM nginx:alpine

WORKDIR /usr/share/nginx/html
# Copy your application files
COPY --from=build /app .
# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000