#!/bin/bash

# B-Spot Network Solutions - Local Development Setup Script
# This script automates the local development environment setup

set -e  # Exit on any error

echo "🚀 Setting up B-Spot Network Solutions for local development..."

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_status "Node.js version: $(node --version) ✅"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    print_status "npm version: $(npm --version) ✅"
}

# Install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    if [ -f "package.json" ]; then
        print_status "Installing npm dependencies..."
        npm install
        print_status "Dependencies installed successfully ✅"
    else
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
}

# Setup environment variables
setup_environment() {
    print_header "Setting up Environment Variables"
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            print_status "Creating .env.local from .env.example..."
            cp .env.example .env.local
            print_warning "Please edit .env.local and add your Supabase credentials"
        else
            print_status "Creating .env.local template..."
            cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Development Configuration
NODE_ENV=development
VITE_DEV_MODE=true
EOF
            print_warning "Please edit .env.local and add your Supabase credentials"
        fi
    else
        print_status ".env.local already exists ✅"
    fi
}

# Setup Supabase CLI
setup_supabase() {
    print_header "Setting up Supabase"
    
    if ! command -v supabase &> /dev/null; then
        print_status "Installing Supabase CLI..."
        npm install -g supabase
    else
        print_status "Supabase CLI already installed: $(supabase --version) ✅"
    fi
    
    # Check if Supabase is initialized
    if [ ! -f "supabase/config.toml" ]; then
        print_warning "Supabase not initialized in this project"
        read -p "Would you like to initialize Supabase? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            supabase init
            print_status "Supabase initialized ✅"
        fi
    else
        print_status "Supabase already initialized ✅"
    fi
}

# Setup database
setup_database() {
    print_header "Setting up Database"
    
    read -p "Would you like to start local Supabase? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Starting local Supabase..."
        supabase start
        
        # Apply schema if it exists
        if [ -f "database/schema.sql" ]; then
            read -p "Would you like to apply the database schema? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_status "Applying database schema..."
                supabase db reset --db-url postgresql://postgres:postgres@localhost:54322/postgres
                print_status "Database schema applied ✅"
            fi
        fi
        
        print_status "Local Supabase started ✅"
        print_status "Supabase Studio available at: http://localhost:54323"
    else
        print_warning "Make sure to configure your remote Supabase credentials in .env.local"
    fi
}

# Verify setup
verify_setup() {
    print_header "Verifying Setup"
    
    # Check if all required files exist
    required_files=("package.json" "vite.config.ts" "src/main.tsx" ".env.local")
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_status "$file exists ✅"
        else
            print_error "$file is missing ❌"
        fi
    done
    
    # Try to build the project
    print_status "Testing build process..."
    if npm run build > /dev/null 2>&1; then
        print_status "Build test successful ✅"
    else
        print_warning "Build test failed - check your configuration"
    fi
}

# Start development server
start_dev_server() {
    print_header "Starting Development Server"
    
    read -p "Would you like to start the development server? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Starting development server..."
        print_status "The application will be available at: http://localhost:8080"
        npm run dev
    else
        print_status "You can start the development server later with: npm run dev"
    fi
}

# Main setup flow
main() {
    print_header "B-Spot Network Solutions - Local Setup"
    
    # Pre-flight checks
    check_node
    check_npm
    
    # Setup steps
    install_dependencies
    setup_environment
    setup_supabase
    setup_database
    verify_setup
    
    print_header "Setup Complete!"
    print_status "Your local development environment is ready! 🎉"
    print_status ""
    print_status "Next steps:"
    print_status "1. Edit .env.local with your Supabase credentials"
    print_status "2. Run 'npm run dev' to start the development server"
    print_status "3. Open http://localhost:8080 in your browser"
    print_status ""
    print_status "Useful commands:"
    print_status "- npm run dev         # Start development server"
    print_status "- npm run build       # Build for production"
    print_status "- npm run lint        # Run linting"
    print_status "- supabase status     # Check Supabase status"
    print_status "- supabase studio     # Open Supabase Studio"
    
    start_dev_server
}

# Run main function
main "$@"