#!/usr/bin/env bash
# ============================================================
# Kinder Park Library System - Setup Script (Linux/Ubuntu/macOS)
# ============================================================

set -e

echo "🚀 Starting Kinder Park Library System Setup..."
echo "--------------------------------------------------"

# Step 1: Copy environment file if missing
if [ ! -f "backend/.env" ]; then
    echo "📋 Copying backend/.env.example to backend/.env..."
    cp backend/.env.example backend/.env
else
    echo "✅ backend/.env already exists."
fi

# Step 2: Backend Virtual Environment Setup
echo "🐍 Setting up Python Virtual Environment in backend/..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Created virtual environment in backend/venv."
fi

echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

cd ..

# Step 3: Frontend Setup
echo "⚛️ Setting up React Frontend in frontend/..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node package dependencies..."
    npm install
else
    echo "✅ Frontend node_modules already installed."
fi

cd ..

echo "--------------------------------------------------"
echo "🎉 Setup complete! Next Steps:"
echo "1. Ensure MySQL is running on your machine:"
echo "   sudo systemctl start mysql"
echo "2. Import the database schema or run reset_db & seed:"
echo "   cd backend && source venv/bin/activate && python reset_db.py --yes && python seed.py"
echo "3. Run Backend:"
echo "   cd backend && source venv/bin/activate && python run.py"
echo "4. Run Frontend:"
echo "   cd frontend && npm run dev"
echo "=================================================="
