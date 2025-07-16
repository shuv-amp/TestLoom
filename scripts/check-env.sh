#!/bin/bash

# TestLoom Environment Check Script
set -e

REQUIRED_VARS=("NODE_ENV" "PORT" "MONGODB_URI" "JWT_SECRET" "CORS_ORIGIN")

missing=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -ne 0 ]; then
  echo "❌ Missing required environment variables: ${missing[*]}"
  exit 1
else
  echo "✅ All required environment variables are set."
fi
