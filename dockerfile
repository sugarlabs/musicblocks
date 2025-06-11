# First stage: Build stage
FROM node:18-slim AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Run linting and tests
RUN npm run lint
RUN npm run test

# Second stage: Production stage
FROM node:18-slim

WORKDIR /app

# Create non-root user
RUN useradd -m appuser

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy application files
COPY --from=build /app /app

# Set proper permissions
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

# Use the serve script which uses http-server
CMD ["npm", "run", "serve"]