# Build stage - Install dependencies and build with craco
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json yarn.lock* ./

# Install all dependencies (production + dev)
RUN npm ci

# Copy application code
COPY . .

# Build the React app with craco
RUN npm run build

# Production stage - Serve with Nginx
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app from builder stage
COPY --from=builder /app/build .

# Create health check script
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
