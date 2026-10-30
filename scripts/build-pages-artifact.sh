#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
rm -rf _site
mkdir -p _site
# Explicit allowlist: never publish .git, .github, security reports or credentials.
test -f 'index.html' && cp -- 'index.html' _site/
test -f 'blueprint.html' && cp -- 'blueprint.html' _site/
test -f 'robots.txt' && cp -- 'robots.txt' _site/
test -f '.nojekyll' && cp -- '.nojekyll' _site/
test -d 'assets' && cp -R -- 'assets' _site/
test -f _site/index.html
echo "Reviewed static site artifact assembled; security approval is controlled by workflow."
