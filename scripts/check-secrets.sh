#!/usr/bin/env bash
# Pre-commit: bloquea archivos de entorno y patrones de secretos obvios.
set -euo pipefail

STAGED=$(git diff --cached --name-only --diff-filter=ACM || true)

for file in $STAGED; do
  case "$file" in
    .env|.env.local|.env.production|.env.development|.env.test)
      echo "ERROR: No commitear $file. Usa .env.example como plantilla."
      exit 1
      ;;
  esac

  if [[ "$file" == .env.* ]] && [[ "$file" != .env.example ]]; then
    echo "ERROR: No commitear $file."
    exit 1
  fi
done

# Escaneo de secretos en el diff staged (no en .env.example)
if git diff --cached -- . ':(exclude).env.example' | grep -E '(^\+.*(gsk_[A-Za-z0-9]+|sk_live_[A-Za-z0-9]+|SUPABASE_SERVICE_ROLE_KEY=eyJ|NEXTAUTH_SECRET=.+(?!genera-un-secreto)))' >/dev/null 2>&1; then
  echo "ERROR: Posible secreto detectado en el diff. Revisa antes de commitear."
  exit 1
fi

exit 0
