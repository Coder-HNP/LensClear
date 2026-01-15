# Base image
FROM node:18-alpine

# Working directory
WORKDIR /app

# Install dependencies needed for some node modules (like bcrypt) and healthcheck tooling
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package*.json ./

# Install dependencies
ENV NODE_ENV=production
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose ports (API and MQTT)
EXPOSE 5000 1883

# Healthcheck on /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD curl -f http://localhost:5000/health || exit 1

# Start command
CMD ["npm", "start"]
