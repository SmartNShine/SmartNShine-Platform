FROM node:22-slim

WORKDIR /app

# Copy only the server.mjs file (no dependencies)
COPY server.mjs .

# Expose port inside container
EXPOSE 3000

# Set NODE_ENV for production and bind to all interfaces
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Health check using Node's built-in HTTP
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode); })"

# Start the server
CMD ["node", "server.mjs"]
