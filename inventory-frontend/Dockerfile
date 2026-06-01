FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files FIRST
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Then copy all code including package.json
COPY . .

ENV NODE_OPTIONS=--openssl-legacy-provider
ENV VITE_API_URL=/api
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g",  "-c", "/etc/nginx/templates/default.conf.template" "-s", "reload",daemon off; ]"