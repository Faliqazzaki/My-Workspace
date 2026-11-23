#!/usr/bin/env bash
# Quality gate ringkas. Cetak ✓ jika lulus, cetak 30 baris terakhir jika gagal.
FAIL=0
run() {
  local name=$1; shift
  local out
  if out=$("$@" 2>&1); then
    echo "✓ $name"
  else
    echo "✗ $name"
    echo "$out" | tail -n 30
    FAIL=1
  fi
}

run pint   vendor/bin/pint --dirty --test
run eslint npx eslint resources/js --quiet
run test   php artisan test --compact
run build  npm run build

exit $FAIL