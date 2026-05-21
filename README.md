# Inventory-web
Inventory is just the web development intended to develop an inventory system

## Render deployment
This repo is configured for a two-service Render deployment using Docker:

- `business-record-app-backend` (Django backend in `src_api`)
- `business-record-app-frontend` (React/Vite frontend in `inventory-frontend`)
- `business-record-app-db` (managed PostgreSQL database)

### How to deploy
1. Push branch `render-geploy-ppacc`.
2. Create a Render Web Service for the backend:
   - Root directory: `src_api`
   - Dockerfile path: `Dockerfile`
3. Create a Render Web Service for the frontend:
   - Root directory: `inventory-frontend`
   - Dockerfile path: `Dockerfile`
4. Create a Render PostgreSQL database:
   - Name: `business-record-app-db`
   - Database name: `business_record_db`

### Environment variables
Backend service:
- `MY_SECRET_KEY`
- `DEBUG=false`
- `ALLOWED_HOSTS=localhost,127.0.0.1,business-record-app-backend.onrender.com`
- `CORS_ALLOWED_ORIGINS=https://business-record-app-frontend.onrender.com`
- `DATABASE_URL` is provided by Render from `business-record-app-db`

Frontend service:
- `VITE_API_URL=https://business-record-app-backend.onrender.com`

### After deployment
Run Django migrations in backend shell:

```bash
python manage.py migrate
```
