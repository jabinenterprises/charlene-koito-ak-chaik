#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  export DATABASE_URL="$DATABASE_URL"
fi

echo "Starting app without bootstrapping the database."
exec npm start
