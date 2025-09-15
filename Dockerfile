# 🏥 Healthfy - Advanced Healthcare Analytics Platform
# Multi-stage Docker build for production optimization

# Stage 1: Build stage with full Node.js environment
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules (sharp, bcrypt, etc.)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies (including devDependencies for build process)
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Runtime stage with minimal footprint
FROM node:20-alpine AS runtime

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S healthfy -u 1001

# Set working directory
WORKDIR /app

# Install runtime system dependencies only
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    librsvg \
    pixman \
    ttf-dejavu \
    curl

# Copy dependencies from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY --chown=healthfy:nodejs . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/uploads /app/public /app/logs && \
    chown -R healthfy:nodejs /app/uploads /app/public /app/logs

# Remove sensitive files and unnecessary directories
RUN rm -rf \
    .env.example \
    README.md \
    *.md \
    .git* \
    tests/ \
    docs/ \
    .vscode/ \
    .idea/

# Switch to non-root user
USER healthfy

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NPM_CONFIG_LOGLEVEL=warn

# Start the application
CMD ["npm", "start"]

# Labels for metadata
LABEL maintainer="Anirban Santra <anirbansantra748@gmail.com>"
LABEL version="1.0.0"
LABEL description="Healthfy - Advanced Healthcare Analytics Platform"
LABEL org.opencontainers.image.title="Healthfy Healthcare Platform"
LABEL org.opencontainers.image.description="Comprehensive healthcare platform with AI-powered analytics, real-time consultations, and gamification"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="Anirban Santra"
LABEL org.opencontainers.image.url="https://github.com/anirbansantra748/hailthyfy"
LABEL org.opencontainers.image.source="https://github.com/anirbansantra748/hailthyfy"
LABEL org.opencontainers.image.licenses="MIT"