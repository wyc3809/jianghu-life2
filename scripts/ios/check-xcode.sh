#!/usr/bin/env bash
# Apple自2026-04-28要求Xcode26／iOS26 SDK；部署最低系統與編譯SDK分開。
set -euo pipefail
xcodebuild -version
sdk_version="$(xcrun --sdk iphoneos --show-sdk-version)"
xcode_major="$(xcodebuild -version | awk '/^Xcode / {split($2,v,".");print v[1]}')"
if [ "$xcode_major" -lt 26 ] || [ "${sdk_version%%.*}" -lt 26 ]; then
  echo '需要Xcode26及iOS26 SDK或以上。' >&2
  exit 1
fi
printf 'iPhoneOS SDK %s\n' "$sdk_version"
