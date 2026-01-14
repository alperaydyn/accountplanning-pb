#!/bin/bash

# =============================================================================
# Deploy Script for Account Planning App to Google Cloud Run
# =============================================================================
# This script automates the deployment process using Cloud Build
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Active Google Cloud project configured
#
# Usage: ./deploy.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (matches cloudbuild.yaml)
REGION="us-central1"
SERVICE_NAME="accountplanning-v05"

# Get script directory (handles spaces in path)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Account Planning - Cloud Deployment  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Change to project directory
cd "$SCRIPT_DIR"
echo -e "${YELLOW}Working directory:${NC} $SCRIPT_DIR"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if authenticated
echo -e "${YELLOW}Checking gcloud authentication...${NC}"
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
if [ -z "$ACTIVE_ACCOUNT" ]; then
    echo -e "${RED}Error: No active gcloud account found${NC}"
    echo "Please run: gcloud auth login"
    exit 1
fi
echo -e "${GREEN}Authenticated as:${NC} $ACTIVE_ACCOUNT"

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No project configured${NC}"
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi
echo -e "${GREEN}Project:${NC} $PROJECT_ID"
echo ""

# Generate version tag (timestamp-based since not a git repo)
VERSION="v$(date +%Y%m%d%H%M%S)"
echo -e "${YELLOW}Version tag:${NC} $VERSION"
echo ""

# Optional: Run local build first to catch errors early
echo -e "${YELLOW}Running local build check...${NC}"
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}Local build successful${NC}"
else
    echo -e "${RED}Local build failed. Fix errors before deploying.${NC}"
    echo "Run 'npm run build' to see the errors."
    exit 1
fi
echo ""

# Submit to Cloud Build
echo -e "${YELLOW}Submitting to Cloud Build...${NC}"
echo -e "${BLUE}This may take 2-3 minutes...${NC}"
echo ""

gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions=COMMIT_SHA="$VERSION" \
    .

# Check if deployment succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Deployment Successful!                ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    # Get the service URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)" 2>/dev/null)

    if [ -n "$SERVICE_URL" ]; then
        echo -e "${GREEN}Live URL:${NC} $SERVICE_URL"
        echo ""
        echo -e "${YELLOW}Image:${NC} ${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/accountplanning-v05:${VERSION}"
    fi
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  Deployment Failed                     ${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo "Check the Cloud Build logs for details."
    exit 1
fi
