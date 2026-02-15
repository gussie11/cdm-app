#!/bin/bash
cd "/Users/gregoryswanson/CDM App/backend"
echo "Installing dependencies..."
python3 -m pip install -r requirements.txt
echo "Starting backend..."
python3 main.py
