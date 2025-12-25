# Deployment Guide - Google Cloud with Workload Identity Federation

## Overview

This document explains how to deploy the Account Planning application to Google Cloud Run with proper authentication using Workload Identity Federation and OAuth 2.0.

## Prerequisites

- Google Cloud Project with billing enabled
- GitHub repository configured
- `gcloud` CLI installed and configured
- Required APIs enabled:
  - Cloud Run API
  - Cloud Build API
  - IAM API
  - Identity and Access Management (IAM) API

## OAuth 2.0 Access Token Generation

### Understanding the Requirement

To generate OAuth 2.0 access tokens or ID tokens for Google Cloud services, you must:

1. **Provide a service account email** - This identifies which Google Cloud Service Account will be impersonated
2. **Configure Workload Identity Pool permissions** - The Workload Identity Pool must have `roles/iam.workloadIdentityUser` permissions on the target Google Cloud Service Account

### Why This Matters

Workload Identity Federation allows external workloads (like GitHub Actions) to authenticate to Google Cloud services without using service account keys. This is more secure because:

- No long-lived credentials stored in GitHub secrets
- Automatic token rotation
- Better audit trail
- Follows Google Cloud security best practices

## Setting Up Workload Identity Federation Through a Service Account

### Step 1: Create a Google Cloud Service Account

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
export SERVICE_ACCOUNT_NAME="github-actions-sa"

# Create the service account
gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
    --project="${PROJECT_ID}" \
    --description="Service account for GitHub Actions deployments" \
    --display-name="GitHub Actions Service Account"

# Get the service account email
export SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
```

### Step 2: Grant Required Permissions to Service Account

Grant the service account permissions needed to deploy to Cloud Run:

```bash
# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/run.admin"

# Grant Service Account User role (required to deploy Cloud Run services)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/iam.serviceAccountUser"

# Grant Artifact Registry Writer role (if using Artifact Registry)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/artifactregistry.writer"

# Grant Storage Admin role (if using Cloud Storage)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/storage.admin"
```

### Step 3: Create Workload Identity Pool

```bash
export WORKLOAD_IDENTITY_POOL="github-pool"
export WORKLOAD_IDENTITY_PROVIDER="github-provider"

# Create the workload identity pool
gcloud iam workload-identity-pools create ${WORKLOAD_IDENTITY_POOL} \
    --project="${PROJECT_ID}" \
    --location="global" \
    --display-name="GitHub Actions Pool"

# Get the full pool name
export WORKLOAD_IDENTITY_POOL_ID="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WORKLOAD_IDENTITY_POOL}"
```

Note: You can get your project number with:
```bash
export PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
```

### Step 4: Create Workload Identity Provider

Configure the provider for GitHub Actions:

```bash
export GITHUB_REPO_OWNER="your-github-username"
export GITHUB_REPO_NAME="accountplanning-pb"

# Create the workload identity provider
gcloud iam workload-identity-pools providers create-oidc ${WORKLOAD_IDENTITY_PROVIDER} \
    --project="${PROJECT_ID}" \
    --location="global" \
    --workload-identity-pool="${WORKLOAD_IDENTITY_POOL}" \
    --display-name="GitHub Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
    --attribute-condition="assertion.repository_owner == '${GITHUB_REPO_OWNER}'" \
    --issuer-uri="https://token.actions.githubusercontent.com"
```

### Step 5: Grant Workload Identity User Role (Critical Step)

This is the **key requirement** mentioned in the problem statement. The Workload Identity Pool must have `roles/iam.workloadIdentityUser` permissions on the target service account:

```bash
# Allow the GitHub Actions from your repository to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding ${SERVICE_ACCOUNT_EMAIL} \
    --project="${PROJECT_ID}" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}"
```

This command:
- Grants `roles/iam.workloadIdentityUser` to the Workload Identity Pool
- Restricts access to only workflows from your specific GitHub repository
- Allows GitHub Actions to generate OAuth 2.0 tokens by impersonating the service account

### Step 6: Get Workload Identity Provider Resource Name

Get the full resource name for use in GitHub Actions:

```bash
gcloud iam workload-identity-pools providers describe ${WORKLOAD_IDENTITY_PROVIDER} \
    --project="${PROJECT_ID}" \
    --location="global" \
    --workload-identity-pool="${WORKLOAD_IDENTITY_POOL}" \
    --format="value(name)"
```

Save this output - you'll need it for GitHub Actions configuration.

### Step 7: Configure GitHub Actions Workflow

Create or update `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

permissions:
  contents: read
  id-token: write  # Required for requesting the JWT

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: 'projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_NAME/providers/PROVIDER_NAME'
          service_account: 'SERVICE_ACCOUNT_EMAIL'

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Build and Deploy
        run: |
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/accountplanning-pb
          gcloud run deploy accountplanning-pb \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/accountplanning-pb \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated
```

### Step 8: Verify the Setup

Test the authentication:

```bash
# From GitHub Actions, you should be able to authenticate successfully
# The workflow will automatically receive an OAuth 2.0 access token
# This token is short-lived and secure
```

## Security Best Practices

1. **Principle of Least Privilege**: Only grant the minimum required permissions to the service account
2. **Attribute Conditions**: Use attribute conditions to restrict which repositories can authenticate
3. **Regular Audits**: Periodically review IAM bindings and remove unused permissions
4. **No Service Account Keys**: Never create or use service account keys when Workload Identity Federation is available
5. **Token Lifetime**: OAuth 2.0 tokens are automatically rotated and have short lifetimes

## Troubleshooting

### Error: "Permission denied on service account"

**Solution**: Ensure the Workload Identity Pool has `roles/iam.workloadIdentityUser` on the service account:
```bash
gcloud iam service-accounts get-iam-policy ${SERVICE_ACCOUNT_EMAIL}
```

### Error: "Unable to generate access token"

**Solution**: Verify that:
1. The service account email is correct
2. The workload identity provider is properly configured
3. The attribute mapping matches your repository
4. The GitHub Actions workflow has `id-token: write` permission

### Error: "Workload Identity Pool not found"

**Solution**: Ensure the Workload Identity Pool is created in the correct project and location:
```bash
gcloud iam workload-identity-pools list --location=global --project=${PROJECT_ID}
```

## References

- [Google Cloud Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions with Google Cloud](https://github.com/google-github-actions/auth)
- [IAM Roles for Cloud Run](https://cloud.google.com/run/docs/reference/iam/roles)
- [OAuth 2.0 for Google APIs](https://developers.google.com/identity/protocols/oauth2)

## Summary

By following these steps, you will have:
- ✅ Created a Google Cloud Service Account with appropriate permissions
- ✅ Set up a Workload Identity Pool for GitHub Actions
- ✅ Granted `roles/iam.workloadIdentityUser` to the Workload Identity Pool
- ✅ Configured secure authentication without service account keys
- ✅ Enabled GitHub Actions to generate OAuth 2.0 access tokens for deployment

This setup allows GitHub Actions to securely authenticate and deploy to Google Cloud Run without storing any long-lived credentials.
