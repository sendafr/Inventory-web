# Stage 1: Build
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim
WORKDIR /app

# Copy installed packages and binaries from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
ENV PATH=/usr/local/bin:$PATH
COPY --from=builder /usr/local/bin/gunicorn /usr/local/bin/gunicorn

# Copy application code
COPY . .

# Render requires the app to listen on the port specified by the $PORT env var
# Default to 8000 if $PORT is not set (for local testing), but Render sets it automatically
ENV PORT=8000

# Run with Gunicorn, binding to 0.0.0.0 and the dynamic port
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "--workers", "3", "inventory_api.wsgi:application"]
#CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:$PORT --config gunicorn.conf --chdir /app inventory_api.wsgi:application"]