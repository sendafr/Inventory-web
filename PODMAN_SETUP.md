# Podman Setup & Git Branching Guide

## Podman Compatibility

**Good news:** Podman is a drop-in replacement for Docker. Your Dockerfiles and docker-compose.yaml are already compatible! 

### Key Differences for Podman:
1. **Service networking**: Podman rootless mode requires special handling
2. **Rootless containers**: By default, Podman runs rootless (safer)
3. **Volume permissions**: May need adjustment for rootless mode

---

## Part 1: Running with Podman

### Option A: Using Podman with docker-compose (Recommended)
```bash
# Install podman-docker compatibility layer
sudo apt-get install podman-docker  # Debian/Ubuntu
# or
sudo dnf install podman-docker      # Fedora/RHEL

# Run exactly like Docker
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### Option B: Using Podman directly with podman-compose
```bash
# Install podman-compose
pip install podman-compose

# Run your containers
podman-compose -f docker-compose.yaml up -d
podman-compose logs -f
podman-compose down
```

### Option C: Using native Podman CLI
```bash
# Create a pod network
podman network create app-network

# Build images
podman build -t federalism-backend ./src_api
podman build -t federalism-frontend ./fed-frontend

# Run containers
podman run -d --name postgres --network app-network -e POSTGRES_PASSWORD=securepassword postgres:15-alpine
podman run -d --name backend --network app-network -p 8000:8000 federalism-backend
podman run -d --name frontend --network app-network -p 80:80 federalism-frontend
```

---

## Part 2: Git Branching Strategy (Keep Original in main, Containers in separate branch)

### Step 1: Create containerization branch
```bash
cd /home/fred/Documents/Fedex/federalism

# Ensure you're on main branch
git checkout main

# Create a new branch for containerization
git checkout -b docker/podman-setup
```

### Step 2: Commit container configuration changes
```bash
# Add all the container-related files we just updated
git add docker-compose.yaml \
        src_api/Dockerfile \
        fed-frontend/Dockerfile \
        fed-frontend/ngnix.conf \
        src_api/gunicorn.conf \
        .env \
        .dockerignore

git commit -m "feat: Add Podman/Docker containerization setup

- Configure Docker Compose for multi-container orchestration
- Add Django backend Dockerfile with gunicorn
- Add Node.js frontend Dockerfile with nginx
- Update nginx configuration for API proxying
- Create environment configuration (.env)
- Optimize .dockerignore for smaller images"
```

### Step 3: Return to main branch (without container files)
```bash
# Go back to main
git checkout main

# Your main branch keeps the original project structure
```

### Step 4: Switching Between Branches
```bash
# To work with containers, use this branch:
git checkout docker/podman-setup

# To run the project without containers, use main:
git checkout main

# View all branches
git branch -a

# List commits on each branch
git log --oneline docker/podman-setup --not main
```

---

## Part 3: Workflow Tips

### Running Containers (on docker/podman-setup branch)
```bash
# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Start all services
podman-compose up -d

# Check status
podman ps
podman network ls

# View logs
podman-compose logs -f backend
podman-compose logs -f frontend

# Stop services
podman-compose down
```

### Development Workflow
```bash
# Branch layout:
# main              <- Original project (no containers)
# docker/podman-setup  <- Containerized version

# To sync updates from main to docker branch:
git checkout docker/podman-setup
git rebase main

# Or merge main into docker branch:
git merge main
```

---

## Part 4: Important Files Overview

| File | Purpose |
|------|---------|
| `docker-compose.yaml` | Orchestrates 3 services: postgres, backend, frontend |
| `src_api/Dockerfile` | Builds Django backend with gunicorn |
| `fed-frontend/Dockerfile` | Builds React frontend with nginx |
| `.env` | Environment variables for all containers |
| `.dockerignore` | Reduces image size by excluding unnecessary files |
| `ngnix.conf` | Routes frontend and proxies API requests |
| `gunicorn.conf` | Configures WSGI application server |

---

## Part 5: Common Commands for Podman

```bash
# List all containers
podman ps -a

# View container logs
podman logs <container-id>

# Execute command in container
podman exec -it <container-id> bash

# Remove containers
podman rm <container-id>

# Remove images
podman rmi <image-id>

# Inspect container details
podman inspect <container-id>

# Network operations
podman network ls
podman network inspect app-network
```

---

## Troubleshooting

### Rootless Permission Issues
If you get permission errors when running rootless Podman:
```bash
# Check if Podman is running rootless
podman info | grep rootless

# For persistent volumes in rootless mode, use --userns=keep-id
# This is handled automatically in modern Podman versions
```

### Port Conflicts
```bash
# Check what's using port 80 or 8000
sudo lsof -i :80
sudo lsof -i :8000

# Podman runs rootless, so ports < 1024 require special setup
# Alternative: Use port 8080 instead of 80
```

### Database Connection Issues
Ensure containers can communicate:
```bash
podman network inspect app-network
podman exec -it federalism-src_api ping db
```

