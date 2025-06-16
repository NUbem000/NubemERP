#!/bin/bash

# Deploy script for Holded Analysis Platform
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"holded-analysis"}
REGION=${GCP_REGION:-"europe-west1"}
FRONTEND_BUCKET=${FRONTEND_BUCKET:-"holded-analysis-frontend"}
BACKEND_SERVICE=${BACKEND_SERVICE:-"holded-analysis-backend"}

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed"
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if authenticated with gcloud
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
        log_error "Not authenticated with gcloud. Run: gcloud auth login"
        exit 1
    fi
    
    log_info "All requirements satisfied"
}

build_frontend() {
    log_info "Building frontend..."
    
    # Install dependencies
    pnpm install --frozen-lockfile
    
    # Run tests
    log_info "Running frontend tests..."
    pnpm test:coverage
    
    # Build for production
    log_info "Building frontend for production..."
    pnpm build
    
    log_info "Frontend build completed"
}

deploy_frontend() {
    log_info "Deploying frontend to Cloud Storage..."
    
    # Create bucket if it doesn't exist
    if ! gsutil ls -b gs://${FRONTEND_BUCKET} &> /dev/null; then
        log_info "Creating storage bucket..."
        gsutil mb -p ${PROJECT_ID} -c STANDARD -l ${REGION} gs://${FRONTEND_BUCKET}
    fi
    
    # Enable public access
    gsutil iam ch allUsers:objectViewer gs://${FRONTEND_BUCKET}
    
    # Upload files
    log_info "Uploading files..."
    gsutil -m rsync -r -d dist/ gs://${FRONTEND_BUCKET}/
    
    # Set cache headers
    gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://${FRONTEND_BUCKET}/**/*.js
    gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://${FRONTEND_BUCKET}/**/*.css
    gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://${FRONTEND_BUCKET}/index.html
    
    # Configure bucket as website
    gsutil web set -m index.html -e 404.html gs://${FRONTEND_BUCKET}
    
    log_info "Frontend deployed successfully"
}

build_backend() {
    log_info "Building backend..."
    
    cd backend
    
    # Install dependencies
    pnpm install --frozen-lockfile
    
    # Run tests
    log_info "Running backend tests..."
    pnpm test:coverage
    
    # Build Docker image
    log_info "Building Docker image..."
    docker build -t gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}:latest .
    
    cd ..
    
    log_info "Backend build completed"
}

deploy_backend() {
    log_info "Deploying backend to Cloud Run..."
    
    # Push Docker image
    log_info "Pushing Docker image..."
    docker push gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}:latest
    
    # Deploy to Cloud Run
    log_info "Deploying to Cloud Run..."
    gcloud run deploy ${BACKEND_SERVICE} \
        --image gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}:latest \
        --platform managed \
        --region ${REGION} \
        --allow-unauthenticated \
        --min-instances 1 \
        --max-instances 10 \
        --memory 1Gi \
        --cpu 1 \
        --timeout 60 \
        --concurrency 100 \
        --set-env-vars NODE_ENV=production
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe ${BACKEND_SERVICE} --region ${REGION} --format='value(status.url)')
    log_info "Backend deployed at: ${SERVICE_URL}"
}

setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Enable required APIs
    gcloud services enable monitoring.googleapis.com
    gcloud services enable logging.googleapis.com
    gcloud services enable cloudtrace.googleapis.com
    gcloud services enable clouderrorReporting.googleapis.com
    
    # Create uptime checks
    gcloud monitoring uptime-checks create \
        --display-name="Holded Backend Health Check" \
        --monitored-resource="type=uptime_url,host=${SERVICE_URL}/health"
    
    log_info "Monitoring setup completed"
}

run_smoke_tests() {
    log_info "Running smoke tests..."
    
    # Test frontend
    FRONTEND_URL="https://storage.googleapis.com/${FRONTEND_BUCKET}/index.html"
    if curl -f -s -o /dev/null ${FRONTEND_URL}; then
        log_info "Frontend smoke test passed"
    else
        log_error "Frontend smoke test failed"
        exit 1
    fi
    
    # Test backend health
    if curl -f -s -o /dev/null ${SERVICE_URL}/health; then
        log_info "Backend smoke test passed"
    else
        log_error "Backend smoke test failed"
        exit 1
    fi
    
    log_info "All smoke tests passed"
}

# Main deployment flow
main() {
    log_info "Starting deployment process..."
    
    check_requirements
    
    # Frontend deployment
    build_frontend
    deploy_frontend
    
    # Backend deployment
    build_backend
    deploy_backend
    
    # Post-deployment
    setup_monitoring
    run_smoke_tests
    
    log_info "Deployment completed successfully!"
    log_info "Frontend URL: https://storage.googleapis.com/${FRONTEND_BUCKET}/index.html"
    log_info "Backend URL: ${SERVICE_URL}"
}

# Run main function
main