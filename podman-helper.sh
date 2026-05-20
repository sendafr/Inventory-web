#!/bin/bash

# Federalism Project - Podman/Docker Helper Script
# Usage: ./podman-helper.sh [command]

PROJECT_DIR="/home/fred/Documents/Fedex/federalism"

case "$1" in
    "dev")
        echo "📁 Switching to main branch (development mode, no containers)"
        cd "$PROJECT_DIR"
        git checkout main
        echo "✅ You're on main branch - original project structure"
        ;;
    
    "container")
        echo "🐳 Switching to docker/podman-setup branch (containerized mode)"
        cd "$PROJECT_DIR"
        git checkout docker/podman-setup
        echo "✅ You're on docker/podman-setup branch"
        ;;
    
    "start")
        echo "🚀 Starting containers with podman-compose..."
        cd "$PROJECT_DIR"
        if [ ! -f ".env" ]; then
            echo "⚠️  .env file not found. Creating from template..."
            cp .env.example .env 2>/dev/null || echo "Create .env manually using PODMAN_SETUP.md"
        fi
        podman-compose up -d
        echo "✅ Containers started. Check status with: podman ps"
        ;;
    
    "stop")
        echo "🛑 Stopping containers..."
        cd "$PROJECT_DIR"
        podman-compose down
        echo "✅ Containers stopped"
        ;;
    
    "logs")
        echo "📋 Showing container logs (Ctrl+C to exit)..."
        cd "$PROJECT_DIR"
        podman-compose logs -f
        ;;
    
    "logs-backend")
        echo "📋 Showing backend logs..."
        cd "$PROJECT_DIR"
        podman-compose logs -f backend
        ;;
    
    "logs-frontend")
        echo "📋 Showing frontend logs..."
        cd "$PROJECT_DIR"
        podman-compose logs -f frontend
        ;;
    
    "status")
        echo "📊 Container Status:"
        podman ps
        echo -e "\n📊 Networks:"
        podman network ls
        ;;
    
    "shell-backend")
        echo "🐚 Opening shell in backend container..."
        cd "$PROJECT_DIR"
        podman exec -it federalism-src_api bash
        ;;
    
    "shell-frontend")
        echo "🐚 Opening shell in frontend container..."
        cd "$PROJECT_DIR"
        podman exec -it federalism-fed-frontend sh
        ;;
    
    "rebuild")
        echo "🔨 Rebuilding images..."
        cd "$PROJECT_DIR"
        podman-compose down
        podman-compose build --no-cache
        echo "✅ Images rebuilt"
        ;;
    
    "clean")
        echo "🧹 Cleaning up containers, networks, and volumes..."
        cd "$PROJECT_DIR"
        podman-compose down -v
        podman network rm app-network 2>/dev/null || true
        echo "✅ Cleanup complete"
        ;;
    
    "branch-status")
        echo "📍 Current branch status:"
        cd "$PROJECT_DIR"
        echo "Current branch: $(git branch --show-current)"
        git status
        ;;
    
    "sync-branches")
        echo "🔄 Syncing docker/podman-setup with latest main..."
        cd "$PROJECT_DIR"
        git checkout docker/podman-setup
        git rebase main
        echo "✅ Sync complete"
        ;;
    
    "help"|"")
        echo "Federalism Project - Podman/Docker Helper"
        echo ""
        echo "Usage: podman-helper.sh [command]"
        echo ""
        echo "Branch Commands:"
        echo "  dev                - Switch to main branch (original project)"
        echo "  container          - Switch to docker/podman-setup branch"
        echo "  branch-status      - Show current branch and status"
        echo "  sync-branches      - Sync docker branch with main"
        echo ""
        echo "Container Commands (run from docker/podman-setup branch):"
        echo "  start              - Start all containers"
        echo "  stop               - Stop all containers"
        echo "  status             - Show container and network status"
        echo "  rebuild            - Rebuild images from scratch"
        echo "  clean              - Remove containers, networks, and volumes"
        echo ""
        echo "Logging Commands:"
        echo "  logs               - Show all container logs (follow mode)"
        echo "  logs-backend       - Show backend logs only"
        echo "  logs-frontend      - Show frontend logs only"
        echo ""
        echo "Shell Access:"
        echo "  shell-backend      - Open bash in backend container"
        echo "  shell-frontend     - Open shell in frontend container"
        echo ""
        echo "Examples:"
        echo "  ./podman-helper.sh dev           # Switch to development"
        echo "  ./podman-helper.sh container     # Switch to containerized"
        echo "  ./podman-helper.sh start         # Start containers"
        echo "  ./podman-helper.sh logs-backend  # View backend logs"
        ;;
    
    *)
        echo "❌ Unknown command: $1"
        echo "Run './podman-helper.sh help' for available commands"
        ;;
esac
