#!/bin/bash

# Base release script - sourced by staging and production scripts
# Usage: source ./sdk-release-base.sh

# Exit immediately on error
set -e

# Function to check if version already exists on npm
check_npm_version() {
    local package_name=$1
    local version=$2
    
    # First check if package exists at all
    if ! npm view "$package_name" version >/dev/null 2>&1; then
        return 1  # Package doesn't exist, so version doesn't exist
    fi
    
    # Package exists, check specific version
    if npm view "$package_name@$version" version >/dev/null 2>&1; then
        return 0  # Version exists
    else
        return 1  # Version doesn't exist
    fi
}

# Function to get next staging version using git tags
get_next_staging_version() {
    local base_version=$1
    
    # Find the highest staging version for this base version from git tags
    local highest_staging=0
    
    # Get all tags that match the staging pattern for this base version
    local staging_tags=$(git tag -l "sdk-v${base_version}-staging.*" 2>/dev/null || echo "")
    
    if [ -n "$staging_tags" ]; then
        while IFS= read -r tag; do
            # Extract version from tag (sdk-v0.0.2-staging.1 -> 0.0.2-staging.1)
            local version=${tag#sdk-v}
            if [[ $version =~ ^${base_version}-staging\.([0-9]+)$ ]]; then
                local staging_num=${BASH_REMATCH[1]}
                if [ $staging_num -gt $highest_staging ]; then
                    highest_staging=$staging_num
                fi
            fi
        done <<< "$staging_tags"
    fi
    
    echo "${base_version}-staging.$((highest_staging + 1))"
}

# Function to check npm authentication
check_npm_auth() {
    echo "🔐 Checking npm authentication..."
    if ! npm whoami >/dev/null 2>&1; then
        echo "❌ You are not logged in to npm!"
        echo "💡 Please run: npm login"
        echo "💡 Or set NPM_TOKEN environment variable for CI/CD"
        return 1
    fi
    echo "✅ npm authentication verified"
    return 0
}

# Function to create git tag and release
create_git_release() {
    local version=$1
    local release_notes=$2
    local is_prerelease=$3
    local tag_name="sdk-v$version"
    
    echo "🏷️  Creating git tag: $tag_name"
    git tag -a "$tag_name" -m "SDK Release $version"
    
    echo "🚀 Pushing tag to remote..."
    git push origin "$tag_name"
    
    # Wait a moment for the tag to be available on GitHub
    echo "⏳ Waiting for tag to be available on GitHub..."
    sleep 2
    
    echo "📝 Creating GitHub release..."
    local gh_cmd="gh release create \"$tag_name\" --title \"SDK Release $version\" --notes \"$release_notes\""
    
    if [ "$is_prerelease" = "true" ]; then
        gh_cmd="$gh_cmd --prerelease --latest=false"
    fi
    
    eval $gh_cmd
}

# Function to build SDK (without publishing)
build_sdk() {
    local environment=$1
    local package_name=$2
    local version=$3
    local site_url=$4
    local supabase_url=$5
    local supabase_anon_key=$6
    
    echo "🔧 Configuring package for $environment environment..."
    echo "🌐 Site URL: $site_url"
    echo "🗄️  Supabase URL: $supabase_url"
    
    # Update package.json with correct name and version in place
    cd ts-sdk
    jq --arg name "$package_name" --arg version "$version" \
        '.name = $name | .version = $version' package.json > package.json.tmp && mv package.json.tmp package.json
    
    # Install dependencies
    echo "🔄 Installing dependencies..."
    npm install
    
    # Build SDK with environment-specific variables
    echo "🏗️  Building SDK for $environment..."
    (
        export NEXT_PUBLIC_SITE_URL="$site_url"
        export NEXT_PUBLIC_SUPABASE_URL="$supabase_url"
        export NEXT_PUBLIC_SUPABASE_ANON_KEY="$supabase_anon_key"
        npm run build
    )
    
    cd ..
    
    # Force add dist/ and node_modules/
    # echo "➕ Adding ts-sdk/dist and ts-sdk/node_modules..."
    # git add -f ts-sdk/dist
    # git add -f ts-sdk/node_modules
    # git add ts-sdk/package.json
    
    # # Commit build
    # echo "📦 Committing $environment SDK build..."
    # git commit -m "Build $environment SDK $version"
    
    echo "✅ $environment SDK $version built successfully!"
}

# Function to publish SDK to npm
publish_sdk() {
    local package_name=$1
    local version=$2
    
    echo "📤 Publishing to npm..."
    cd ts-sdk
    npm publish --access public
    cd ..
    
    echo "✅ Published $package_name@$version to npm!"
}

# Function to restore original package.json
restore_package_json() {
    echo "🔄 Restoring original package.json..."
    cd ts-sdk
    git checkout package.json package-lock.json
    cd ..
} 