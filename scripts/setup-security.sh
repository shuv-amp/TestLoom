#!/bin/bash

# TestLoom Security Setup Script
# This script helps set up the secure authentication system

set -e

echo "🔐 TestLoom Security Setup"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if running from the correct directory
if [[ ! -f "pnpm-workspace.yaml" ]]; then
    print_error "Please run this script from the TestLoom root directory"
    exit 1
fi

print_info "Setting up secure authentication system..."

# 1. Generate secure JWT secrets
print_info "Generating secure JWT secrets..."

BACKEND_DIR="packages/backend"
ENV_FILE="$BACKEND_DIR/.env"
ENV_EXAMPLE="$BACKEND_DIR/.env.example"

# Function to generate secure random string
generate_secret() {
    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
}

JWT_ACCESS_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)

print_status "JWT secrets generated"

# 2. Create .env file if it doesn't exist
if [[ ! -f "$ENV_FILE" ]]; then
    print_info "Creating .env file from template..."
    
    if [[ -f "$ENV_EXAMPLE" ]]; then
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        print_status ".env file created from template"
    else
        print_error ".env.example not found"
        exit 1
    fi
fi

# 3. Update JWT secrets in .env file
print_info "Updating JWT secrets in .env file..."

# Use sed to replace the JWT secrets (works on both macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_ACCESS_SECRET/" "$ENV_FILE"
    sed -i '' "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" "$ENV_FILE"
else
    # Linux
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_ACCESS_SECRET/" "$ENV_FILE"
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" "$ENV_FILE"
fi

print_status "JWT secrets updated in .env file"

# 4. Install backend dependencies
print_info "Installing backend dependencies..."
cd "$BACKEND_DIR"

if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    print_error "Neither pnpm nor npm found. Please install Node.js and npm/pnpm."
    exit 1
fi

print_status "Backend dependencies installed"
cd - > /dev/null

# 5. Install frontend dependencies
print_info "Installing frontend dependencies..."
cd "packages/frontend"

if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
else
    print_error "Neither pnpm nor npm found. Please install Node.js and npm/pnpm."
    exit 1
fi

print_status "Frontend dependencies installed"
cd - > /dev/null

# 6. Verify database connection
print_info "Checking database configuration..."

# Check if MongoDB URI is set
if grep -q "mongodb://localhost:27017/testloom" "$ENV_FILE"; then
    print_warning "Using default MongoDB URI. Update MONGODB_URI in .env for production."
fi

print_status "Database configuration checked"

# 7. Create security summary
print_info "Creating security implementation summary..."

cat > "SECURITY_SETUP_SUMMARY.md" << EOF
# TestLoom Security Setup Summary

## 🔒 Security Features Implemented

### Authentication Security
- ✅ JWT Access Tokens (15-minute lifetime)
- ✅ JWT Refresh Tokens (7-day lifetime) 
- ✅ Automatic Token Rotation
- ✅ Secure HTTP-Only Cookie Storage
- ✅ Multi-Session Support

### Security Middleware
- ✅ Rate Limiting (Express Rate Limit)
- ✅ Security Headers (Helmet.js)
- ✅ CORS Protection
- ✅ Request Logging
- ✅ Input Validation (Zod)

### Frontend Security
- ✅ Secure Authentication Manager
- ✅ Automatic Token Refresh
- ✅ Route Protection Middleware
- ✅ Error Handling Composables
- ✅ No Token Storage in localStorage

## 🚀 Setup Complete

### Generated Secrets
- JWT Access Token Secret: Generated ✅
- JWT Refresh Token Secret: Generated ✅

### Next Steps
1. Update MONGODB_URI in .env if needed
2. Review CORS_ORIGIN setting for production
3. Test the authentication flow
4. Deploy with HTTPS enabled

### Testing the Setup
\`\`\`bash
# Start backend
cd packages/backend
npm run dev

# Start frontend (in new terminal)
cd packages/frontend  
npm run dev
\`\`\`

### Production Checklist
- [ ] Use HTTPS only
- [ ] Set secure environment variables
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Regular secret rotation schedule

## 📖 Documentation
- Security details: docs/SECURITY.md
- API documentation: docs/api/authentication.md
EOF

print_status "Security setup summary created"

# 8. Final security check
print_info "Running final security checks..."

# Check if JWT secrets are properly set
if grep -q "your-super-secure" "$ENV_FILE"; then
    print_error "Please update the JWT secrets in $ENV_FILE with the generated values"
    exit 1
fi

# Check file permissions on sensitive files
chmod 600 "$ENV_FILE"
print_status "Environment file permissions secured"

# Success message
echo ""
print_status "Security setup completed successfully!"
echo ""
print_info "🔐 Your JWT secrets have been generated and saved securely."
print_info "📁 Check $ENV_FILE for your configuration."
print_info "📖 Read SECURITY_SETUP_SUMMARY.md for next steps."
print_info "📚 Full security documentation available in docs/SECURITY.md"
echo ""
print_warning "Remember to:"
print_warning "  1. Keep your .env file secure and never commit it to version control"
print_warning "  2. Use HTTPS in production"
print_warning "  3. Regularly rotate your JWT secrets"
print_warning "  4. Monitor your application for security issues"
echo ""
print_status "Happy secure coding! 🚀"
EOF
