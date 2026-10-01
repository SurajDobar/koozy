#!/usr/bin/env bash
# Render build script for Koozy backend
set -o errexit

echo ">>> Upgrading pip..."
pip install --upgrade pip

echo ">>> Installing Python requirements..."
pip install -r backend/requirements.txt

echo ">>> Running database migrations..."
python backend/manage.py migrate --no-input

echo ">>> Collecting static files..."
python backend/manage.py collectstatic --no-input

echo ">>> Render backend build successfully completed!"
