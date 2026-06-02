# --- Stage 1E: Build ---
# Change 'node:18' to 'node:20-alpine' or 'node:20-bookworm'
FROM node:20-alpine AS builder

WORKDIR /app
ENV VITE_API_URL=/api



# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Install dependencies
RUN npm install

# Copy source code

COPY . .

# Build the application
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# If you have a custom nginx config, copy it here
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]