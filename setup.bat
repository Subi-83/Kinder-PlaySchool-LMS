@echo off
REM ============================================================
REM Kinder Park Library System - Setup Script (Windows Command Prompt)
REM ============================================================

echo 🚀 Starting Kinder Park Library System Setup for Windows...
echo --------------------------------------------------

REM Step 1: Copy environment file if missing
if not exist "backend\.env" (
    echo 📋 Copying backend\.env.example to backend\.env...
    copy backend\.env.example backend\.env
) else (
    echo ✅ backend\.env already exists.
)

REM Step 2: Backend Virtual Environment Setup
echo 🐍 Setting up Python Virtual Environment in backend...
cd backend

if not exist "venv" (
    python -m venv venv
    echo ✅ Created virtual environment in backend\venv.
)

echo 📦 Installing Python dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
call venv\Scripts\deactivate.bat

cd ..

REM Step 3: Frontend Setup
echo ⚛️ Setting up React Frontend in frontend...
cd frontend

if not exist "node_modules" (
    echo 📦 Installing Node package dependencies...
    npm install
) else (
    echo ✅ Frontend node_modules already installed.
)

cd ..

echo --------------------------------------------------
echo 🎉 Setup complete! Next Steps:
echo 1. Ensure MySQL service is running (e.g. via Services, XAMPP, or command prompt: net start MySQL80)
echo 2. Import database schema or run database reset & seed:
echo    cd backend
echo    venv\Scripts\activate.bat
echo    python reset_db.py --yes
echo    python seed.py
echo 3. Run Backend:
echo    cd backend
echo    venv\Scripts\activate.bat
echo    python run.py
echo 4. Run Frontend:
echo    cd frontend
echo    npm run dev
echo ==================================================
pause
