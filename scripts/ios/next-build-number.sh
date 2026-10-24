#!/usr/bin/env bash
# 查詢成功但沒有歷史build才由1開始；權限／網絡錯誤不能當作新App。
set -euo pipefail
if [[ ! "${APP_STORE_APP_ID:-}" =~ ^[1-9][0-9]*$ ]]; then
  echo '缺少有效APP_STORE_APP_ID。' >&2
  exit 1
fi
latest_build="$(app-store-connect get-latest-build-number "$APP_STORE_APP_ID" --platform IOS --all-versions)"
latest_build="${latest_build:-0}"
if [[ ! "$latest_build" =~ ^(0|[1-9][0-9]*)$ ]] || [[ ${#latest_build} -gt 10 ]] || [[ "$latest_build" -gt 2147483646 ]]; then
  echo 'Apple傳回的build號無法安全遞增；請核對App現有版本。' >&2
  exit 1
fi
printf '%s\n' "$((latest_build + 1))"
