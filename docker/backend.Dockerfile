# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY packages/backend/package*.json ./
COPY packages/common ./common/

# Install dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy source code
COPY packages/backend/src ./src

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S testloom -u 1001

# Change ownership
RUN chown -R testloom:nodejs /app
USER testloom

EXPOSE 5000

# Health check (use HTTP endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:5000/ || exit 1

CMD ["node", "src/index.js"]
