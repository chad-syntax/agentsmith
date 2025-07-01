#!/bin/bash

# Base release script - sourced by staging and production scripts
# Usage: source ./sdk-release-base.sh

# Exit immediately on error
set -e

# Function to check if version already exists on npm
check_npm_version() {
    local package_name=$1
    local version=$2
    
    if npm view "$package_name@$version" version >/dev/null 2>&1; then
        return 0  # Version exists
    else
        return 1  # Version doesn't exist
    fi
}

# Function to get next staging version
get_next_staging_version() {
    local base_version=$1
    local package_name="@agentsmith-app/staging-sdk"
    
    # Find the highest staging version for this base version
    local highest_staging=0
    local published_versions=$(npm view "$package_name" versions --json 2>/dev/null || echo "[]")
    
    # Parse published versions to find the highest staging number
    if [ "$published_versions" != "[]" ]; then
        local versions_list=$(echo "$published_versions" | jq -r '.[]' 2>/dev/null || echo "")
        if [ -n "$versions_list" ]; then
            while IFS= read -r version; do
                if [[ $version =~ ^${base_version}-staging\.([0-9]+)$ ]]; then
                    local staging_num=${BASH_REMATCH[1]}
                    if [ $staging_num -gt $highest_staging ]; then
                        highest_staging=$staging_num
                    fi
                fi
            done <<< "$versions_list"
        fi
    fi
    
    echo "${base_version}-staging.$((highest_staging + 1))"
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
    
    echo "📝 Creating GitHub release..."
    local gh_cmd="gh release create \"$tag_name\" --title \"SDK Release $version\" --notes \"$release_notes\" --target \"$tag_name\""
    
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
    
    # Create temporary package.json for this build
    local temp_package_json="ts-sdk/package.json.temp"
    cp ts-sdk/package.json "$temp_package_json"
    
    # Update package.json with correct name and version
    jq --arg name "$package_name" --arg version "$version" \
        '.name = $name | .version = $version' "$temp_package_json" > ts-sdk/package.json
    
    # Install dependencies
    echo "🔄 Installing dependencies..."
    cd ts-sdk
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
    local temp_package_json="ts-sdk/package.json.temp"
    
    if [ -f "$temp_package_json" ]; then
        echo "🔄 Restoring original package.json..."
        mv "$temp_package_json" ts-sdk/package.json
        git checkout ts-sdk/package.json
    fi
} 