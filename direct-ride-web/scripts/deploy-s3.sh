#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${APP_DIR}/dist"

require_env() {
  local name="$1"

  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

require_env "AWS_REGION"
require_env "S3_BUCKET"

if [[ ! -d "${DIST_DIR}" ]]; then
  echo "Build output not found at ${DIST_DIR}. Run npm run build first." >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI is required to deploy. Install it or run from CI with aws-actions configured." >&2
  exit 1
fi

echo "Deploying ${DIST_DIR} to s3://${S3_BUCKET} in ${AWS_REGION}..."

aws s3 sync "${DIST_DIR}/" "s3://${S3_BUCKET}/" \
  --region "${AWS_REGION}" \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "*.json" \
  --exclude "*.webmanifest"

aws s3 sync "${DIST_DIR}/" "s3://${S3_BUCKET}/" \
  --region "${AWS_REGION}" \
  --cache-control "public,max-age=0,must-revalidate" \
  --exclude "*" \
  --include "index.html" \
  --include "*.json" \
  --include "*.webmanifest"

if [[ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]]; then
  echo "Creating CloudFront invalidation for ${CLOUDFRONT_DISTRIBUTION_ID}..."
  aws cloudfront create-invalidation \
    --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
    --paths "/*"
fi

echo "Deployment complete."
