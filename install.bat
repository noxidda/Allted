@echo off
echo =======================================================
echo Installing Allted Python Dependencies & Setup
echo =======================================================
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
echo.
echo Setup Complete! Run 'python app.py' to launch Allted Web App or CLI.
pause
