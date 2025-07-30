#!/bin/bash

# ExamTech Docker Deployment Script
# This script helps deploy and manage the ExamTech application using Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! docker-compose --version > /dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs/backend
    mkdir -p logs/frontend
    mkdir -p logs/mongodb
    mkdir -p logs/nginx
    mkdir -p logs/redis
    mkdir -p backend/uploads
    mkdir -p nginx/ssl
    
    print_success "Directories created"
}

# Function to check environment file
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp env.example .env
        print_success ".env file created from template"
        print_warning "Please review and update the .env file with your configuration"
    else
        print_success ".env file found"
    fi
}

# Function to build and start services
deploy() {
    print_status "Starting ExamTech deployment..."
    
    # Stop any existing containers
    print_status "Stopping existing containers..."
    docker-compose down --remove-orphans
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose up -d --build
    
    print_success "Deployment completed!"
    print_status "Services are starting up. This may take a few minutes..."
}

# Function to check service health
check_health() {
    print_status "Checking service health..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check MongoDB
    if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        print_success "MongoDB is healthy"
    else
        print_warning "MongoDB health check failed"
    fi
    
    # Check Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is healthy"
    else
        print_warning "Redis health check failed"
    fi
    
    # Check Backend
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check Frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_warning "Frontend health check failed"
    fi
}

# Function to show logs
show_logs() {
    local service=${1:-"all"}
    
    if [ "$service" = "all" ]; then
        print_status "Showing logs for all services..."
        docker-compose logs -f
    else
        print_status "Showing logs for $service..."
        docker-compose logs -f $service
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "Services stopped"
}

# Function to restart services
restart_services() {
    print_status "Restarting all services..."
    docker-compose restart
    print_success "Services restarted"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker-compose down --volumes --remove-orphans
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    print_success "Cleanup completed"
}

# Function to show status
show_status() {
    print_status "Service status:"
    docker-compose ps
    
    echo ""
    print_status "Resource usage:"
    docker stats --no-stream
}

# Function to backup data
backup_data() {
    local backup_dir="backup_$(date +%Y%m%d_%H%M%S)"
    
    print_status "Creating backup in $backup_dir..."
    mkdir -p $backup_dir
    
    # Backup MongoDB data
    docker-compose exec -T mongodb mongodump --out /tmp/backup
    docker cp examtech-mongodb:/tmp/backup $backup_dir/mongodb
    
    # Backup uploads
    if [ -d "backend/uploads" ]; then
        cp -r backend/uploads $backup_dir/
    fi
    
    # Backup logs
    if [ -d "logs" ]; then
        cp -r logs $backup_dir/
    fi
    
    print_success "Backup created in $backup_dir"
}

# Function to restore data
restore_data() {
    local backup_dir=$1
    
    if [ -z "$backup_dir" ]; then
        print_error "Please specify backup directory"
        exit 1
    fi
    
    if [ ! -d "$backup_dir" ]; then
        print_error "Backup directory $backup_dir not found"
        exit 1
    fi
    
    print_status "Restoring data from $backup_dir..."
    
    # Restore MongoDB data
    if [ -d "$backup_dir/mongodb" ]; then
        docker cp $backup_dir/mongodb examtech-mongodb:/tmp/restore
        docker-compose exec -T mongodb mongorestore /tmp/restore
    fi
    
    # Restore uploads
    if [ -d "$backup_dir/uploads" ]; then
        cp -r $backup_dir/uploads backend/
    fi
    
    print_success "Data restored from $backup_dir"
}

# Function to show help
show_help() {
    echo "ExamTech Docker Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy          Build and start all services"
    echo "  start           Start existing services"
    echo "  stop            Stop all services"
    echo "  restart         Restart all services"
    echo "  status          Show service status"
    echo "  logs [service]  Show logs (default: all services)"
    echo "  health          Check service health"
    echo "  backup          Create backup of data"
    echo "  restore <dir>   Restore data from backup directory"
    echo "  cleanup         Clean up Docker resources"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 logs backend"
    echo "  $0 backup"
    echo "  $0 restore backup_20231201_143022"
}

# Main script logic
case "${1:-help}" in
    "deploy")
        check_docker
        check_docker_compose
        create_directories
        check_env_file
        deploy
        check_health
        ;;
    "start")
        check_docker
        check_docker_compose
        docker-compose up -d
        print_success "Services started"
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs $2
        ;;
    "health")
        check_health
        ;;
    "backup")
        backup_data
        ;;
    "restore")
        restore_data $2
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac 