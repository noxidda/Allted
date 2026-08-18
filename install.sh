#!/usr/bin/env bash
echo "======================================================="
echo "Installing Allted Python Dependencies & Setup"
echo "======================================================="
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
echo ""
echo "Setup Complete! Run 'python3 app.py' to launch Allted Web App or CLI."
