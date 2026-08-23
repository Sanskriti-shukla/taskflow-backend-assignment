#!/usr/bin/env sh
set -e
[ -f .env ] || cp .env.example .env
docker compose up --build
