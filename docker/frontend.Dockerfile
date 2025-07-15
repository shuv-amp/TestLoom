# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY packages/frontend/package*.json ./
COPY packages/common ../common/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/frontend ./

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built application
COPY --from=builder /app/.output ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S testloom -u 1001

# Change ownership
RUN chown -R testloom:nodejs /app
USER testloom

EXPOSE 3000

CMD ["node", "server/index.mjs"]
