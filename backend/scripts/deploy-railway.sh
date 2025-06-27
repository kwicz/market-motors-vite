#!/bin/bash

# Railway Deployment Script for Market Motors
# This script handles the deployment process for Railway

set -e  # Exit on any error

echo "🚀 Starting Railway deployment for Market Motors..."

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

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    print_error "You are not logged in to Railway. Please run:"
    echo "railway login"
    exit 1
fi

# Environment setup
print_status "Setting up environment variables..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production file not found. Creating from template..."
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
        print_warning "Please update .env.production with your actual values before deploying"
    else
        print_error ".env.production.example not found. Cannot create production environment file."
        exit 1
    fi
fi

# Load environment variables from .env.production
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Validate required environment variables
required_vars=(
    "DATABASE_URL"
    "JWT_SECRET"
    "JWT_REFRESH_SECRET"
    "SESSION_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set"
        exit 1
    fi
done

# Check if Railway project exists
print_status "Checking Railway project..."
if ! railway status &> /dev/null; then
    print_warning "No Railway project linked. Creating new project..."
    railway login
    railway init
fi

# Set environment variables in Railway
print_status "Setting environment variables in Railway..."

# Database
railway variables --set "DATABASE_URL=$DATABASE_URL"
railway variables --set "DB_SSL=true"

# Authentication
railway variables --set "JWT_SECRET=$JWT_SECRET"
railway variables --set "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
railway variables --set "SESSION_SECRET=$SESSION_SECRET"

# Application
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=3000"
railway variables --set "APP_URL=$APP_URL"
railway variables --set "API_URL=$API_URL"
railway variables --set "VITE_API_BASE_URL=$VITE_API_BASE_URL"

# Security
railway variables --set "CORS_ORIGIN=$CORS_ORIGIN"
railway variables --set "SESSION_COOKIE_SECURE=true"
railway variables --set "TRUST_PROXY=true"

# Logging
railway variables --set "LOG_LEVEL=${LOG_LEVEL:-info}"
railway variables --set "LOG_DIR=/app/logs"

# Error Tracking
if [ ! -z "$SENTRY_DSN" ]; then
    railway variables --set "SENTRY_DSN=$SENTRY_DSN"
    railway variables --set "SENTRY_ENVIRONMENT=production"
fi

# Performance Monitoring
if [ ! -z "$SENTRY_DSN" ]; then
    railway variables --set "ENABLE_PERFORMANCE_MONITORING=true"
    railway variables --set "PERFORMANCE_SAMPLE_RATE=0.1"
fi

# Feature Flags
railway variables --set "ENABLE_REDIS_CACHE=${ENABLE_REDIS_CACHE:-true}"
railway variables --set "ENABLE_IMAGE_OPTIMIZATION=${ENABLE_IMAGE_OPTIMIZATION:-true}"

print_success "Environment variables set successfully"

# Build and deploy
print_status "Building and deploying application..."

# Run pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found"
    exit 1
fi

# Check if build scripts exist
if ! grep -q '"build"' package.json; then
    print_error "Build script not found in package.json"
    exit 1
fi

# Deploy to Railway
print_status "Deploying to Railway..."
railway up --detach

# Wait for deployment to complete
print_status "Waiting for deployment to complete..."
sleep 30

# Get deployment URL
DEPLOYMENT_URL=$(railway domain)
if [ -z "$DEPLOYMENT_URL" ]; then
    print_warning "No custom domain configured. Using Railway generated URL..."
    DEPLOYMENT_URL=$(railway status --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)
fi

# Health check
if [ ! -z "$DEPLOYMENT_URL" ]; then
    print_status "Running health check on $DEPLOYMENT_URL..."
    
    # Wait a bit more for the app to fully start
    sleep 60
    
    # Check if the app is responding
    if curl -f -s "$DEPLOYMENT_URL/health" > /dev/null; then
        print_success "Health check passed! Application is running at $DEPLOYMENT_URL"
    else
        print_warning "Health check failed. The application might still be starting up."
        print_status "You can check the logs with: railway logs"
    fi
else
    print_warning "Could not determine deployment URL"
fi

# Run database migrations if needed
print_status "Checking for database migrations..."
if [ -f "package.json" ] && grep -q '"db:migrate"' package.json; then
    print_status "Running database migrations..."
    railway run npm run db:migrate
    print_success "Database migrations completed"
else
    print_warning "No database migration script found"
fi

# Display deployment information
print_success "Deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "  • Project: $(railway status --json | grep -o '"name":"[^"]*' | cut -d'"' -f4)"
echo "  • Environment: Production"
echo "  • URL: $DEPLOYMENT_URL"
echo ""
echo "🔧 Useful commands:"
echo "  • View logs: railway logs"
echo "  • Check status: railway status"
echo "  • Open in browser: railway open"
echo "  • View variables: railway variables"
echo ""
echo "🎉 Your Market Motors application is now live on Railway!" 