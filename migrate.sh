#!/bin/bash
# Helper script to migrate git remote to the company repository and verify build

# Exit immediately if a command exits with a non-zero status
set -e

# --- CONFIGURATION ---
# Toggle between SSH and HTTPS URL.
# SSH (Recommended for private repos if keys are setup): git@github.com:Newrro/N_Flow.git
# HTTPS: https://github.com/Newrro/N_Flow.git
REMOTE_URL="https://github.com/Newrro/N_Flow.git"
# ---------------------

echo "============================================"
echo " Starting Git Migration to Company Repository"
echo "============================================"

# Rename existing remote origin to personal-origin if it exists
if git remote | grep -q "^origin$"; then
    # Check if origin already points to the new repo
    CURRENT_URL=$(git remote get-url origin)
    if [[ "$CURRENT_URL" == *"$REMOTE_URL"* ]]; then
        echo "--> 'origin' already points to the target repository."
    else
        # If it points to the old repository, rename it
        if [[ "$CURRENT_URL" == *"Parth-Harmalkar"* ]]; then
            echo "--> Renaming existing personal remote 'origin' to 'personal-origin'..."
            git remote rename origin personal-origin
            echo "--> Adding new remote 'origin' pointing to: $REMOTE_URL"
            git remote add origin "$REMOTE_URL"
        else
            echo "--> Updating existing 'origin' remote URL to: $REMOTE_URL"
            git remote set-url origin "$REMOTE_URL"
        fi
    fi
else
    echo "--> Adding new remote 'origin' pointing to: $REMOTE_URL"
    git remote add origin "$REMOTE_URL"
fi

# Commit any pending changes (e.g., package.json devDependencies fix)
if [ -n "$(git status --porcelain)" ]; then
    echo "--> Detected uncommitted changes. Committing them..."
    git add -A
    git commit -m "fix: add missing @types/ws dependency"
fi

# Push main branch to the new remote
echo "--> Pushing main branch to company repository..."
echo "Note: Make sure you have created the empty repository on https://github.com/Newrro/N_Flow first."
git push -u origin main

echo "--> Push completed successfully!"

# Run local verification build
echo ""
echo "============================================"
echo " Verifying Local Next.js Build"
echo "============================================"

cd frontend

echo "--> Installing/updating dependencies..."
npm install
echo "--> Running local build..."
npm run build

echo ""
echo "============================================"
echo " Migration & Verification Successful!"
echo "============================================"

