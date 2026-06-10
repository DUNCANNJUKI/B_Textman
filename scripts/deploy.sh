#!/bin/bash

# B-Spot Network Solutions - Production Deployment Script
# This script builds and deploys the application to various platforms

set -e  # Exit on any error

echo "🚀 Deploying B-Spot Network Solutions..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Check environment
check_environment() {
    print_header "Checking Environment"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    
    print_status "Environment check passed ✅"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    print_status "Installing dependencies (including devDependencies for build)..."
    npm ci
    print_status "Dependencies installed ✅"
}

# Run tests and linting
run_tests() {
    print_header "Running Quality Checks"
    
    # Run linting
    print_status "Running ESLint..."
    if npm run lint; then
        print_status "Linting passed ✅"
    else
        print_error "Linting failed ❌"
        exit 1
    fi
    
    # Type checking
    print_status "Running TypeScript type checking..."
    if npx tsc --noEmit; then
        print_status "Type checking passed ✅"
    else
        print_error "Type checking failed ❌"
        exit 1
    fi
}

# Build application
build_application() {
    print_header "Building Application"
    
    # Set production environment
    export NODE_ENV=production
    
    print_status "Building for production..."
    if npm run build; then
        print_status "Build completed successfully ✅"
    else
        print_error "Build failed ❌"
        exit 1
    fi
    
    # Check if dist directory exists
    if [ ! -d "dist" ]; then
        print_error "Build output directory 'dist' not found"
        exit 1
    fi
    
    print_status "Build artifacts created in 'dist' directory"
}

# Deploy to Vercel
deploy_vercel() {
    print_header "Deploying to Vercel"
    
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    print_status "Deploying to Vercel..."
    vercel --prod
    print_status "Deployed to Vercel ✅"
}

# Deploy to Netlify
deploy_netlify() {
    print_header "Deploying to Netlify"
    
    if ! command -v netlify &> /dev/null; then
        print_status "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    print_status "Deploying to Netlify..."
    netlify deploy --prod --dir=dist
    print_status "Deployed to Netlify ✅"
}

# Deploy using Docker
deploy_docker() {
    print_header "Building Docker Image"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Build Docker image
    print_status "Building Docker image..."
    docker build -t bspot-network:latest .
    
    print_status "Docker image built successfully ✅"
    print_status "You can now run: docker run -p 80:80 bspot-network:latest"
}

# Deploy to GitHub Pages
deploy_github_pages() {
    print_header "Deploying to GitHub Pages"
    
    # Check if gh-pages is installed
    if ! npm list gh-pages &> /dev/null; then
        print_status "Installing gh-pages..."
        npm install --save-dev gh-pages
    fi
    
    print_status "Deploying to GitHub Pages..."
    npx gh-pages -d dist
    print_status "Deployed to GitHub Pages ✅"
}

# Create deployment package
create_package() {
    print_header "Creating Deployment Package"
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    PACKAGE_NAME="bspot-network-${TIMESTAMP}.tar.gz"
    
    print_status "Creating deployment package: $PACKAGE_NAME"
    
    # Create package with dist directory and necessary files
    tar -czf "$PACKAGE_NAME" \
        dist/ \
        package.json \
        package-lock.json \
        nginx.conf \
        Dockerfile \
        docker-compose.yml \
        README.md
    
    print_status "Deployment package created: $PACKAGE_NAME ✅"
    print_status "Package size: $(du -h $PACKAGE_NAME | cut -f1)"
}

# Main deployment menu
deployment_menu() {
    print_header "Deployment Options"
    
    echo "Select deployment target:"
    echo "1) Vercel"
    echo "2) Netlify"
    echo "3) Docker Image"
    echo "4) GitHub Pages"
    echo "5) Create Deployment Package"
    echo "6) All platforms"
    echo "0) Exit"
    
    read -p "Enter your choice (0-6): " choice
    
    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            deploy_netlify
            ;;
        3)
            deploy_docker
            ;;
        4)
            deploy_github_pages
            ;;
        5)
            create_package
            ;;
        6)
            deploy_vercel
            deploy_netlify
            deploy_docker
            create_package
            ;;
        0)
            print_status "Deployment cancelled"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            deployment_menu
            ;;
    esac
}

# Cleanup
cleanup() {
    print_header "Cleanup"
    
    # Remove node_modules if installed for deployment only
    if [ -f ".deployment_install" ]; then
        print_status "Cleaning up deployment dependencies..."
        rm -rf node_modules
        rm .deployment_install
    fi
    
    print_status "Cleanup completed ✅"
}

# Main function
main() {
    print_header "B-Spot Network Solutions - Deployment Script"
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        print_warning "Not in a git repository. Some deployment options may not work."
    fi
    
    # Check for uncommitted changes
    if git diff --quiet; then
        print_status "No uncommitted changes ✅"
    else
        print_warning "You have uncommitted changes. Consider committing them before deployment."
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Run checks and build
    check_environment
    install_dependencies
    run_tests
    build_application
    
    # Show deployment options
    deployment_menu
    
    # Cleanup
    cleanup
    
    print_header "Deployment Complete!"
    print_status "Your application has been deployed successfully! 🎉"
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"