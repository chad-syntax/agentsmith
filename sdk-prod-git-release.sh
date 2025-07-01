#!/bin/bash

# Source the base release script
source ./sdk-release-base.sh

# Environment-specific configuration
NEXT_PUBLIC_SITE_URL="https://agentsmith.app"
NEXT_PUBLIC_SUPABASE_URL="https://jcnpgqhjaoppfhbkcnpv.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbnBncWhqYW9wcGZoYmtjbnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwMzA2OTUsImV4cCI6MjA1MzYwNjY5NX0.n_gN9QTv9qY7FlA8wyoww8Nd4PFv9EMiXiDgGOQ2Axw"

# Get version from sdk/package.json
VERSION=$(jq -r .version ts-sdk/package.json)
PACKAGE_NAME="@agentsmith-app/sdk"

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

# Check if this version has already been published
echo "🔍 Checking if version $VERSION has already been published..."
if check_npm_version "$PACKAGE_NAME" "$VERSION"; then
    echo "❌ Version $VERSION has already been published to npm!"
    echo "💡 Please bump the version in ts-sdk/package.json before running this script."
    exit 1
fi

echo "🚀 Starting production SDK release..."
echo "📦 Package: $PACKAGE_NAME"
echo "🏷️  Version: $VERSION"

# Build the SDK
build_sdk \
    "production" \
    "$PACKAGE_NAME" \
    "$VERSION" \
    "$NEXT_PUBLIC_SITE_URL" \
    "$NEXT_PUBLIC_SUPABASE_URL" \
    "$NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Create git tag and GitHub release
RELEASE_NOTES="Production SDK release $VERSION

This is a production build pointing to the production environment.
- Site URL: $NEXT_PUBLIC_SITE_URL
- Supabase: $NEXT_PUBLIC_SUPABASE_URL

Install with: \`npm install $PACKAGE_NAME@$VERSION\`"

create_git_release "$VERSION" "$RELEASE_NOTES" "false"

# Publish to npm (last, after git operations succeed)
publish_sdk "$PACKAGE_NAME" "$VERSION"

# Restore original package.json
restore_package_json

echo "✅ Production SDK release $VERSION completed!"
echo "📦 Published to npm as $PACKAGE_NAME@$VERSION"
echo "🏷️  Git tag: sdk-v$VERSION"
echo "🚀 GitHub release created"