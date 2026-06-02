# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production # Or just 'npm install' if you need dev deps

# Copy source code
COPY . .

# 🛑 REMOVE THIS LINE: ENV VITE_API_URL=/api
# We do NOT set it here. We expect it to be passed during build or set in the environment.

# Build the application
# NOTE: If Render passes env vars as args, they will be picked up automatically by Vite 
# IF you are using a custom build command that passes them.
# If Render's default build is used, it might not pass them. 
# The safest way for Render + Docker is to ensure the variable exists in the environment 
# when 'npm run build' runs.
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Optional: Copy a custom nginx.conf if you need specific headers
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]