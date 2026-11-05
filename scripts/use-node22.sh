#!/usr/bin/env bash
# Nixpacks sometimes plans Node 18, and its nodejs_22 package can be 22.11.
# Vite needs Node >=22.12 (util.styleText, engines ^20.19 || >=22.12).
set -euo pipefail

need_major=22
need_minor=12
prefix=/opt/node22
version=22.23.4

node_ok() {
  local raw major minor
  raw="$(node -v 2>/dev/null || true)"
  raw="${raw#v}"
  major="${raw%%.*}"
  minor="${raw#*.}"
  minor="${minor%%.*}"
  [[ "$major" =~ ^[0-9]+$ && "$minor" =~ ^[0-9]+$ ]] || return 1
  if (( major > need_major )); then
    return 0
  fi
  if (( major == need_major && minor >= need_minor )); then
    return 0
  fi
  return 1
}

if node_ok; then
  echo "Node $(node -v) meets >=${need_major}.${need_minor}"
  exit 0
fi

echo "Node $(node -v 2>/dev/null || echo missing) is below ${need_major}.${need_minor}; installing ${version}"
mkdir -p "$prefix"
curl -fsSL "https://nodejs.org/dist/v${version}/node-v${version}-linux-x64.tar.xz" | tar -xJ -C "$prefix" --strip-components=1
export PATH="$prefix/bin:$PATH"
hash -r || true
node -v
npm -v
node_ok
