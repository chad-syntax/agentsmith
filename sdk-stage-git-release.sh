#!/bin/bash

# Source the base release script
source ./sdk-release-base.sh

# Environment-specific configuration
NEXT_PUBLIC_SITE_URL="https://staging.agentsmith.dev"
NEXT_PUBLIC_SUPABASE_URL="https://ehpaperavkeicrwhvsbx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocGFwZXJhdmtlaWNyd2h2c2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NTA3NTQsImV4cCI6MjA2MzMyNjc1NH0.rntsQRcyVBb9UTahY4LSq5o4vuUSYfZS6h4NUK8qme0"

# Get base version from sdk/package.json
BASE_VERSION=$(jq -r .version ts-sdk/package.json)
PACKAGE_NAME="@agentsmith-app/staging-sdk"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is required but not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated with GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ Please authenticate with GitHub CLI first: gh auth login"
    exit 1
fi

# Check npm authentication
if ! check_npm_auth; then
    exit 1
fi

# Get the next staging version
VERSION=$(get_next_staging_version "$BASE_VERSION")

echo "🚀 Starting staging SDK release..."
echo "📦 Package: $PACKAGE_NAME"
echo "🏷️  Version: $VERSION"

# Build the SDK
build_sdk \
    "staging" \
    "$PACKAGE_NAME" \
    "$VERSION" \
    "$NEXT_PUBLIC_SITE_URL" \
    "$NEXT_PUBLIC_SUPABASE_URL" \
    "$NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Create git tag and GitHub release
RELEASE_NOTES="Staging SDK release $VERSION

This is a staging build pointing to the staging environment.
- Site URL: $NEXT_PUBLIC_SITE_URL
- Supabase: $NEXT_PUBLIC_SUPABASE_URL

Install with: \`npm install $PACKAGE_NAME@$VERSION\`"

create_git_release "$VERSION" "$RELEASE_NOTES" "true"

# Publish to npm (last, after git operations succeed)
publish_sdk "$PACKAGE_NAME" "$VERSION"

# Restore original package.json
restore_package_json

echo "✅ Staging SDK release $VERSION completed!"
echo "📦 Published to npm as $PACKAGE_NAME@$VERSION"
echo "🏷️  Git tag: sdk-v$VERSION"
echo "🚀 GitHub release created"