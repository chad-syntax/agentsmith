#!/bin/bash

# Exit immediately on error
set -e

# Config
DEFAULT_BRANCH="develop"
TEMP_BRANCH="sdk-staging-temp"

# Get version from sdk/package.json
VERSION=$(jq -r .version sdk/package.json)
RELEASE_BRANCH="sdk-release-staging@$VERSION"

# Make sure we're on the default branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$DEFAULT_BRANCH" ]; then
  echo "⚠️  You must be on '$DEFAULT_BRANCH' branch to run this script."
  exit 1
fi

# Delete temp branch if it exists
if git show-ref --quiet refs/heads/$TEMP_BRANCH; then
  echo "🧹 Deleting existing $TEMP_BRANCH branch..."
  git branch -D $TEMP_BRANCH
fi

# Create temp branch
echo "🔀 Creating temporary branch: $TEMP_BRANCH"
git checkout -b $TEMP_BRANCH

# Install dependencies
echo "🔄 Installing dependencies..."
cd sdk
npm install

# Build SDK
echo "🏗️  Building SDK..."
# Set build env vars
(
  export NEXT_PUBLIC_SITE_URL="https://staging.agentsmith.app"
  export NEXT_PUBLIC_SUPABASE_URL="https://ehpaperavkeicrwhvsbx.supabase.co"
  export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocGFwZXJhdmtlaWNyd2h2c2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NTA3NTQsImV4cCI6MjA2MzMyNjc1NH0.rntsQRcyVBb9UTahY4LSq5o4vuUSYfZS6h4NUK8qme0"
  npm run build
)

cd ..

# Force add dist/ and node_modules/
echo "➕ Adding sdk/dist and sdk/node_modules..."
git add -f sdk/dist
git add -f sdk/node_modules

# Commit staging build
echo "📦 Committing staging SDK build..."
git commit -m "Build staging SDK $VERSION"

# Subtree split and push to release branch
echo "🌳 Splitting subtree to $RELEASE_BRANCH..."
git subtree split --prefix=sdk -b "$RELEASE_BRANCH"
git push -f origin "$RELEASE_BRANCH"

# Checkout default branch and clean up
echo "🔙 Switching back to $DEFAULT_BRANCH"
git checkout $DEFAULT_BRANCH

# Delete local temp branch if it exists
if git show-ref --quiet refs/heads/$TEMP_BRANCH; then
  echo "🧹 Deleting existing local temp branch $TEMP_BRANCH..."
  git branch -D $TEMP_BRANCH
fi

# Delete local release branch if it exists
if git show-ref --quiet refs/heads/"$RELEASE_BRANCH"; then
  echo "🧹 Deleting existing local release branch $RELEASE_BRANCH..."
  git branch -D "$RELEASE_BRANCH"
fi

echo "✅ Staging SDK release $VERSION pushed to $RELEASE_BRANCH!"