# Stage 1: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN echo "VITE_API_URL during build = [${VITE_API_URL}]"
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Install envsubst (used to replace variables in nginx.conf)
RUN apk add --no-cache gettext

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html


# Expose port (Render handles the mapping)
#EXPOSE 80
#only BACKEND_URL needsenvsubst at runtime for nginx proxy
ENV BACKEND_URL=${BACKEND_URL}
# The CMD must ensure VITE_API_URL is set before running sed
# Render passes env vars to the container, so $VITE_API_URL is available here
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]