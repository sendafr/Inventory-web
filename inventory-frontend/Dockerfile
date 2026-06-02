# --- Stage 1: Build the application ---
# Using a Node LTS image to install dependencies and build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
# Use 'npm ci' for clean, reproducible installs if you have a package-lock.json
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the application
# Adjust 'npm run build' if your framework uses a different command (e.g., 'yarn build')
RUN npm run build

# --- Stage 2: Serve with Nginx ---
# Using a lightweight Nginx image for production
FROM nginx:alpine

# Copy custom Nginx configuration (optional, see config below)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from the builder stage
# Adjust 'dist' to 'build' if using Create React App, or 'public' if necessary
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]