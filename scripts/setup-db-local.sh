#!/usr/bin/env bash
set -euo pipefail

# Install PostgreSQL 16 if not already installed
if ! brew list postgresql@16 &>/dev/null; then
  brew install postgresql@16
fi

# Start the service if not running
brew services start postgresql@16

# Create the dev database (no-op if it already exists)
createdb priori_dev 2>/dev/null || echo "Database priori_dev already exists, skipping."

echo "Done. Connect with: postgresql://localhost/priori_dev"
